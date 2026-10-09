import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

/** Instanced billboard puffs. Attributes: aPos (vec3), aData (scale, seed, fade, height01). */
export function createCloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uPart: { value: 0.85 },
      uLit: { value: lp.lit }, uShadow: { value: lp.shadow }, uSunCol: { value: lp.sun }, uFog: { value: lp.fog },
      uSunScr: { value: new THREE.Vector2(0, 1) }, uRim: { value: 0.6 }, uFogNear: { value: 120 }, uFogFar: { value: 700 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aPos; attribute vec4 aData;
      uniform vec2 uPointer; uniform float uAspect, uPart, uFogNear, uFogFar;
      varying vec2 vUv; varying float vSeed, vFade, vFog, vH;
      void main(){
        vec4 mvC = viewMatrix * vec4(aPos, 1.);
        vec4 cc = projectionMatrix * mvC;
        vec2 dd = cc.xy/cc.w - uPointer; dd.x *= uAspect;
        float l = length(dd);
        float push = uPart * exp(-l*l/.055) * smoothstep(280., 12., -mvC.z);
        vec4 mv = mvC; mv.xy += position.xy * aData.x * (1. - .45*push);
        vec4 clip = projectionMatrix * mv;
        vec2 dir = l > 1e-4 ? dd/l : vec2(0.,1.); dir.x /= uAspect;
        clip.xy += dir * push * .3 * clip.w;
        gl_Position = clip;
        vUv = position.xy * 2.; vSeed = aData.y; vFade = aData.z; vH = aData.w;
        vFog = smoothstep(uFogNear, uFogFar, -mvC.z);
      }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform float uTime, uRim; uniform vec3 uLit, uShadow, uSunCol, uFog; uniform vec2 uSunScr;
      varying vec2 vUv; varying float vSeed, vFade, vFog, vH;
      void main(){
        float n = fbm3(vUv*1.25 + vSeed*31.7 + vec2(uTime*.02, -uTime*.012));
        float d = 1. - length(vUv) + (n - .5);
        float a = smoothstep(.02, .5, d) * smoothstep(1., .72, length(vUv)) * vFade;
        if (a < .004) discard;
        float sa = dot(vUv, uSunScr);
        float light = clamp(.5 + vUv.y*.32 + sa*.22 + (n-.5)*.55, 0., 1.) * mix(.6, 1., vH);
        vec3 col = mix(uShadow, uLit, light);
        col += uSunCol * (1. - smoothstep(.02, .3, d)) * max(sa, 0.) * uRim;
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, a*.92);
      }`,
  });
}

const sv = new THREE.Vector3();
export function updateCloudUniforms(mat: THREE.ShaderMaterial, camera: THREE.PerspectiveCamera, t: number): void {
  const u = mat.uniforms;
  u.uTime!.value = t;
  u.uAspect!.value = camera.aspect;
  (u.uPointer!.value as THREE.Vector2).copy(live.pointer);
  u.uPart!.value += ((live.inhaling ? 1.15 : 0.85) - u.uPart!.value) * 0.05;
  sv.copy(lp.sunDir).transformDirection(camera.matrixWorldInverse);
  (u.uSunScr!.value as THREE.Vector2).set(sv.x, sv.y).normalize();
  u.uRim!.value = (0.35 + 0.65 * Math.max(-sv.z, 0)) * (1 - lp.stars * 0.5);
  u.uFogNear!.value = lp.fogNear;
  u.uFogFar!.value = lp.fogFar;
}
