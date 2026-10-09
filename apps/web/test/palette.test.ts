import { describe, expect, it } from 'vitest';
import { PRESETS, paletteAt } from '@/world/palette';

describe('paletteAt', () => {
  it('returns the band preset in the middle of a band', () => {
    expect(paletteAt(0.05)).toEqual(PRESETS[0]);
    expect(paletteAt(0.45)).toEqual(PRESETS[2]);
    expect(paletteAt(0.9)).toEqual(PRESETS[4]);
  });
  it('is continuous across band boundaries', () => {
    for (const edge of [0.12, 0.32, 0.58, 0.82]) {
      const a = paletteAt(edge - 1e-4), b = paletteAt(edge + 1e-4);
      for (let i = 0; i < 3; i++) expect(Math.abs(a.top[i]! - b.top[i]!)).toBeLessThan(0.02);
      expect(Math.abs(a.fogFar - b.fogFar)).toBeLessThan(5);
    }
  });
  it('handles junk input', () => {
    expect(paletteAt(Number.NaN)).toEqual(PRESETS[0]);
  });
});
