import { useState } from 'react'
import { Html } from '@react-three/drei'
import type { PointOfInterest } from '@/types/poi'
import { GLOBE_MATERIAL_COLORS, latLonToSpherePosition } from '../math'

/**
 * Catalog POIs as clickable markers pinned to the surface. Colors encode the POI category
 * (legend in the HUD); labels render on hover/selection via drei Html. Clicking asks the page
 * to open the shared Atlas detail dialog (marker → Atlas detail, roadmap Phase 2).
 */

const MARKER_RADIUS = 0.012
const MARKER_HOVER_RADIUS = 0.017
/** Slightly above the surface so markers never clip into the terrain texture. */
const SURFACE_OFFSET = 1.012

interface PoiMarkersProps {
  places: PointOfInterest[]
  selectedId: string | null
  onSelect: (place: PointOfInterest) => void
}

export function PoiMarkers({ places, selectedId, onSelect }: PoiMarkersProps) {
  return (
    <>
      {places.map((place) => {
        const pos = latLonToSpherePosition(place.coordinates, SURFACE_OFFSET)
        return (
          <PoiMarker
            key={place.id}
            place={place}
            position={[pos.x, pos.y, pos.z]}
            active={place.id === selectedId}
            onSelect={onSelect}
          />
        )
      })}
    </>
  )
}

interface PoiMarkerProps {
  place: PointOfInterest
  position: [number, number, number]
  active: boolean
  onSelect: (place: PointOfInterest) => void
}

function PoiMarker({ place, position, active, onSelect }: PoiMarkerProps) {
  const [hovered, setHovered] = useState(false)
  const color = GLOBE_MATERIAL_COLORS.markers[place.category]
  const radius = hovered || active ? MARKER_HOVER_RADIUS : MARKER_RADIUS
  const showLabel = hovered || active

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onSelect(place)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Alignment stem: connects the dot to its exact surface coordinate. */}
      <mesh position={[0, -0.004, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.0014, 0.0014, 0.012, 6]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {showLabel ? (
        <Html center zIndexRange={[20, 0]} wrapperClass="poi-marker-label">
          <div className="pointer-events-none -translate-y-5 whitespace-nowrap rounded-md border border-line bg-space/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink shadow-panel">
            {place.name}
          </div>
        </Html>
      ) : null}
    </group>
  )
}
