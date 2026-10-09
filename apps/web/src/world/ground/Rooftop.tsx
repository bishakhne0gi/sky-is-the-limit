'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { cameraBaseY } from '../altitudeRig';

/** A dark rain-wet rooftop under the camera during the ritual. It stays put once the plane launches. */
export function Rooftop() {
  const group = useRef<THREE.Group>(null);
  const anchored = useRef(false);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const phase = useApp.getState().phase;
    if (phase === 'ritual' || phase === 'loading') {
      g.position.set(live.camera.x, cameraBaseY(0) - 6, live.camera.z - 16);
      anchored.current = true;
    }
    g.visible = anchored.current && phase !== 'flying';
    if (phase === 'flying') anchored.current = false;
  });
  return (
    <group ref={group}>
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[70, 2, 36]} />
        <meshStandardMaterial color="#15161d" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.6, -17.6]}>
        <boxGeometry args={[70, 1.2, 0.8]} />
        <meshStandardMaterial color="#1c1e27" roughness={0.6} />
      </mesh>
    </group>
  );
}
