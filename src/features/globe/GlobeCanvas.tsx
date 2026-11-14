import { Component, type ReactNode, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import type { LatLon } from '@/types/geo'
import type { PointOfInterest } from '@/types/poi'
import {
  GLOBE_INITIAL_DISTANCE,
  GLOBE_INITIAL_FOCUS,
  latLonToSpherePosition,
  spherePositionToLatLon,
  type GlobeTier,
} from './math'
import { GlobeFallback } from './GlobeFallback'
import { MarsScene } from './scene/MarsScene'

/**
 * WebGL canvas wrapper: probes WebGL support, applies the tier's DPR cap and tone mapping
 * (`flat` = no tone mapping, so NASA mosaic colors reach the screen unfiltered), and falls
 * back honestly when 3D is impossible. Mounts `MarsScene` only after the mosaic canvas exists
 * — the scene itself is pure, no suspense boundaries needed.
 */
interface GlobeCanvasProps {
  canvas: HTMLCanvasElement
  tier: GlobeTier
  places: PointOfInterest[]
  selectedId: string | null
  focus: LatLon | null
  focusNonce: number
  reducedMotion: boolean
  graticule: boolean
  autoRotate: boolean
  onPlaceSelect: (place: PointOfInterest) => void
  onFpsSample: (fps: number) => void
  onCursorLatLon: (coord: LatLon | null) => void
}

function detectWebGL(): boolean {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
  } catch {
    return false
  }
}

export function GlobeCanvas(props: GlobeCanvasProps) {
  const [supported] = useState(detectWebGL)
  if (!supported) return <GlobeFallback reason="no-webgl" />

  const initial = latLonToSpherePosition(GLOBE_INITIAL_FOCUS, GLOBE_INITIAL_DISTANCE)

  return (
    <GlobeSceneBoundary>
      <Canvas
        flat
        dpr={[1, props.tier.dprCap]}
        camera={{ fov: 40, near: 0.05, far: 60, position: [initial.x, initial.y, initial.z] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        aria-label="Interactive 3D Mars globe — drag to rotate, scroll or pinch to zoom"
        onPointerMissed={() => props.onCursorLatLon(null)}
      >
        <MarsScene
          canvas={props.canvas}
          tier={props.tier}
          places={props.places}
          selectedId={props.selectedId}
          focus={props.focus}
          focusNonce={props.focusNonce}
          reducedMotion={props.reducedMotion}
          graticule={props.graticule}
          autoRotate={props.autoRotate}
          onPlaceSelect={props.onPlaceSelect}
          onFpsSample={props.onFpsSample}
          onCursorLocalPoint={(local) => {
            if (!local) {
              props.onCursorLatLon(null)
              return
            }
            props.onCursorLatLon(spherePositionToLatLon(local))
          }}
        />
      </Canvas>
    </GlobeSceneBoundary>
  )
}

/** Scene-local guard: a crashed WebGL context degrades to the honest fallback, not a white screen. */
class GlobeSceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state: { failed: boolean } = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  override componentDidCatch(error: Error): void {
    console.error('ARES globe scene error:', error)
  }

  override render(): ReactNode {
    if (this.state.failed) return <GlobeFallback reason="webgl-error" />
    return this.props.children
  }
}
