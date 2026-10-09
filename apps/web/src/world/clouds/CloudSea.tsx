'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { isCoarsePointer } from '@/lib/env';
import { createRng } from '@/lib/rng';
import { createCloudMaterial, updateCloudUniforms } from './cloudMaterial';
import { createSortWork, generatePuffs, writeSortedPuffs } from './cloudField';

export function CloudSea() {
  const { puffs, geometry, aPos, aData, work } = useMemo(() => {
    const puffs = generatePuffs(isCoarsePointer() ? 0.5 : 1, createRng(1));
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.copy(new THREE.PlaneGeometry(1, 1) as unknown as THREE.InstancedBufferGeometry);
    geometry.instanceCount = puffs.length;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const aData = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    geometry.setAttribute('aData', aData);
    return { puffs, geometry, aPos, aData, work: createSortWork(puffs.length) };
  }, []);
  const material = useMemo(() => createCloudMaterial(), []);

  useFrame((state) => {
    updateCloudUniforms(material, state.camera as THREE.PerspectiveCamera, state.clock.elapsedTime);
    writeSortedPuffs(puffs, work, aPos.array as Float32Array, aData.array as Float32Array, live.camera.x, live.camera.z);
    aPos.needsUpdate = true;
    aData.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
