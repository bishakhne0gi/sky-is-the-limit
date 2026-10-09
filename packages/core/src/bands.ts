import { BANDS, FOLDS, type BandIndex, type Fold } from './constants';

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export function bandIndexAt(loopAlt: number): BandIndex {
  const a = clamp01(loopAlt);
  for (let i = BANDS.length - 1; i >= 0; i--) if (a >= BANDS[i].start) return i as BandIndex;
  return 0;
}

export function bandProgress(loopAlt: number): number {
  const a = clamp01(loopAlt);
  const b = BANDS[bandIndexAt(a)];
  return clamp01((a - b.start) / (b.end - b.start));
}

/** 1 inside `band`, cross-fading to 0 across ±fade around its edges. */
export function bandWeight(loopAlt: number, band: BandIndex, fade = 0.03): number {
  const a = clamp01(loopAlt);
  const b = BANDS[band];
  const lo = band === 0 ? 1 : smooth(b.start - fade, b.start + fade, a);
  const hi = band === 4 ? 1 : 1 - smooth(b.end - fade, b.end + fade, a);
  return Math.min(lo, hi);
}

export function splitAltitude(lifetimeAlt: number): { loop: number; loopAlt: number } {
  const safe = Number.isFinite(lifetimeAlt) && lifetimeAlt > 0 ? lifetimeAlt : 0;
  const loop = Math.floor(safe);
  return { loop, loopAlt: safe - loop };
}

/** Monotonic: negative or non-finite deltas are ignored. */
export function advanceAltitude(lifetimeAlt: number, delta: number): { lifetimeAlt: number; loopsCrossed: number } {
  const from = splitAltitude(lifetimeAlt);
  const d = Number.isFinite(delta) && delta > 0 ? delta : 0;
  const next = from.loop + from.loopAlt + d;
  return { lifetimeAlt: next, loopsCrossed: Math.floor(next) - from.loop };
}

export function foldsForLoop(loop: number): Fold[] {
  const n = Math.min(FOLDS.length, Math.max(0, Math.floor(loop)) + 1);
  return FOLDS.slice(0, n);
}

export function elementsForLoop(loop: number) {
  return {
    birdsJoin: loop >= 1,
    lanternsFromFog: loop >= 2,
    moreShootingStars: loop >= 3,
    auroraEverywhere: loop >= 4,
  };
}
