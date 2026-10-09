import { describe, expect, it } from 'vitest';
import { CHORDS, padFor } from '@/audio/padParams';

describe('padFor', () => {
  it('has a chord of positive frequencies for the rooftop and each time of day', () => {
    for (const key of ['rooftop', 'dawn', 'day', 'dusk', 'night'] as const) {
      expect(CHORDS[key].length).toBeGreaterThanOrEqual(3);
      CHORDS[key].forEach((f) => expect(f).toBeGreaterThan(20));
    }
  });
  it('returns the chord and a gentle gain', () => {
    const p = padFor('night');
    expect(p.chord).toBe(CHORDS.night);
    expect(p.gain).toBeGreaterThan(0);
    expect(p.gain).toBeLessThan(0.25);
  });
});
