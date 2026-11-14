import { useMemo } from 'react'
import * as THREE from 'three'
import { GLOBE_MATERIAL_COLORS } from '../math'

/**
 * Atmosphere rim (ILLUSTRATIVE). Mars' atmosphere is thin — this is a legibility-oriented
 * limb glow, not a radiative-transfer model: a fresnel falloff on a slightly larger back-side
 * shell, additive-blended. Colors live in `math.ts` with the token-mirror constants.
 */
const VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewV;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewV = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vViewV;
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uIntensity;
  void main() {
    float d = dot(normalize(vNormalV), normalize(vViewV));
    float rim = pow(clamp(1.0 - abs(d), 0.0, 1.0), 3.0);
    vec3 col = mix(uInner, uOuter, pow(rim, 1.2));
    gl_FragColor = vec4(col * rim * uIntensity, rim * uIntensity);
  }
`

export function AtmosphereShell() {
  const uniforms = useMemo(
    () => ({
      uInner: { value: new THREE.Color(GLOBE_MATERIAL_COLORS.atmosphereInner) },
      uOuter: { value: new THREE.Color(GLOBE_MATERIAL_COLORS.atmosphereOuter) },
      uIntensity: { value: GLOBE_MATERIAL_COLORS.atmosphereIntensity },
    }),
    [],
  )

  return (
    <mesh scale={1.045} raycast={() => null}>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
