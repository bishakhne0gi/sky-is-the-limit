'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { KINDS, MAX_DT } from '@sitl/core';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { livePalette as lp } from '../livePalette';
import { foldGeometry } from './foldGeometry';
import { glowTexture } from './glowTexture';

const TN = 40;
const TIPS = [new THREE.Vector3(-1.4, 0.18, 1.0), new THREE.Vector3(1.4, 0.18, 1.0)];

function makeTrail() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TN * 6), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aT', new THREE.BufferAttribute(Float32Array.from({ length: TN * 2 }, (_, i) => (i >> 1) / (TN - 1)), 1));
  const idx: number[] = [];
  for (let i = 0; i < TN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lp.tint } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `attribute float aT; varying float vT, vNear; void main(){ vT = aT; vec4 mv = modelViewMatrix*vec4(position,1.); vNear = smoothstep(4., 11., -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uCol; varying float vT, vNear; void main(){ gl_FragColor = vec4(uCol*.4*pow(1.-vT, 2.)*vNear, 1.); }`,
  }));
  m.frustumCulled = false;
  m.renderOrder = 4;
  return { mesh: m, hist: [] as THREE.Vector3[] };
}

export function PlayerPlane() {
  const camera = useThree((s) => s.camera);
  const kind = useApp((s) => s.kind);
  const fold = useApp((s) => s.fold);
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xf7f4ee, roughness: 0.55, side: THREE.DoubleSide, flatShading: true, emissive: new THREE.Color(KINDS[kind]), emissiveIntensity: 0.2,
  }), [kind]);
  const glowMat = useMemo(() => new THREE.SpriteMaterial({
    map: glowTexture(), color: new THREE.Color(KINDS[kind]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }), [kind]);
  const trails = useMemo(() => [makeTrail(), makeTrail()], []);
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const t = state.clock.elapsedTime;
    const phase = useApp.getState().phase;
    const flying = phase === 'launching' || phase === 'flying';
    g.visible = flying;
    trails.forEach((tr) => { tr.mesh.visible = flying; });
    if (!flying) { trails.forEach((tr) => { tr.hist.length = 0; }); return; }

    tmp.target.set(live.pointer.x * 7.5, live.pointer.y * 3.2 - 1.4, -13).applyQuaternion(camera.quaternion).add(camera.position);
    if (g.position.lengthSq() === 0) g.position.copy(tmp.target);
    g.position.lerp(tmp.target, 1 - Math.exp(-6 * dt));
    const lx = live.pointer.x - live.pointerSlow.x, ly = live.pointer.y - live.pointerSlow.y;
    const flutter = live.flutter ? Math.sin(t * 38) * 0.12 : 0;
    g.rotation.set(ly * 0.9 + Math.sin(t * 1.7) * 0.03 + flutter, -lx * 0.5, -lx * 1.6 + Math.sin(t * 1.1) * 0.05 + flutter, 'YXZ');
    g.updateMatrixWorld();
    live.plane.copy(g.position);

    material.emissiveIntensity = 0.15 + live.steadiness * 0.6 + (live.inhaling ? 0.2 : 0);
    if (glow.current) {
      const s = 3 + live.steadiness * 4 + (live.inhaling ? 1.5 : 0);
      glow.current.scale.setScalar(s);
      glowMat.opacity = 0.3 + live.steadiness * 0.4;
    }

    trails.forEach((tr, i) => {
      tr.hist.unshift(g.localToWorld(tmp.a.copy(TIPS[i]!)).clone());
      if (tr.hist.length > TN) tr.hist.pop();
      const P = tr.mesh.geometry.attributes.position!.array as Float32Array;
      for (let j = 0; j < TN; j++) {
        const p = tr.hist[Math.min(j, tr.hist.length - 1)]!, q = tr.hist[Math.min(j + 1, tr.hist.length - 1)]!;
        tmp.b.subVectors(p, q);
        if (tmp.b.lengthSq() < 1e-6) tmp.b.set(0, 0, 1);
        tmp.c.subVectors(camera.position, p).cross(tmp.b).normalize().multiplyScalar(0.035 * (1 - j / TN) + 0.006);
        P.set([p.x + tmp.c.x, p.y + tmp.c.y, p.z + tmp.c.z, p.x - tmp.c.x, p.y - tmp.c.y, p.z - tmp.c.z], j * 6);
      }
      tr.mesh.geometry.attributes.position!.needsUpdate = true;
    });
  });

  return (
    <>
      <group ref={group}>
        <mesh geometry={foldGeometry(fold)} material={material} />
        <sprite ref={glow} material={glowMat} scale={4} />
      </group>
      {trails.map((tr, i) => <primitive key={i} object={tr.mesh} />)}
    </>
  );
}
