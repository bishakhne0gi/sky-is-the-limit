'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { livePalette as lp } from '../livePalette';
import { live } from '@/flight/live';
import { AHEAD, L, W } from '../clouds/cloudField';

const NL = 420;

export function Lanterns() {
  const { geometry, material } = useMemo(() => {
    const base = new Float32Array(NL * 3), seed = new Float32Array(NL);
    for (let i = 0; i < NL; i++) { base.set([Math.random() * W - W / 2, Math.random() * 80, Math.random() * L], i * 3); seed[i] = Math.random(); }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(base, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCamX: { value: 0 }, uCamY: { value: 0 }, uCamZ: { value: 0 }, uAmt: { value: 0 }, uPR: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uCamX, uCamY, uCamZ, uAmt, uPR; varying float vA, vF;
        const float W = ${W}.0, L = ${L}.0;
        void main(){
          float rel = mod(uCamZ - position.z, L);
          float z = uCamZ + ${AHEAD}.0 - rel;
          float x = uCamX + mod(position.x - uCamX + W*.5, W) - W*.5 + sin(uTime*.3 + aSeed*20.)*2.;
          float y = mod(position.y + uTime*(1.1 + aSeed*1.6), 80.) - 30. + uCamY;
          vec4 mv = viewMatrix * vec4(x, y, z, 1.);
          gl_PointSize = 950. * uPR * (.7 + aSeed*.6) / max(-mv.z, 1.);
          float ly = y - uCamY;
          vA = uAmt * smoothstep(L, L-160., rel) * smoothstep(0., 14., rel - ${AHEAD}.0) * smoothstep(-30., -22., ly) * smoothstep(50., 35., ly);
          vF = .8 + .2*sin(uTime*(9.+aSeed*8.) + aSeed*50.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA, vF;
        void main(){
          vec2 uv = gl_PointCoord - .5; uv.y = -uv.y;
          vec2 q = abs(uv - vec2(0., .01)) - vec2(.038, .06);
          float body = 1. - smoothstep(0., .015, length(max(q, 0.)) - .012);
          float halo = exp(-dot(uv,uv)*30.);
          vec3 col = vec3(1., .5, .16)*halo*1.1 + vec3(1., .82, .55)*body*2.6;
          gl_FragColor = vec4(col * vF * vA, 1.);
        }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamX!.value = live.camera.x; u.uCamY!.value = live.camera.y; u.uCamZ!.value = live.camera.z;
    u.uAmt!.value = lp.lanterns * live.skyWeight;
    u.uPR!.value = state.gl.getPixelRatio() * state.size.height / 900;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
