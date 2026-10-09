export type RGB = readonly [number, number, number];
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type TimeSetting = TimeOfDay | 'auto';

export interface Palette {
  top: RGB; mid: RGB; horizon: RGB; sun: RGB; lit: RGB; shadow: RGB; fog: RGB;
  stars: number; aurora: number; lanterns: number; birds: number;
  sunEl: number; sunAz: number; fogNear: number; fogFar: number;
}

const COLOR_KEYS = ['top', 'mid', 'horizon', 'sun', 'lit', 'shadow', 'fog'] as const;
const NUM_KEYS = ['stars', 'aurora', 'lanterns', 'birds', 'sunEl', 'sunAz', 'fogNear', 'fogFar'] as const;
type ColorHex = Record<(typeof COLOR_KEYS)[number], string>;
type Numbers = Pick<Palette, (typeof NUM_KEYS)[number]>;

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const preset = (c: ColorHex, n: Numbers): Palette => ({
  top: hex(c.top), mid: hex(c.mid), horizon: hex(c.horizon), sun: hex(c.sun), lit: hex(c.lit), shadow: hex(c.shadow), fog: hex(c.fog), ...n,
});

export const TIMES: readonly TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];

/** The v1 presets (with its tuned day contrast and darker night). */
export const PRESETS: Record<TimeOfDay, Palette> = {
  dawn: preset({ top: '#34488a', mid: '#c398c4', horizon: '#ffc7a3', sun: '#ffcf9e', lit: '#ffe3cf', shadow: '#8679a6', fog: '#f0c1b6' },
    { stars: 0.15, aurora: 0, lanterns: 0.25, birds: 1, sunEl: 5, sunAz: -18, fogNear: 120, fogFar: 720 }),
  day: preset({ top: '#1f5fc4', mid: '#5a9be6', horizon: '#c3defc', sun: '#fff3dc', lit: '#ffffff', shadow: '#7593c2', fog: '#b9d4f2' },
    { stars: 0, aurora: 0, lanterns: 0, birds: 1, sunEl: 24, sunAz: 14, fogNear: 120, fogFar: 720 }),
  dusk: preset({ top: '#21184a', mid: '#a8417c', horizon: '#ff9658', sun: '#ff8738', lit: '#ffb286', shadow: '#5a3a6c', fog: '#dc7c78' },
    { stars: 0.35, aurora: 0, lanterns: 0.85, birds: 1, sunEl: 3, sunAz: 8, fogNear: 120, fogFar: 720 }),
  night: preset({ top: '#02050f', mid: '#081433', horizon: '#1b2c58', sun: '#c9d8ff', lit: '#5d73a8', shadow: '#0b1430', fog: '#121d40' },
    { stars: 1, aurora: 1, lanterns: 1, birds: 0, sunEl: 20, sunAz: 22, fogNear: 120, fogFar: 720 }),
};

/** Dusk in the rain under the cloud deck, where the ritual happens. */
export const ROOFTOP: Palette = preset(
  { top: '#1d2233', mid: '#3a3f55', horizon: '#6b6a7a', sun: '#ffb07a', lit: '#8d8aa0', shadow: '#2a2c3d', fog: '#4a4b5e' },
  { stars: 0, aurora: 0, lanterns: 0, birds: 0, sunEl: 2, sunAz: -10, fogNear: 20, fogFar: 380 },
);

export function mixPalette(a: Palette, b: Palette, t: number): Palette {
  const k = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  if (k === 0) return a;
  if (k === 1) return b;
  const out = { ...a } as { -readonly [K in keyof Palette]: Palette[K] };
  for (const key of COLOR_KEYS) {
    const x = a[key], y = b[key];
    out[key] = [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k];
  }
  for (const key of NUM_KEYS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

export const AUTO_SECONDS = 10;

/** Endless: dawn → day → dusk → night, 10 s each, forever. */
export function autoTimeOfDay(elapsed: number): TimeOfDay {
  const i = Math.floor(Math.max(0, Number.isFinite(elapsed) ? elapsed : 0) / AUTO_SECONDS) % TIMES.length;
  return TIMES[i]!;
}
