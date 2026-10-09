'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { createRng } from '@/lib/rng';

const DROPS = 1200;

/** Falling streaks in a box that travels with the camera. Heavy on the Ground, a drizzle into the Fog. */
export function Rain() {
  const { geometry, material } = useMemo(() => {
    const rand = createRng(23);
    const base = new Float32Array(DROPS * 6), end = new Float32Array(DROPS * 2);
    for (let i = 0; i < DROPS; i++) {
      const x = rand() * 90, y = rand() * 70, z = rand() * 140;
      base.set([x, y, z, x, y, z], i * 6);
      end[i * 2 + 1] = 1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 6), 3));
    geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
    geometry.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uAmt: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aBase; attribute float aEnd; uniform float uTime, uAmt; uniform vec3 uCam; varying float vA;
        void main(){
          vec3 box = vec3(90., 70., 140.);
          vec3 p;
          p.x = mod(aBase.x - uCam.x + box.x*.5, box.x) - box.x*.5 + uCam.x;
          p.y = mod(aBase.y - uTime*38. - uCam.y + box.y*.5, box.y) - box.y*.5 + uCam.y;
          p.z = mod(aBase.z - uCam.z, box.z) - box.z + uCam.z + 10.;
          p += vec3(.6, 1.8, 0.) * aEnd;
          vA = uAmt * (1. - aEnd*.7);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */ `varying float vA; void main(){ gl_FragColor = vec4(vec3(.75,.8,.9)*vA*.35, 1.); }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    (u.uCam!.value as THREE.Vector3).set(live.camera.x, live.camera.y, live.camera.z);
    u.uAmt!.value = 1 - live.skyWeight;
  });
  return <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
