/**
 * Sample elevation and slope from the committed pipeline outputs.
 *
 * The heightmap is an 8-bit RGB PNG: R = low byte, G = high byte of a uint16 value that
 * linearly maps [minElevation, maxElevation]. The slope map is an 8-bit grayscale PNG where
 * pixel/255 * 90 = slope in degrees.
 */

export interface TerrainSample {
  elevationMeters: number
  slopeDegrees: number
  elevationKind: 'measured'
  slopeKind: 'derived'
}

export interface ElevationMetadata {
  elevation: {
    minMeters: number
    maxMeters: number
    kind: string
  }
  bbox: {
    west: number
    south: number
    east: number
    north: number
  }
}

export class TerrainSampler {
  private heightCanvas: HTMLCanvasElement | null = null
  private slopeCanvas: HTMLCanvasElement | null = null
  private metadata: ElevationMetadata | null = null
  private loaded = false
  private error: Error | null = null

  constructor(
    private heightmapUrl: string,
    private slopeUrl: string,
    private metadataUrl: string,
  ) {}

  async load(): Promise<void> {
    if (this.loaded || this.error) return
    try {
      const metaRes = await fetch(this.metadataUrl)
      if (!metaRes.ok) throw new Error(`Metadata fetch failed: ${metaRes.status}`)
      this.metadata = (await metaRes.json()) as ElevationMetadata

      const [heightmap, slopemap] = await Promise.all([
        loadImage(this.heightmapUrl),
        loadImage(this.slopeUrl),
      ])

      this.heightCanvas = document.createElement('canvas')
      this.heightCanvas.width = heightmap.width
      this.heightCanvas.height = heightmap.height
      this.heightCanvas.getContext('2d')?.drawImage(heightmap, 0, 0)

      this.slopeCanvas = document.createElement('canvas')
      this.slopeCanvas.width = slopemap.width
      this.slopeCanvas.height = slopemap.height
      this.slopeCanvas.getContext('2d')?.drawImage(slopemap, 0, 0)

      this.loaded = true
    } catch (err) {
      this.error = err instanceof Error ? err : new Error(String(err))
      throw this.error
    }
  }

  sample(lat: number, lon: number): TerrainSample | null {
    if (!this.loaded || !this.metadata || !this.heightCanvas || !this.slopeCanvas) return null
    const { bbox, elevation } = this.metadata
    if (
      lon < bbox.west ||
      lon > bbox.east ||
      lat < bbox.south ||
      lat > bbox.north
    ) {
      return null
    }

    const x = ((lon - bbox.west) / (bbox.east - bbox.west)) * this.heightCanvas.width
    const y = ((bbox.north - lat) / (bbox.north - bbox.south)) * this.heightCanvas.height
    const px = Math.max(0, Math.min(this.heightCanvas.width - 1, Math.floor(x)))
    const py = Math.max(0, Math.min(this.heightCanvas.height - 1, Math.floor(y)))

    const hCtx = this.heightCanvas.getContext('2d', { willReadFrequently: true })
    const sCtx = this.slopeCanvas.getContext('2d', { willReadFrequently: true })
    if (!hCtx || !sCtx) return null

    const hPixel = hCtx.getImageData(px, py, 1, 1).data
    const sPixel = sCtx.getImageData(px, py, 1, 1).data

    const u16 = hPixel[0] + (hPixel[1] << 8)
    const elevationMeters =
      elevation.minMeters + (u16 / 65535) * (elevation.maxMeters - elevation.minMeters)
    const slopeDegrees = (sPixel[0] / 255) * 90

    return {
      elevationMeters,
      slopeDegrees,
      elevationKind: 'measured',
      slopeKind: 'derived',
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}
