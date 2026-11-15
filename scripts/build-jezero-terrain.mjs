#!/usr/bin/env node
/**
 * ARES Phase 3 — Node terrain pipeline (D-008).
 *
 * Converts the verified USGS CTX 20 m Jezero DEM GeoTIFF into web assets:
 *   - heightmap_rg16.png   : 8-bit RGB PNG with 16-bit elevation packed into
 *                            R (low byte) and G (high byte) of a uint16 value.
 *                            B is set to 0 and ignored. This gives 16-bit precision
 *                            over the local elevation range while remaining a
 *                            standard PNG that canvas/WebGL can sample directly.
 *   - slope_degrees.png    : 8-bit grayscale slope (degrees / 90 * 255)
 *   - metadata.json        : source citation, bbox, range, thresholds
 *
 * No Python is used on this machine; all processing is via geotiff.js + sharp.
 */

import { fromFile } from 'geotiff'
import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const INPUT = 'source-data/jezero_ctx_dem_20m.tif'
const OUT_DIR = 'public/data'
const MARS_RADIUS_M = 3_396_190 // product radius, USGS page

// Slope-class thresholds from docs/SCIENTIFIC_MODELS.md (§ terrain / slopes)
const SLOPE_THRESHOLDS = {
  flat: { maxDeg: 5, label: 'Flat to gently sloping' },
  moderate: { maxDeg: 15, label: 'Moderate slope' },
  steep: { maxDeg: 25, label: 'Steep slope' },
  hazardous: { maxDeg: 90, label: 'Hazardous / impassable' },
}

