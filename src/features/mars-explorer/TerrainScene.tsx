import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { RegionConfig } from './regionConfig'

/**
 * 3D Jezero terrain view (Module C).
 *
 * A displaced plane whose vertices read the RG-encoded heightmap (R = low byte, G = high byte
 * of a uint16 normalized elevation). The fragment shader colors the surface by slope class.
 * Vertical scale is exaggerated for visual legibility — the panel labels it as such.
 */

interface TerrainSceneProps {
  config: RegionConfig
  demMetadata: {
    elevation: { minMeters: number; maxMeters: number }
    bbox: { west: number; south: number; east: number; north: number }
  } | null
  verticalScale?: number
}

const VERTEX_SHADER = /* glsl */ `
  uniform sampler2D uHeightmap;
  uniform float uMinElev;
  uniform float uMaxElev;
  uniform float uVerticalScale;

  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec4 texel = texture2D(uHeightmap, uv);
    float h16 = texel.r * 255.0 + texel.g * 255.0 * 256.0;
    float elevationM = uMinElev + (h16 / 65535.0) * (uMaxElev - uMinElev);
    vElevation = elevationM;

    vec3 pos = position;
    pos.z += elevationM * uVerticalScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uSlopemap;
  uniform float uMinElev;
  uniform float uMaxElev;

  varying vec2 vUv;
  varying float vElevation;

  // Slope-class colors matching the 2D HUD (docs/SCIENTIFIC_MODELS.md)
  vec3 colorFlat = vec3(0.204, 0.839, 0.224);      // #34d399 success
  vec3 colorModerate = vec3(0.984, 0.753, 0.141);  // #fbbf24 amber
  vec3 colorSteep = vec3(0.957, 0.420, 0.247);     // #e56b3f accent
  vec3 colorHazard = vec3(0.973, 0.443, 0.443);    // #f87171 danger

  void main() {
    float slopeNorm = texture2D(uSlopemap, vUv).r; // 0..1 => 0..90 deg
    float slopeDeg = slopeNorm * 90.0;

    vec3 slopeCol;
    if (slopeDeg < 5.0) {
      slopeCol = colorFlat;
    } else if (slopeDeg < 15.0) {
      slopeCol = mix(colorFlat, colorModerate, (slopeDeg - 5.0) / 10.0);
    } else if (slopeDeg < 25.0) {
      slopeCol = mix(colorModerate, colorSteep, (slopeDeg - 15.0) / 10.0);
    } else {
      slopeCol = mix(colorSteep, colorHazard, clamp((slopeDeg - 25.0) / 15.0, 0.0, 1.0));
    }

    // Subtle elevation shading mixed in so the relief reads even on flat terrain
    float t = clamp((vElevation - uMinElev) / (uMaxElev - uMinElev), 0.0, 1.0);
    vec3 lowCol = vec3(0.271, 0.337, 0.455);  // cool lowlands
    vec3 highCol = vec3(0.827, 0.651, 0.420); // warm highlands
    vec3 elevCol = mix(lowCol, highCol, t);

    vec3 finalCol = mix(elevCol, slopeCol, 0.55);
    gl_FragColor = vec4(finalCol, 1.0);
  }
`

export function TerrainScene({ config, demMetadata, verticalScale = 2.5 }: TerrainSceneProps) {
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null
  const camera = useThree((state) => state.camera)
  const initialized = useRef(false)

  const heightmapUrl = config.dem.heightmapPath
  const slopeUrl = config.dem.slopePath

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const heightmap = loader.load(heightmapUrl)
    heightmap.colorSpace = THREE.NoColorSpace
    heightmap.minFilter = THREE.LinearFilter
    heightmap.magFilter = THREE.LinearFilter

    const slopemap = loader.load(slopeUrl)
    slopemap.colorSpace = THREE.NoColorSpace
    slopemap.minFilter = THREE.LinearFilter
    slopemap.magFilter = THREE.LinearFilter

    return { heightmap, slopemap }
  }, [heightmapUrl, slopeUrl])

  useEffect(
    () => () => {
      textures.heightmap.dispose()
      textures.slopemap.dispose()
    },
    [textures],
  )

  const minElev = demMetadata?.elevation.minMeters ?? -3000
  const maxElev = demMetadata?.elevation.maxMeters ?? -1000

  const { widthKm, heightKm } = useMemo(() => {
    const { bbox } = config
    // Approximate km dimensions at the region latitude using Mars mean radius
    const R = 3_389_500
    const latRad = (bbox.south + bbox.north) * 0.5 * (Math.PI / 180)
    const widthKm = ((bbox.east - bbox.west) * (Math.PI / 180)) * R * Math.cos(latRad) / 1000
    const heightKm = ((bbox.north - bbox.south) * (Math.PI / 180)) * R / 1000
    return { widthKm, heightKm }
  }, [config])

  // Initial camera position: looking from the southwest down at the crater
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    camera.position.set(-widthKm * 0.7, -heightKm * 0.7, Math.max(widthKm, heightKm) * 0.55)
    controls?.update()
  }, [camera, controls, widthKm, heightKm])

  useFrame(() => {
    controls?.update()
  })

  // Plane segments: enough for smooth displacement without over-tessellating
  const segmentsX = 180
  const segmentsY = Math.max(10, Math.round(segmentsX * (heightKm / widthKm)))

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 10]} intensity={1.2} />
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[widthKm, heightKm, segmentsX, segmentsY]} />
        <shaderMaterial
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={{
            uHeightmap: { value: textures.heightmap },
            uSlopemap: { value: textures.slopemap },
            uMinElev: { value: minElev },
            uMaxElev: { value: maxElev },
            uVerticalScale: { value: verticalScale / 1000 }, // m -> km
          }}
        />
      </mesh>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={80}
      />
    </>
  )
}
