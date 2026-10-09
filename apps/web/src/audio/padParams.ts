import type { TimeOfDay } from '@/world/timeOfDay';

export type PadKey = TimeOfDay | 'rooftop';

/** Hz. Rooftop A-minor; dawn Fadd9; day Cmaj7; dusk Dmaj9 (open); night Emaj7. */
export const CHORDS: Record<PadKey, number[]> = {
  rooftop: [110, 164.81, 220, 261.63],
  dawn: [87.31, 130.81, 220, 329.63],
  day: [130.81, 196, 329.63, 493.88],
  dusk: [146.83, 220, 369.99, 440],
  night: [164.81, 246.94, 415.3, 622.25],
};
const CUTOFF: Record<PadKey, number> = { rooftop: 500, dawn: 900, day: 1400, dusk: 1000, night: 1700 };
const GAIN: Record<PadKey, number> = { rooftop: 0.14, dawn: 0.15, day: 0.15, dusk: 0.14, night: 0.13 };

export function padFor(key: PadKey): { chord: number[]; cutoff: number; gain: number } {
  return { chord: CHORDS[key], cutoff: CUTOFF[key], gain: GAIN[key] };
}
