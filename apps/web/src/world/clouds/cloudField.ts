export const W = 640;
export const L = 760;
export const AHEAD = 30;

export const wrap = (v: number, m: number) => ((v % m) + m) % m;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface Puff { x: number; y: number; z: number; s: number; seed: number }

/** Cumulus clusters (some tall towers) over a flat floor of large puffs. Ported from v1. */
export function generatePuffs(density: number, rand: () => number): Puff[] {
  const puffs: Puff[] = [];
  const clusters = Math.round(240 * density);
  for (let c = 0; c < clusters; c++) {
    const cx = rand() * W - W / 2, cz = rand() * L;
    const tall = rand() < 0.2 ? 14 + rand() * 18 : 3 + rand() * 7;
    const base = -2 + rand() * 3;
    const n = 6 + Math.floor(rand() * 6);
    for (let k = 0; k < n; k++) {
      const t = rand(), spread = (1 - t * 0.6) * (10 + rand() * 8);
      puffs.push({ x: cx + (rand() - 0.5) * spread * 2, y: base + t * tall, z: cz + (rand() - 0.5) * spread * 1.6, s: (1 - t * 0.45) * (12 + rand() * 13), seed: rand() });
    }
  }
  const floor = Math.round(720 * density);
  for (let k = 0; k < floor; k++) puffs.push({ x: rand() * W - W / 2, y: -9 + rand() * 4, z: rand() * L, s: 26 + rand() * 22, seed: rand() });
  return puffs;
}

/** World position of a puff on the endless torus sliding past the camera. `rel` grows with distance ahead. */
export function wrapPuff(p: Puff, camX: number, camZ: number) {
  const rel = wrap(camZ - p.z, L);
  return { rel, x: camX + wrap(p.x - camX + W / 2, W) - W / 2, z: camZ + AHEAD - rel };
}

export function createSortWork(n: number) {
  return { rel: new Float32Array(n), wx: new Float32Array(n), order: Uint32Array.from({ length: n }, (_, i) => i) };
}

/** Writes aPos (xyz) and aData (scale, seed, fade, height01) sorted far → near for correct alpha blending. */
export function writeSortedPuffs(
  puffs: Puff[], work: ReturnType<typeof createSortWork>, pos: Float32Array, data: Float32Array, camX: number, camZ: number,
): void {
  const n = puffs.length;
  for (let i = 0; i < n; i++) {
    const w = wrapPuff(puffs[i]!, camX, camZ);
    work.rel[i] = w.rel;
    work.wx[i] = w.x;
  }
  work.order.sort((a, b) => work.rel[b]! - work.rel[a]!);
  for (let j = 0; j < n; j++) {
    const i = work.order[j]!, p = puffs[i]!, rel = work.rel[i]!, ahead = rel - AHEAD;
    const edge = 1 - smoothstep(W / 2 - 90, W / 2, Math.abs(work.wx[i]! - camX));
    const fade = smoothstep(3, 22, ahead) * smoothstep(0, 140, L - rel) * edge;
    pos[j * 3] = work.wx[i]!; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = camZ + AHEAD - rel;
    data[j * 4] = p.s; data[j * 4 + 1] = p.seed; data[j * 4 + 2] = fade; data[j * 4 + 3] = Math.min(1, Math.max(0, (p.y + 9) / 30));
  }
}
