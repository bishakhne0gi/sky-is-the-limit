'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from './livePalette';

export function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    if (sun.current) {
      sun.current.color.copy(lp.sun);
      sun.current.position.copy(live.plane).addScaledVector(lp.sunDir, 50);
      sun.current.target.position.copy(live.plane);
      sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) {
      hemi.current.color.copy(lp.mid);
      hemi.current.groundColor.copy(lp.lit).multiplyScalar(0.7);
    }
  });
  return (
    <>
      <directionalLight ref={sun} intensity={2.4} />
      <hemisphereLight ref={hemi} intensity={1.1} />
    </>
  );
}
