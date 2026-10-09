import { BANDS, bandIndexAt, bandProgress } from '@sitl/core';

export type RGB = readonly [number, number, number];
export interface Palette {
  top: RGB; mid: RGB; horizon: RGB; sun: RGB; lit: RGB; shadow: RGB; fog: RGB;
  stars: number; aurora: number; sunEl: number; sunAz: number; fogNear: number; fogFar: number;
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const preset = (c: Record<'top' | 'mid' | 'horizon' | 'sun' | 'lit' | 'shadow' | 'fog', string>, n: Omit<Palette, 'top' | 'mid' | 'horizon' | 'sun' | 'lit' | 'shadow' | 'fog'>): Palette => ({
  top: hex(c.top), mid: hex(c.mid), horizon: hex(c.horizon), sun: hex(c.sun), lit: hex(c.lit), shadow: hex(c.shadow), fog: hex(c.fog), ...n,
});

/** One preset per band: Ground, Fog, Above the Clouds, Quiet, Stars. */
export const PRESETS: Palette[] = [
  preset({ top: '#1d2233', mid: '#3a3f55', horizon: '#6b6a7a', sun: '#ffb07a', lit: '#8d8aa0', shadow: '#2a2c3d', fog: '#4a4b5e' },
    { stars: 0, aurora: 0, sunEl: 2, sunAz: -10, fogNear: 20, fogFar: 380 }),
  preset({ top: '#8c93a8', mid: '#a7adbd', horizon: '#c3c6cf', sun: '#ffe2c4', lit: '#e3e3ea', shadow: '#8f93a5', fog: '#b9bcc8' },
    { stars: 0, aurora: 0, sunEl: 10, sunAz: -14, fogNear: 5, fogFar: 120 }),
  preset({ top: '#34488a', mid: '#c398c4', horizon: '#ffc7a3', sun: '#ffcf9e', lit: '#ffe3cf', shadow: '#8679a6', fog: '#f0c1b6' },
    { stars: 0.1, aurora: 0, sunEl: 6, sunAz: -18, fogNear: 120, fogFar: 720 }),
  preset({ top: '#0f2a6b', mid: '#2f5fb0', horizon: '#9cc3ee', sun: '#fff1dc', lit: '#eef4ff', shadow: '#6d87b8', fog: '#8fb2e0' },
    { stars: 0.05, aurora: 0, sunEl: 22, sunAz: 12, fogNear: 150, fogFar: 800 }),
  preset({ top: '#02050f', mid: '#081433', horizon: '#1b2c58', sun: '#c9d8ff', lit: '#5d73a8', shadow: '#0b1430', fog: '#121d40' },
    { stars: 1, aurora: 1, sunEl: 20, sunAz: 22, fogNear: 150, fogFar: 760 }),
];

const COLOR_KEYS = ['top', 'mid', 'horizon', 'sun', 'lit', 'shadow', 'fog'] as const;
const NUM_KEYS = ['stars', 'aurora', 'sunEl', 'sunAz', 'fogNear', 'fogFar'] as const;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Holds each band's preset, cross-fading into the next band over the last 25% of the band. */
export function paletteAt(loopAlt: number): Palette {
  const a = Number.isFinite(loopAlt) ? Math.min(1, Math.max(0, loopAlt)) : 0;
  const i = bandIndexAt(a);
  const from = PRESETS[i]!;
  if (i === BANDS.length - 1) return from;
  const p = bandProgress(a);
  const x = Math.min(1, Math.max(0, (p - 0.75) / 0.25));
  const t = x * x * (3 - 2 * x);
  if (t === 0) return from;
  const to = PRESETS[i + 1]!;
  const out = { ...from } as { -readonly [K in keyof Palette]: Palette[K] };
  for (const k of COLOR_KEYS) out[k] = mixRGB(from[k], to[k], t);
  for (const k of NUM_KEYS) out[k] = from[k] + (to[k] - from[k]) * t;
  return out;
}
