import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { LatLon } from '@/types/geo'
import type { PointOfInterest } from '@/types/poi'
import {
  GLOBE_FLY_TO_DISTANCE,
  GLOBE_IDLE_SPIN,
  latLonToSpherePosition,
  type GlobeTier,
} from '../math'
import { MarsGlobeMesh } from './MarsGlobeMesh'
import { AtmosphereShell } from './AtmosphereShell'
import { GraticuleMesh } from './GraticuleMesh'
import { PoiMarkers } from './PoiMarkers'

/**
 * Scene root: lighting, the (possibly rotating) planet group — globe mesh, graticule and
 * markers so they spin together — plus the atmosphere shell, camera flight and FPS probe.
 * One render loop, everything disposed through r3f's lifecycle or explicit cleanup above.
 */
interface MarsSceneProps {
  canvas: HTMLCanvasElement | null
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
  onCursorLocalPoint?: (localPoint: THREE.Vector3 | null) => void
}

export function MarsScene({
  canvas,
  tier,
  places,
  selectedId,
  focus,
  focusNonce,
  reducedMotion,
  graticule,
  autoRotate,
  onPlaceSelect,
  onFpsSample,
  onCursorLocalPoint,
}: MarsSceneProps) {
  const groupRef = useRef<THREE.Group>(null)
  const flyRef = useRef<{ destination: THREE.Vector3 } | null>(null)
  const lastCursorEmit = useRef(0)
  const fpsAcc = useRef({ frames: 0, seconds: 0 })
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null
  const camera = useThree((state) => state.camera)

  // Sun fixed over the 40°E meridian, 12°N: Jezero (77°E, the initial camera focus) sits
  // within the lit hemisphere with a visible terminator for depth. Static — a true
  // day/night cycle is a later-phase refinement (docs/DEVELOPMENT_ROADMAP.md Phase 2).
  const sunPosition = latLonToSpherePosition({ lat: 12, lon: 40 }, 10)

  const spinning = autoRotate && !selectedId && focus === null && !reducedMotion

  useFrame((state, delta) => {
    // Idle spin of the planet group (globe + grid + markers together).
    if (spinning && groupRef.current) {
      groupRef.current.rotation.y += delta * GLOBE_IDLE_SPIN
    }

    // Camera flight toward the focused site.
    const fly = flyRef.current
    if (fly) {
      const k = 1 - Math.exp(-3.2 * delta)
      state.camera.position.lerp(fly.destination, k)
      controls?.update()
      if (state.camera.position.distanceTo(fly.destination) < 0.02) flyRef.current = null
    }

    // FPS probe: emit a half-second rolling sample for the HUD + adaptive quality.
    const acc = fpsAcc.current
    acc.frames += 1
    acc.seconds += delta
    if (acc.seconds >= 0.5) {
      onFpsSample(acc.frames / acc.seconds)
      acc.frames = 0
      acc.seconds = 0
    }
  })

  // Recompute the fly destination when a new focus is requested. focusNonce is the deliberate
  // trigger (re-selecting the same site must re-fly), so it is the effect's dependency.
  useEffect(() => {
    if (!focus) return
    const local = latLonToSpherePosition(focus, 1)
    const rotationY = groupRef.current?.rotation.y ?? 0
    const rotated = rotateAroundY(local, rotationY)
    const destination = new THREE.Vector3(rotated.x, rotated.y, rotated.z)
      .normalize()
      .multiplyScalar(GLOBE_FLY_TO_DISTANCE)
    if (reducedMotion) {
      // Honor reduced motion: jump instead of animating.
      flyRef.current = null
      camera.position.copy(destination)
      controls?.update()
    } else {
      flyRef.current = { destination }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusNonce is the trigger; camera/controls are stable
  }, [focus, focusNonce, reducedMotion])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[sunPosition.x, sunPosition.y, sunPosition.z]} intensity={2.4} />

      <group ref={groupRef}>
        <MarsGlobeMesh
          canvas={canvas}
          tier={tier}
          onCursorLatLon={(local) => {
            const now = performance.now()
            if (local && now - lastCursorEmit.current < 100) return
            lastCursorEmit.current = now
            onCursorLocalPoint?.(local)
          }}
        />
        {graticule ? <GraticuleMesh /> : null}
        <PoiMarkers places={places} selectedId={selectedId} onSelect={onPlaceSelect} />
      </group>

      <AtmosphereShell />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={1.35}
        maxDistance={4.5}
      />
    </>
  )
}

/** Pure helper duplicated from math (Vector3-free version) to rotate around the Y axis. */
function rotateAroundY(p: { x: number; y: number; z: number }, angle: number) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  }
}
