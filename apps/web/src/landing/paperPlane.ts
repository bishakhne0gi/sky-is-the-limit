export type Pt = readonly [number, number];
export interface Shape { left: Pt[]; right: Pt[] }

/**
 * A 140×190 sheet (nose up) folding into a dart seen from above.
 * Each half is a 4-point polygon so stages morph vertex-to-vertex.
 */
export const FOLD_SHAPES: Shape[] = [
  { left: [[70, 0], [0, 0], [0, 190], [70, 190]], right: [[70, 0], [140, 0], [140, 190], [70, 190]] },        // flat sheet
  { left: [[70, 0], [0, 70], [0, 190], [70, 190]], right: [[70, 0], [140, 70], [140, 190], [70, 190]] },      // corners to the crease
  { left: [[70, 0], [28, 118], [28, 190], [70, 190]], right: [[70, 0], [112, 118], [112, 190], [70, 190]] }, // folded again
  { left: [[70, 0], [6, 178], [46, 170], [70, 158]], right: [[70, 0], [134, 178], [94, 170], [70, 158]] },   // the plane
];

const ease = (x: number) => x * x * (3 - 2 * x);
const lerpPoly = (a: Pt[], b: Pt[], f: number): Pt[] => a.map((p, i) => [p[0] + (b[i]![0] - p[0]) * f, p[1] + (b[i]![1] - p[1]) * f]);

/** Shape at fold progress k ∈ [0, 1], passing through every stage. */
export function foldShape(k: number): Shape {
  const stages = FOLD_SHAPES.length - 1;
  const c = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : 0;
  const seg = c * stages;
  const i = Math.min(stages - 1, Math.floor(seg));
  const f = ease(seg - i);
  const a = FOLD_SHAPES[i]!, b = FOLD_SHAPES[i + 1]!;
  if (f === 0) return a;
  if (f === 1) return b;
  return { left: lerpPoly(a.left, b.left, f), right: lerpPoly(a.right, b.right, f) };
}

export type Curve = readonly [Pt, Pt, Pt, Pt];

export function bezier(p: Curve, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
}

/** Heading of the curve at t, in radians (0 = right, -π/2 = up). */
export function bezierAngle(p: Curve, t: number): number {
  const u = 1 - t;
  const dx = 3 * (u * u * (p[1][0] - p[0][0]) + 2 * u * t * (p[2][0] - p[1][0]) + t * t * (p[3][0] - p[2][0]));
  const dy = 3 * (u * u * (p[1][1] - p[0][1]) + 2 * u * t * (p[2][1] - p[1][1]) + t * t * (p[3][1] - p[2][1]));
  return Math.atan2(dy, dx);
}

export interface Timing { appear: number; write: number; fold: number; fly: number; rest: number }
export type Phase = 'appear' | 'write' | 'fold' | 'fly' | 'rest' | 'done';

/** The ambient loop on the landing page. */
export const LOOP: Timing = { appear: 0.8, write: 1.6, fold: 1.8, fly: 4.6, rest: 2.2 };
/** Begin: one quick fold and send before entering the sky. */
export const SEND: Timing = { appear: 0.3, write: 0, fold: 1.0, fly: 1.8, rest: 0 };

const ORDER = ['appear', 'write', 'fold', 'fly', 'rest'] as const;

export function sceneAt(t: number, timing: Timing, loop = true): { phase: Phase; k: number; cycle: number } {
  const total = ORDER.reduce((s, p) => s + timing[p], 0);
  const time = Math.max(0, Number.isFinite(t) ? t : 0);
  if (!loop && time >= total) return { phase: 'done', k: 1, cycle: 0 };
  const cycle = loop ? Math.floor(time / total) : 0;
  let rem = loop ? time - cycle * total : time;
  for (const phase of ORDER) {
    const d = timing[phase];
    if (d > 0 && rem < d) return { phase, k: rem / d, cycle };
    rem -= d;
  }
  return { phase: 'rest', k: 1, cycle };
}
