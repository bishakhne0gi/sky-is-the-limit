'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { AHEAD, L, W, wrap } from '../clouds/cloudField';
import { createCloudMaterial, updateCloudUniforms } from '../clouds/cloudMaterial';

interface Part { dx: number; dy: number; s: number; tail: boolean }

function whaleTemplate(): Part[] {
  const parts: Part[] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const r = Math.sin(Math.PI * Math.pow(u, 0.7)) * 8 + 1.5;
    const dx = (0.5 - u) * 70; // head at +x
    const lump = Math.sin(i * 2.7) * 1.4; // deterministic irregularity so the body reads as cloud, not hull
    parts.push({ dx, dy: -r * 0.15 + lump, s: r * 2.2, tail: false });
    if (i % 2 === 0) parts.push({ dx: dx + 1.5, dy: -r * 0.6, s: r * 1.5, tail: false });
    if (i > 4 && i < 12 && i % 3 === 0) parts.push({ dx, dy: r * 0.55, s: r * 1.3, tail: false });
  }
  parts.push(
    { dx: -40, dy: 9, s: 15, tail: true }, { dx: -46, dy: 13, s: 11, tail: true },
    { dx: -40, dy: -9, s: 15, tail: true }, { dx: -46, dy: -13, s: 11, tail: true },
  );
  return parts;
}

const WHALES = [
  { x0: -120, y: 18, z0: 200, speed: 3.2, phase: 0 },
  { x0: 160, y: 26, z0: 460, speed: 2.4, phase: 2 },
  { x0: 20, y: 34, z0: 690, speed: 2.8, phase: 4 },
];

export function Whales() {
  const template = useMemo(whaleTemplate, []);
  const count = template.length * WHALES.length;
  const { geometry, aPos, aData } = useMemo(() => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.copy(new THREE.PlaneGeometry(1, 1) as unknown as THREE.InstancedBufferGeometry);
    geometry.instanceCount = count;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const aData = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    geometry.setAttribute('aData', aData);
    return { geometry, aPos, aData };
  }, [count]);
  const material = useMemo(() => createCloudMaterial(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const weight = bandWeight(live.loopAlt, 3);
    updateCloudUniforms(material, state.camera as THREE.PerspectiveCamera, t);
    material.uniforms.uPart!.value = 0;
    const P = aPos.array as Float32Array, D = aData.array as Float32Array;
    let j = 0;
    WHALES.forEach((w, wi) => {
      const rel = wrap(live.camera.z - w.z0, L);
      const z = live.camera.z + AHEAD - rel;
      const cx = live.camera.x + wrap(w.x0 + t * w.speed - live.camera.x + W / 2, W) - W / 2;
      const fade = weight * Math.min(1, Math.max(0, (rel - AHEAD - 20) / 60)) * Math.min(1, Math.max(0, (L - rel) / 160));
      for (const p of template) {
        const sway = Math.sin(t * 0.5 + p.dx * 0.05 + w.phase) * 1.5 + (p.tail ? Math.sin(t * 0.8 + w.phase) * 3 : 0);
        P.set([cx + p.dx, live.camera.y + w.y + p.dy + sway, z], j * 3);
        D.set([p.s, (wi * 37 + j) % 1000 / 1000, fade, 0.8], j * 4);
        j++;
      }
    });
    aPos.needsUpdate = true;
    aData.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