async function main() {
  const tiff = await fromFile(INPUT)
  const image = await tiff.getImage()
  const width = image.getWidth()
  const height = image.getHeight()
  const [xMin, yMin, xMax, yMax] = image.getBoundingBox()
  const [resX, resY] = image.getResolution()
  const pixelSize = Math.abs(resX) // 20 m

  // Read the single-band float32 elevation raster
  const raster = await image.readRasters({ samples: [0] })
  const elev = raster[0]

  // Basic statistics (ignore NaN if present)
  let minElev = Infinity
  let maxElev = -Infinity
  let nanCount = 0
  for (let i = 0; i < elev.length; i++) {
    const v = elev[i]
    if (Number.isNaN(v)) {
      nanCount++
      continue
    }
    if (v < minElev) minElev = v
    if (v > maxElev) maxElev = v
  }

  // Derive geodetic bounds from the equirectangular projected bbox
  // (product name: Eqc_latTs0_lon0 -> x = R * lonRad, y = R * latRad)
  const lonMin = xMin / MARS_RADIUS_M
  const lonMax = xMax / MARS_RADIUS_M
  const latMin = yMin / MARS_RADIUS_M
  const latMax = yMax / MARS_RADIUS_M

  // Heightmap: 8-bit RGB PNG; elevation encoded in R (low byte) + G (high byte).
  const elevRange = maxElev - minElev
  const hRaw = Buffer.alloc(width * height * 3) // R, G, B

  // Slope grid: 8-bit normalized degrees
  const slopeRaw = Buffer.alloc(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const e = Number.isNaN(elev[idx]) ? minElev : elev[idx]

      // Pack elevation into uint16, then RG8 (B = 0)
      const normalized = elevRange === 0 ? 0 : (e - minElev) / elevRange
      const u16 = Math.max(0, Math.min(65535, Math.round(normalized * 65535)))
      hRaw[idx * 3] = u16 & 0xff
      hRaw[idx * 3 + 1] = (u16 >>> 8) & 0xff
      hRaw[idx * 3 + 2] = 0

      // Slope (Horn-like finite differences, 20 m spacing)
      const xm1 = Math.max(0, x - 1)
      const xp1 = Math.min(width - 1, x + 1)
      const ym1 = Math.max(0, y - 1)
      const yp1 = Math.min(height - 1, y + 1)
      const dx = pixelSize * (xp1 - xm1)
      const dy = pixelSize * (yp1 - ym1)
      const dzdx = ((elev[ym1 * width + xp1] - elev[ym1 * width + xm1]) +
                    2 * (elev[y * width + xp1] - elev[y * width + xm1]) +
                    (elev[yp1 * width + xp1] - elev[yp1 * width + xm1])) / (8 * dx)
      const dzdy = ((elev[yp1 * width + xm1] - elev[ym1 * width + xm1]) +
                    2 * (elev[yp1 * width + x] - elev[ym1 * width + x]) +
                    (elev[yp1 * width + xp1] - elev[ym1 * width + xp1])) / (8 * dy)
      const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy))
      const slopeDeg = slopeRad * (180 / Math.PI)
      slopeRaw[idx] = Math.max(0, Math.min(255, Math.round((slopeDeg / 90) * 255)))
    }
  }

  const heightmapPath = path.join(OUT_DIR, 'jezero_heightmap_rg16.png')
  const slopePath = path.join(OUT_DIR, 'jezero_slope_degrees.png')
  const metaPath = path.join(OUT_DIR, 'jezero_metadata.json')

  await sharp(hRaw, { raw: { width, height, channels: 3 } })
    .png({ bitdepth: 8, compressionLevel: 9 })
    .toFile(heightmapPath)

  await sharp(slopeRaw, { raw: { width, height, channels: 1 } })
    .png({ bitdepth: 8, compressionLevel: 9 })
    .toFile(slopePath)

  const metadata = {
    region: 'Jezero Crater (Mars 2020 landing site)',
    product: {
      label: 'Mars 2020 Terrain Relative Navigation CTX DTM Mosaic',
      resolutionMeters: 20,
      bitDepth: 32,
      bands: 1,
      width,
      height,
      projection: 'Equirectangular (Eqc_latTs0_lon0)',
      planetocentric: true,
      longitudeDirection: 'Positive East',
      longitudeDomain: '-180 to 180',
    },
    elevation: {
      minMeters: round4(minElev),
      maxMeters: round4(maxElev),
      units: 'meters relative to MOLA areoid',
      kind: 'measured',
      sourceUrl: 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif',
      sourceLabel: 'USGS Astrogeology Science Center — Mars 2020 TRN CTX DTM Mosaic',
      citation: 'Fergason, R. L., Hare, T. M., Mayer, D. P., Galuszka, D. M., Redding, B. L., Smith, E. D., Shinaman, J. R., Cheng, Y., Otero, R. E., 2020',
      doi: 'https://doi.org/10.5066/P906QQT8',
    },
    bbox: {
      west: round6(lonMin * (180 / Math.PI)),
      east: round6(lonMax * (180 / Math.PI)),
      south: round6(latMin * (180 / Math.PI)),
      north: round6(latMax * (180 / Math.PI)),
      derivedFrom: 'projected bounding box divided by Mars radius 3396190 m (equirectangular latTs=0)',
      coordinateAccuracy: 'approximate',
    },
    heightmapEncoding: {
      format: 'RGB8 PNG (R+G encode elevation)',
      rChannel: 'low 8 bits of uint16 normalized elevation',
      gChannel: 'high 8 bits of uint16 normalized elevation',
      bChannel: 'unused (set to 0)',
      unpack: 'uint16 = R + G * 256; elevation = minMeters + uint16 / 65535 * (maxMeters - minMeters)',
      precisionMeters: round4(elevRange / 65535),
      path: 'jezero_heightmap_rg16.png',
    },
    slopeEncoding: {
      format: 'L8 PNG',
      units: 'degrees / 90 * 255',
      decode: 'slopeDeg = pixel / 255 * 90',
      path: 'jezero_slope_degrees.png',
      thresholds: SLOPE_THRESHOLDS,
    },
    generatedAt: new Date().toISOString(),
  }

  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2))

  const hStat = await fs.stat(heightmapPath)
  const sStat = await fs.stat(slopePath)

  console.log('Pipeline complete:')
  console.log(`  elevation range: ${minElev.toFixed(2)} .. ${maxElev.toFixed(2)} m`)
  console.log(`  heightmap: ${heightmapPath} (${(hStat.size / 1024).toFixed(1)} kB)`)
  console.log(`  slope:     ${slopePath} (${(sStat.size / 1024).toFixed(1)} kB)`)
  console.log(`  metadata:  ${metaPath}`)
  if (nanCount) console.log(`  NaN pixels replaced: ${nanCount}`)
}

function round4(n) {
  return Math.round(n * 10000) / 10000
}
function round6(n) {
  return Math.round(n * 1000000) / 1000000
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
