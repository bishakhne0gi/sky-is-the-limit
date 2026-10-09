'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { createRng } from '@/lib/rng';

const CW = 2400, CL = 2400, N = 3000;

/** Street-grid lights far below the Ground band. */
export function City() {
  const { geometry, material } = useMemo(() => {
    const rand = createRng(11);
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const alongX = rand() < 0.5;
      pos[i * 3] = alongX ? rand() * CW - CW / 2 : Math.round((rand() * CW) / 40) * 40 - CW / 2 + (rand() - 0.5) * 3;
      pos[i * 3 + 1] = -420;
      pos[i * 3 + 2] = alongX ? Math.round((rand() * CL) / 40) * 40 + (rand() - 0.5) * 3 : rand() * CL;
      seed[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCamX: { value: 0 }, uCamZ: { value: 0 }, uAmt: { value: 0 }, uPR: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uCamX, uCamZ, uAmt, uPR; varying float vA; varying vec3 vC;
        const float W = ${CW}.0, L = ${CL}.0;
        void main(){
          float rel = mod(uCamZ - position.z, L);
          float z = uCamZ + 40. - rel;
          float x = uCamX + mod(position.x - uCamX + W*.5, W) - W*.5;
          vec4 mv = viewMatrix * vec4(x, position.y, z, 1.);
          gl_PointSize = (6. + aSeed*10.) * uPR * 300. / max(-mv.z, 1.);
          vA = uAmt * smoothstep(L, L-400., rel) * (.7 + .3*sin(uTime*(.5 + aSeed*3.) + aSeed*40.));
          vC = mix(vec3(1., .72, .38), vec3(.85, .9, 1.), step(.7, aSeed));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying vec3 vC;
        void main(){ vec2 d = gl_PointCoord - .5; float a = exp(-dot(d,d)*28.) * vA; gl_FragColor = vec4(vC*a*1.6, 1.); }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamX!.value = live.camera.x;
    u.uCamZ!.value = live.camera.z;
    u.uAmt!.value = bandWeight(live.loopAlt, 0);
    u.uPR!.value = state.gl.getPixelRatio() * state.size.height / 900;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />;
}
