'use client'

import { Environment, Lightformer } from '@react-three/drei'

/**
 * Soft studio reflections built from in-scene light panels.
 * Unlike `<Environment preset="…">` it downloads nothing, so scenes render immediately
 * and don't depend on a third-party CDN being reachable.
 */
export function StudioEnvironment({ intensity = 1.6 }: { intensity?: number }) {
  return (
    <Environment resolution={256} environmentIntensity={intensity}>
      {/* Broad soft panel in front of the subject so dark fabric still reads. */}
      <Lightformer form="rect" intensity={1.5} position={[0, 0, 6]} scale={[10, 6, 1]} />
      <group rotation={[-Math.PI / 3, 0, 1]}>
        <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
        <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
      </group>
    </Environment>
  )
}
