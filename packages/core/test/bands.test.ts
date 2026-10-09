import { describe, expect, it } from 'vitest';
import {
  advanceAltitude, bandIndexAt, bandProgress, bandWeight, elementsForLoop, foldsForLoop, splitAltitude,
} from '../src/bands';

describe('bandIndexAt', () => {
  it('maps band starts to the band above the boundary', () => {
    expect(bandIndexAt(0)).toBe(0);
    expect(bandIndexAt(0.1199)).toBe(0);
    expect(bandIndexAt(0.12)).toBe(1);
    expect(bandIndexAt(0.45)).toBe(2);
    expect(bandIndexAt(0.7)).toBe(3);
    expect(bandIndexAt(0.82)).toBe(4);
    expect(bandIndexAt(0.9999)).toBe(4);
  });
  it('clamps junk input', () => {
    expect(bandIndexAt(-1)).toBe(0);
    expect(bandIndexAt(Number.NaN)).toBe(0);
    expect(bandIndexAt(5)).toBe(4);
  });
});

describe('bandProgress', () => {
  it('is 0..1 within the current band', () => {
    expect(bandProgress(0.22)).toBeCloseTo(0.5, 5);
    expect(bandProgress(0.12)).toBeCloseTo(0, 5);
    expect(bandProgress(0.06)).toBeCloseTo(0.5, 5);
  });
});

describe('bandWeight', () => {
  it('is 1 inside, 0 far away, 0.5 at a boundary', () => {
    expect(bandWeight(0.45, 2)).toBe(1);
    expect(bandWeight(0.05, 2)).toBe(0);
    expect(bandWeight(0.32, 2)).toBeCloseTo(0.5, 5);
    expect(bandWeight(0.32, 1)).toBeCloseTo(0.5, 5);
  });
  it('never fades the first band at 0 or the last band at 1', () => {
    expect(bandWeight(0, 0)).toBe(1);
    expect(bandWeight(1, 4)).toBe(1);
  });
});

describe('splitAltitude', () => {
  it('splits lifetime altitude into loop and loop altitude', () => {
    const s = splitAltitude(2.25);
    expect(s.loop).toBe(2);
    expect(s.loopAlt).toBeCloseTo(0.25, 9);
  });
  it('treats negative and non-finite as zero', () => {
    expect(splitAltitude(-3)).toEqual({ loop: 0, loopAlt: 0 });
    expect(splitAltitude(Number.NaN)).toEqual({ loop: 0, loopAlt: 0 });
    expect(splitAltitude(Number.POSITIVE_INFINITY)).toEqual({ loop: 0, loopAlt: 0 });
  });
});

describe('advanceAltitude', () => {
  it('reports exactly one crossing when stepping over a loop boundary', () => {
    const r = advanceAltitude(0.99, 0.02);
    expect(r.loopsCrossed).toBe(1);
    expect(r.lifetimeAlt).toBeCloseTo(1.01, 9);
  });
  it('reports multiple crossings for a huge step', () => {
    expect(advanceAltitude(0.5, 2.6).loopsCrossed).toBe(3);
  });
  it('never decreases', () => {
    expect(advanceAltitude(1.5, -0.4)).toEqual({ lifetimeAlt: 1.5, loopsCrossed: 0 });
    expect(advanceAltitude(1.5, Number.NaN)).toEqual({ lifetimeAlt: 1.5, loopsCrossed: 0 });
  });
  it('reports no crossing inside a loop', () => {
    expect(advanceAltitude(0.2, 0.1).loopsCrossed).toBe(0);
  });
});

describe('unlocks', () => {
  it('unlocks one fold per loop, capped at five', () => {
    expect(foldsForLoop(0)).toEqual(['dart']);
    expect(foldsForLoop(2)).toEqual(['dart', 'glider', 'crane']);
    expect(foldsForLoop(10)).toHaveLength(5);
    expect(foldsForLoop(-1)).toEqual(['dart']);
  });
  it('adds world elements per loop', () => {
    expect(elementsForLoop(0)).toEqual({ birdsJoin: false, lanternsFromFog: false, moreShootingStars: false, auroraEverywhere: false });
    expect(elementsForLoop(4)).toEqual({ birdsJoin: true, lanternsFromFog: true, moreShootingStars: true, auroraEverywhere: true });
    expect(elementsForLoop(2).lanternsFromFog).toBe(true);
    expect(elementsForLoop(2).moreShootingStars).toBe(false);
  });
});
