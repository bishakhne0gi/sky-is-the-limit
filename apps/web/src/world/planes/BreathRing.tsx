'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { guidePhase } from '@/flight/guide';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';

export function BreathRing() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const flying = useApp.getState().phase === 'flying';
    const target = flying && live.guideVisible ? 0.45 : 0;
    material.opacity += (target - material.opacity) * (1 - Math.exp(-2 * dt));
    m.visible = material.opacity > 0.01;
    m.position.copy(live.plane);
    m.quaternion.copy(state.camera.quaternion);
    m.scale.setScalar(0.55 + guidePhase(state.clock.elapsedTime).scale * 0.45);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={5}>
      <ringGeometry args={[1.6, 1.72, 64]} />
    </mesh>
  );
}
