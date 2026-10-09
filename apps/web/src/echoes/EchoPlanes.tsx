'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { KINDS, bandWeight, type Presence } from '@sitl/core';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { foldGeometry } from '@/world/planes/foldGeometry';
import { glowTexture } from '@/world/planes/glowTexture';
import { echoPositionAt, needsReassign, pathDuration, startOffsetFor } from './playback';
import { generateSeedEchoes, type EchoPath } from './seed';

export const MAX_ECHOES = 5;
/** Shared mapping from normalized space to world units (also used by Plan 2's remote planes). */
export const ECHO_X_SCALE = 40;
export const BAND_UNITS = 40;

interface Slot { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; glow: THREE.Sprite; path: EchoPath | null; startT: number; offset: number; zOff: number; pos: { x: number; alt: number } }

export function EchoPlanes() {
  const seeds = useMemo(() => generateSeedEchoes(), []);
  const group = useRef<THREE.Group>(null);
  const cursor = useRef(0);
  const lastBand = useRef(-1);
  const slots = useMemo<Slot[]>(() => Array.from({ length: MAX_ECHOES }, (_, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, transparent: true, opacity: 0, side: THREE.DoubleSide, flatShading: true, emissiveIntensity: 0.5, depthWrite: false });
    const mesh = new THREE.Mesh(foldGeometry('dart'), mat);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glow.scale.setScalar(4);
    mesh.add(glow);
    return { mesh, mat, glow, path: null, startT: 0, offset: 0, zOff: 6 + i * 7, pos: { x: 0, alt: 0 } };
  }), []);
  const constellation = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((MAX_ECHOES - 1) * 6), 3).setUsage(THREE.DynamicDrawUsage));
    const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    line.frustumCulled = false;
    return line;
  }, []);

  const assign = (slot: Slot, t: number) => {
    const pool = seeds.filter((e) => e.band === live.band);
    const path = pool[cursor.current++ % pool.length]!;
    slot.path = path;
    slot.startT = t;
    slot.offset = startOffsetFor(path, live.bandProgress + (Math.random() - 0.5) * 0.12);
    slot.mesh.geometry = foldGeometry(path.fold);
    slot.mat.emissive.set(KINDS[path.kind]);
    (slot.glow.material as THREE.SpriteMaterial).color.set(KINDS[path.kind]);
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phase = useApp.getState().phase;
    // Not during the launch: the player's altitude sweeps up the band and echoes would be left behind.
    const active = phase === 'flying';
    if (group.current) group.current.visible = active;
    if (!active) { live.others = []; lastBand.current = -1; return; }
    if (live.band !== lastBand.current) { lastBand.current = live.band; slots.forEach((s) => assign(s, t)); }

    const others: Presence[] = [];
    for (const s of slots) {
      if (!s.path) continue;
      let elapsed = t - s.startT + s.offset;
      s.pos = echoPositionAt(s.path, elapsed);
      if (needsReassign(s.pos, live.bandProgress, elapsed, pathDuration(s.path))) {
        assign(s, t);
        elapsed = s.offset;
        s.pos = echoPositionAt(s.path!, elapsed);
      }
      const fade = Math.min(1, (t - s.startT) / 2, (pathDuration(s.path) - elapsed) / 2);
      s.mat.opacity = 0.5 * fade;
      (s.glow.material as THREE.SpriteMaterial).opacity = 0.35 * fade;
      s.mesh.position.set(s.pos.x * ECHO_X_SCALE, live.camera.y - 1.4 + (s.pos.alt - live.bandProgress) * BAND_UNITS, live.camera.z - 13 - s.zOff);
      s.mesh.rotation.set(0, 0, Math.sin(t * 0.7 + s.zOff) * 0.15);
      others.push({ x: s.pos.x, alt: s.pos.alt, echo: true });
    }
    live.others = others;

    // The Stars: link the echoes into a faint constellation, ordered left → right.
    const sorted = [...slots].sort((a, b) => a.mesh.position.x - b.mesh.position.x);
    const P = constellation.geometry.attributes.position!.array as Float32Array;
    for (let i = 0; i < MAX_ECHOES - 1; i++) {
      const a = sorted[i]!.mesh.position, b = sorted[i + 1]!.mesh.position;
      P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    }
    constellation.geometry.attributes.position!.needsUpdate = true;
    (constellation.material as THREE.LineBasicMaterial).opacity = 0.35 * bandWeight(live.loopAlt, 4);
  });

  return (
    <group ref={group}>
      {slots.map((s, i) => <primitive key={i} object={s.mesh} />)}
      <primitive object={constellation} />
    </group>
  );
}
