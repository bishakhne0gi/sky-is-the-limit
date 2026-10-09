import { BANDS, FOLDS, KIND_ORDER, SOLO_LOOP_SECONDS, type BandIndex, type Fold, type Kind } from '@sitl/core';
import { createRng } from '@/lib/rng';

/** A recorded flight through one band: 1 Hz samples of [x ∈ -1..1, bandAlt ∈ 0..1]. Never contains words. */
export interface EchoPath { kind: Kind; fold: Fold; loop: number; band: BandIndex; samples: [number, number][] }

export const ECHOES_PER_BAND = 4;

export function generateSeedEchoes(seed = 7): EchoPath[] {
  const rand = createRng(seed);
  const out: EchoPath[] = [];
  for (let band = 0; band < BANDS.length; band++) {
    const span = BANDS[band]!.end - BANDS[band]!.start;
    for (let k = 0; k < ECHOES_PER_BAND; k++) {
      const n = Math.min(180, Math.max(30, Math.round(span * SOLO_LOOP_SECONDS * (0.8 + rand() * 0.4))));
      const f1 = 0.02 + rand() * 0.04, f2 = 0.05 + rand() * 0.08, p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2;
      const cx = rand() * 1.2 - 0.6, exp = 0.85 + rand() * 0.3;
      const samples: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const x = Math.max(-1, Math.min(1, cx + 0.35 * Math.sin(i * f1 + p1) + 0.12 * Math.sin(i * f2 + p2)));
        samples.push([x, Math.pow(u, exp)]);
      }
      out.push({
        kind: KIND_ORDER[Math.floor(rand() * KIND_ORDER.length)]!,
        fold: FOLDS[Math.floor(rand() * FOLDS.length)]!,
        loop: Math.floor(rand() * 6),
        band: band as BandIndex,
        samples,
      });
    }
  }
  return out;
}
