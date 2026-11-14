import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { GlobeTier } from '../math'
import { GLOBE_MATERIAL_COLORS } from '../math'

/**
 * The planet mesh. Texture = the composed canvas of verified Trek WMTS tiles (see
 * `composeMosaic.ts`); while it has not arrived the mesh stays in the token fallback color
 * rather than showing a fake planet. Texture upload uses three's default `flipY`, which
 * matches the canvas (north at top) under SphereGeometry UVs — see `math.ts` header.
 */
interface MarsGlobeMeshProps {
  canvas: HTMLCanvasElement | null
  tier: GlobeTier
  onCursorLatLon?: (point: THREE.Vector3 | null) => void
}

export function MarsGlobeMesh({ canvas, tier, onCursorLatLon }: MarsGlobeMeshProps) {
  const texture = useMemo(() => {
    if (!canvas) return null
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
  }, [canvas])

  // Canvases are cached by TanStack Query; the WebGL texture must not leak when it changes.
  useEffect(() => () => texture?.dispose(), [texture])

  const [widthSegments, heightSegments] = tier.segments

  return (
    <mesh
      onPointerMove={(event) => {
        if (!onCursorLatLon) return
        // event.point is world-space; convert into the (possibly rotated) mesh's local frame.
        const local = event.object.worldToLocal(event.point.clone())
        onCursorLatLon(local)
      }}
      onPointerLeave={() => onCursorLatLon?.(null)}
    >
      {/* key forces geometry rebuild when the tier changes (r3f does not diff args). */}
      <sphereGeometry key={`${widthSegments}-${heightSegments}`} args={[1, widthSegments, heightSegments]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : GLOBE_MATERIAL_COLORS.fallbackSurface}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}
