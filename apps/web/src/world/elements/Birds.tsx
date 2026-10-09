'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { AHEAD, L, W, wrap } from '../clouds/cloudField';
import { livePalette as lp } from '../livePalette';

const FLOCKS = 7, PER = 7, NB = FLOCKS * PER;

export function Birds() {
  const flocks = useMemo(() => Array.from({ length: FLOCKS }, () => ({ x: Math.random() * W - W / 2, y: 4 + Math.random() * 18, z: Math.random() * L, v: 9 + Math.random() * 8 })), []);
  const birdCol = useMemo(() => new THREE.Color(), []);
  const { geometry, material, aPos } = useMemo(() => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.5, -1.25, 0, 0.15, 0, 0, 0.35, 0, 0, -0.5, 0, 0, 0.35, 1.25, 0, 0.15], 3));
    geometry.instanceCount = NB;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(NB * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    const material = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uAmt: { value: 0 }, uCol: { value: birdCol }, uFog: { value: lp.fog } },
      vertexShader: /* glsl */ `
        attribute vec4 aPos; uniform float uTime; varying float vFog;
        void main(){ vec3 p = position*1.1; float ax = abs(p.x);
          p.y += sin(uTime*9. + aPos.w*40.) * .75 * ax; p.z += ax*.15;
          vec4 mv = viewMatrix * vec4(p + aPos.xyz, 1.);
          vFog = smoothstep(80., 520., -mv.z);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform vec3 uCol, uFog; uniform float uAmt; varying float vFog;
        void main(){ gl_FragColor = vec4(mix(uCol, uFog, vFog), uAmt*(1.-vFog*.6)); }`,
    });
    return { geometry, material, aPos };
  }, [birdCol]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const weight = lp.birds * live.skyWeight;
    material.uniforms.uTime!.value = t;
    material.uniforms.uAmt!.value = weight;
    birdCol.copy(lp.shadow).multiplyScalar(0.35);
    const A = aPos.array as Float32Array;
    flocks.forEach((f, fi) => {
      const rel = wrap(live.camera.z - (f.z - t * f.v), L);
      const baseX = live.camera.x + wrap(f.x - live.camera.x + W / 2, W) - W / 2;
      const baseY = f.y + 12;
      const baseZ = live.camera.z + AHEAD - rel;
      for (let k = 0; k < PER; k++) {
        const i = fi * PER + k, side = k % 2 ? 1 : -1, rank = (k + 1) >> 1;
        A[i * 4] = baseX + side * rank * 2.1 + Math.sin(t * 0.7 + i) * 0.3;
        A[i * 4 + 1] = baseY + Math.sin(t * 0.9 + i * 1.7) * 0.4 - rank * 0.15;
        A[i * 4 + 2] = rel < AHEAD + 4 ? 1e5 : baseZ + rank * 2.4;
        A[i * 4 + 3] = i / NB;
      }
    });
    aPos.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />;
}
