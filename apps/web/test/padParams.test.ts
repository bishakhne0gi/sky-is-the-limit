import { describe, expect, it } from 'vitest';
import { CHORDS, padParamsAt } from '@/audio/padParams';

describe('padParamsAt', () => {
  it('has a chord of positive frequencies for every band', () => {
    expect(CHORDS).toHaveLength(5);
    for (const c of CHORDS) { expect(c.length).toBeGreaterThanOrEqual(3); c.forEach((f) => expect(f).toBeGreaterThan(20)); }
  });
  it('picks the band from loop altitude', () => {
    expect(padParamsAt(0.7).band).toBe(3);
    expect(padParamsAt(0.7).chord).toBe(CHORDS[3]);
  });
  it('The Quiet is the sparsest and softest', () => {
    expect(padParamsAt(0.7).gain).toBeLessThan(padParamsAt(0.45).gain);
    expect(padParamsAt(0.7).chord.length).toBeLessThan(padParamsAt(0.45).chord.length);
  });
});
