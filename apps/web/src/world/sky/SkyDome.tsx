'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

export function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: lp.top }, uMid: { value: lp.mid }, uHorizon: { value: lp.horizon }, uSunCol: { value: lp.sun },
      uBelow: { value: lp.below }, uCirrus: { value: lp.cirrus }, uSunDir: { value: lp.sunDir },
      uStars: { value: 0 }, uAurora: { value: 0 }, uTime: { value: 0 }, uCamZ: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform vec3 uTop,uMid,uHorizon,uSunCol,uBelow,uCirrus,uSunDir; uniform float uStars,uAurora,uTime,uCamZ;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
        col = mix(col, uTop, smoothstep(0.22, 0.9, h));
        float s = max(dot(d, uSunDir), 0.0);
        col += uSunCol * (pow(s,5.)*.22*(1.-uStars*.7) + pow(s,60.)*.55 + pow(s,2.)*(1.-smoothstep(0.,.3,abs(h)))*.2*(1.-uStars*.8));
        if (h > 0.0) {
          vec2 cp = d.xz/(h+0.06)*0.55 + vec2(0., uCamZ*0.0007);
          float ci = fbm(cp*vec2(.55,2.4) + vec2(uTime*.006, 0.));
          ci = smoothstep(.55,.88,ci) * smoothstep(.02,.22,h) * smoothstep(.95,.35,h);
          col = mix(col, uCirrus + uSunCol*pow(s,4.)*.6, ci*.55);
        }
        vec2 sp = vec2(atan(d.z,d.x), asin(clamp(h,-1.,1.))) * 130.;
        vec2 cell = floor(sp), f = fract(sp) - .5;
        float hs = hash(cell);
        vec2 off = vec2(hash(cell+3.1), hash(cell+7.7)) - .5;
        float star = smoothstep(.13, 0., length(f - off*.6)) * step(.935, hs);
        star *= .55 + .45*sin(uTime*(1.5+hs*5.) + hs*40.);
        col += vec3(.9,.95,1.) * star * uStars * smoothstep(.02,.25,h) * 1.8;
        if (uAurora > 0.001) {
          float az = atan(d.x, -d.z); vec3 aur = vec3(0);
          for (int i=0;i<3;i++){ float fi = float(i);
            float wave = noise(vec2(az*2.4 + fi*3.1 + uTime*.05, uTime*.03 + fi));
            float c = .17 + fi*.075 + (wave-.5)*.2;
            float band = exp(-pow((h-c)*16.,2.)) + exp(-max(h-c,0.)*15.)*smoothstep(c-.015,c,h)*.45;
            float streak = .45 + .55*noise(vec2(az*70. + uTime*.4, fi*5.));
            aur += mix(vec3(.12,1.,.62), vec3(.62,.3,1.), fi*.5) * band * streak * streak * .32;
          }
          col += aur * uAurora * smoothstep(0.,.08,h);
        }
        col += uSunCol * smoothstep(.99935, .99965, s) * 7.;
        col = mix(col, uBelow, smoothstep(0.0, -0.12, h));
        gl_FragColor = vec4(col, 1.);
      }`,
  }), []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamZ!.value = live.camera.z;
    u.uStars!.value = lp.stars;
    u.uAurora!.value = lp.aurora;
    mesh.current?.position.copy(state.camera.position);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1500, 48, 32]} />
    </mesh>
  );
}
