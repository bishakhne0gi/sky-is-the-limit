import * as THREE from 'three';
import type { Palette } from './palette';

const WHITE = new THREE.Color(1, 1, 1);

/** THREE mirror of the current palette. Shader uniforms hold references to these objects. */
export const livePalette = {
  top: new THREE.Color(), mid: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color(),
  lit: new THREE.Color(), shadow: new THREE.Color(), fog: new THREE.Color(),
  below: new THREE.Color(), cirrus: new THREE.Color(), tint: new THREE.Color(),
  sunDir: new THREE.Vector3(0, 0.2, -1).normalize(),
  stars: 0, aurora: 0, fogNear: 120, fogFar: 700,
};

export function applyPalette(p: Palette, loop: number): void {
  const lp = livePalette;
  for (const k of ['top', 'mid', 'horizon', 'sun', 'lit', 'shadow', 'fog'] as const) lp[k].setRGB(p[k][0], p[k][1], p[k][2], THREE.SRGBColorSpace);
  const el = THREE.MathUtils.degToRad(p.sunEl), az = THREE.MathUtils.degToRad(p.sunAz);
  lp.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  lp.below.copy(lp.shadow).lerp(lp.fog, 0.5);
  lp.cirrus.copy(lp.lit).lerp(lp.sun, 0.35);
  lp.tint.copy(lp.lit).lerp(WHITE, 0.55);
  lp.stars = p.stars;
  lp.aurora = Math.max(p.aurora, loop >= 4 ? 0.25 : 0);
  lp.fogNear = p.fogNear;
  lp.fogFar = p.fogFar;
}
