import { bandIndexAt, type BandIndex } from '@sitl/core';

/** Hz. Ground A-minor, Fog F-add9, Above Cmaj7, Quiet open D (sparse), Stars Emaj7. */
export const CHORDS: number[][] = [
  [110, 164.81, 220, 261.63],
  [87.31, 130.81, 220, 329.63],
  [130.81, 196, 329.63, 493.88],
  [146.83, 220, 369.99],
  [164.81, 246.94, 415.3, 622.25],
];
const CUTOFF = [500, 700, 1400, 1100, 1800];
const GAIN = [0.16, 0.15, 0.18, 0.11, 0.15];

export function padParamsAt(loopAlt: number): { band: BandIndex; chord: number[]; cutoff: number; gain: number } {
  const band = bandIndexAt(loopAlt);
  return { band, chord: CHORDS[band]!, cutoff: CUTOFF[band]!, gain: GAIN[band]! };
}
