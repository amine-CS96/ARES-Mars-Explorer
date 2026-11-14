import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { GLOBE_MATERIAL_COLORS, graticulePolylines, type GraticuleData } from '../math'

/** Convert polylines into a LineSegments BufferGeometry (consecutive point pairs). */
function segmentsGeometry(polylines: GraticuleData['regular']): THREE.BufferGeometry {
  const positions: number[] = []
  for (const line of polylines) {
    for (let i = 0; i < line.length - 1; i++) {
      positions.push(line[i].x, line[i].y, line[i].z, line[i + 1].x, line[i + 1].y, line[i + 1].z)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

/**
 * Latitude/longitude grid: faint 15° lines with a stronger equator + prime meridian. Drawn
 * just above the surface to avoid z-fighting; raycasting disabled so it never steals the
 * cursor readout from the globe mesh.
 */
export function GraticuleMesh() {
  const colors = GLOBE_MATERIAL_COLORS
  const data = useMemo(() => graticulePolylines(15, 1, 0.002), [])
  const geometries = useMemo(
    () => ({
      regular: segmentsGeometry(data.regular),
      highlight: segmentsGeometry(data.highlights),
    }),
    [data],
  )

  useEffect(
    () => () => {
      geometries.regular.dispose()
      geometries.highlight.dispose()
    },
    [geometries],
  )

  return (
    <>
      <lineSegments geometry={geometries.regular} raycast={() => null}>
        <lineBasicMaterial color={colors.grid} transparent opacity={0.16} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={geometries.highlight} raycast={() => null}>
        <lineBasicMaterial color={colors.gridHighlight} transparent opacity={0.32} depthWrite={false} />
      </lineSegments>
    </>
  )
}
