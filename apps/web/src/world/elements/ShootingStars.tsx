'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { ambientInterval } from './shootingStarTiming';

const POOL = 6;
const LIFE = 1.2;
const queue: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];

/** Spawn a star that arcs from → to (world space). Used by Plan 2 for breath-sync moments. */
export function queueShootingStar(from: THREE.Vector3, to: THREE.Vector3): void {
  queue.push({ from: from.clone(), to: to.clone() });
}

export function ShootingStars() {
  const nextAt = useRef(5);
  const stars = useMemo(() => Array.from({ length: POOL }, () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3).setUsage(THREE.DynamicDrawUsage));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    line.frustumCulled = false;
    return { line, from: new THREE.Vector3(), to: new THREE.Vector3(), born: -99 };
  }), []);
  const head = useMemo(() => new THREE.Vector3(), []);
  const tail = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const spawn = (from: THREE.Vector3, to: THREE.Vector3) => {
      const s = stars.reduce((a, b) => (a.born < b.born ? a : b));
      s.from.copy(from); s.to.copy(to); s.born = t;
    };
    while (queue.length) { const q = queue.shift()!; spawn(q.from, q.to); }
    const interval = ambientInterval(live.loop, bandWeight(live.loopAlt, 4));
    if (interval !== null && t > nextAt.current) {
      nextAt.current = t + interval * (0.6 + Math.random() * 0.8);
      const from = new THREE.Vector3(live.camera.x + (Math.random() - 0.5) * 400, live.camera.y + 90 + Math.random() * 90, live.camera.z - 500);
      const dir = new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, -0.35, 0.15).normalize();
      spawn(from, from.clone().addScaledVector(dir, 260));
    }
    for (const s of stars) {
      const k = (t - s.born) / LIFE;
      const m = s.line.material as THREE.LineBasicMaterial;
      if (k < 0 || k > 1) { m.opacity = 0; continue; }
      head.lerpVectors(s.from, s.to, k);
      tail.lerpVectors(s.from, s.to, Math.max(0, k - 0.18));
      (s.line.geometry.attributes.position!.array as Float32Array).set([tail.x, tail.y, tail.z, head.x, head.y, head.z]);
      s.line.geometry.attributes.position!.needsUpdate = true;
      m.opacity = Math.sin(k * Math.PI) * 0.9;
    }
  });

  return <>{stars.map((s, i) => <primitive key={i} object={s.line} />)}</>;
}
