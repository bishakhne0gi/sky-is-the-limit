'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { AHEAD, wrap } from '../clouds/cloudField';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

const WORDS = ['Sky', 'is the', 'limit'];
const SPACE = 330, WL = SPACE * WORDS.length;

const fragment = NOISE + /* glsl */ `
  uniform sampler2D uTex; uniform float uDist, uTime, uWeight; uniform vec3 uTint, uSunCol; varying vec2 vUv;
  void main(){
    vec4 t = texture2D(uTex, vUv);
    float n = fbm(vUv*vec2(9., 2.6) + vec2(uTime*.12, 0.)) * 1.12;
    float dis = smoothstep(170., 30., uDist);
    float keep = smoothstep(dis - .14, dis + .04, n);
    float ember = (smoothstep(dis - .16, dis, n) - smoothstep(dis, dis + .14, n)) * step(.02, dis);
    float a = t.a * keep * smoothstep(560., 330., uDist) * uWeight;
    vec3 col = uTint * (1.15 + .9*t.a) + uSunCol * ember * 3.5;
    gl_FragColor = vec4(col, a);
  }`;

export function Words() {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[]>([]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(66, 16.5), []);

  useEffect(() => {
    let cancelled = false;
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-serif').trim() || 'Georgia, serif';
    // Load the face explicitly: fonts.ready can resolve before the serif has ever been requested.
    void document.fonts.load(`italic 400 330px ${family}`).catch(() => undefined).then(() => {
      if (cancelled || !group.current) return;
      meshes.current = WORDS.map((w, i) => {
        const cv = document.createElement('canvas');
        cv.width = 2048; cv.height = 512;
        const g = cv.getContext('2d')!;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
        g.font = `italic 400 330px ${family}`;
        g.shadowColor = 'rgba(255,255,255,.65)'; g.shadowBlur = 50;
        g.fillText(w, 1024, 270); g.shadowBlur = 0; g.fillText(w, 1024, 270);
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 4;
        const m = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
          uniforms: { uTex: { value: tex }, uDist: { value: 999 }, uTime: { value: 0 }, uWeight: { value: 0 }, uTint: { value: lp.tint }, uSunCol: { value: lp.sun } },
          transparent: true, depthWrite: false,
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
          fragmentShader: fragment,
        }));
        m.renderOrder = 2;
        m.frustumCulled = false;
        m.userData.z = -260 - i * SPACE;
        group.current!.add(m);
        return m;
      });
    });
    return () => {
      cancelled = true;
      meshes.current.forEach((m) => { m.material.uniforms.uTex!.value.dispose(); m.material.dispose(); m.removeFromParent(); });
      meshes.current = [];
    };
  }, [geometry]);

  useFrame((state) => {
    const weight = live.skyWeight;
    for (const m of meshes.current) {
      const rel = wrap(live.camera.z - (m.userData.z as number), WL);
      m.position.set(live.camera.x * 0.55, live.camera.y + 3.5, live.camera.z + AHEAD - rel);
      m.visible = rel > AHEAD && weight > 0.01;
      const u = m.material.uniforms;
      u.uDist!.value = rel - AHEAD;
      u.uTime!.value = state.clock.elapsedTime;
      u.uWeight!.value = weight;
    }
  });
  return <group ref={group} />;
}
