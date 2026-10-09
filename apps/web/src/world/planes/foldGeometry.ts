import * as THREE from 'three';
import type { Fold } from '@sitl/core';

type V = readonly [number, number, number];
const tri = (...vs: V[]) => vs.flat();

// Every fold faces -Z (nose forward) with wings in X.
const N: V = [0, 0, -2.1], TL: V = [-1.45, 0.18, 1.05], TR: V = [1.45, 0.18, 1.05], C: V = [0, 0, 1.05], K: V = [0, -0.5, 1.05], Kn: V = [0, -0.05, -1.6];
const DART = [...tri(N, TL, C), ...tri(N, C, TR), ...tri(Kn, C, K), ...tri(Kn, K, C)];

const SOURCES: Record<Fold, number[]> = {
  dart: DART,
  glider: (() => {
    const n: V = [0, 0, -1.6], l: V = [-2.2, 0.1, 0.7], r: V = [2.2, 0.1, 0.7], c: V = [0, 0, 0.9], k: V = [0, -0.35, 0.9], kn: V = [0, -0.04, -1.2];
    return [...tri(n, l, c), ...tri(n, c, r), ...tri(kn, c, k), ...tri(kn, k, c)];
  })(),
  crane: (() => {
    const f: V = [0, 0, -0.5], b: V = [0, 0, 0.5];
    return [
      ...tri([-2.2, 0.6, 0], f, b), ...tri([2.2, 0.6, 0], b, f),
      ...tri(f, [0, 0.9, -1.6], [0, 0.1, -0.2]),
      ...tri(b, [0, 0.8, 1.5], [0, 0.1, 0.2]),
      ...tri(f, [0, -0.4, 0], b),
    ];
  })(),
  lanternwing: [...DART, ...tri(TL, [-1.45, 0.7, 1.05], [-1.1, 0.18, 0.6]), ...tri(TR, [1.1, 0.18, 0.6], [1.45, 0.7, 1.05])],
  starkite: (() => {
    const n: V = [0, 0, -2], l: V = [-1.3, 0, 0], t: V = [0, 0, 2.2], r: V = [1.3, 0, 0], c: V = [0, 0.25, 0];
    return [...tri(n, l, c), ...tri(n, c, r), ...tri(l, t, c), ...tri(c, t, r)];
  })(),
};

const cache = new Map<Fold, THREE.BufferGeometry>();

/** Shared, cached geometry per fold. Callers must not dispose it. */
export function foldGeometry(fold: Fold): THREE.BufferGeometry {
  let g = cache.get(fold);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(SOURCES[fold], 3));
    g.computeVertexNormals();
    cache.set(fold, g);
  }
  return g;
}
