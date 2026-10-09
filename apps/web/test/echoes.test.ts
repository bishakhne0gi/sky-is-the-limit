import { describe, expect, it } from 'vitest';
import { ECHOES_PER_BAND, generateSeedEchoes } from '@/echoes/seed';
import { echoPositionAt, needsReassign, pathDuration, startOffsetFor } from '@/echoes/playback';

describe('generateSeedEchoes', () => {
  const echoes = generateSeedEchoes();
  it('is deterministic', () => {
    expect(generateSeedEchoes()).toEqual(echoes);
  });
  it('has 4 paths per band', () => {
    for (let b = 0; b < 5; b++) expect(echoes.filter((e) => e.band === b)).toHaveLength(ECHOES_PER_BAND);
  });
  it('produces valid, monotonic paths of at most 180 samples', () => {
    for (const e of echoes) {
      expect(e.samples.length).toBeGreaterThanOrEqual(30);
      expect(e.samples.length).toBeLessThanOrEqual(180);
      for (let i = 0; i < e.samples.length; i++) {
        const [x, alt] = e.samples[i]!;
        expect(x).toBeGreaterThanOrEqual(-1);
        expect(x).toBeLessThanOrEqual(1);
        if (i > 0) expect(alt).toBeGreaterThanOrEqual(e.samples[i - 1]![1]);
      }
      expect(e.samples[0]![1]).toBe(0);
      expect(e.samples.at(-1)![1]).toBeCloseTo(1, 9);
    }
  });
});

describe('playback', () => {
  const path = { kind: 'hope' as const, fold: 'dart' as const, loop: 0, band: 2 as const, samples: [[0, 0], [1, 0.5], [0, 1]] as [number, number][] };
  it('runs at 1 Hz', () => {
    expect(pathDuration(path)).toBe(2);
  });
  it('interpolates between samples', () => {
    expect(echoPositionAt(path, 0.5)).toEqual({ x: 0.5, alt: 0.25 });
  });
  it('clamps outside the path', () => {
    expect(echoPositionAt(path, -3)).toEqual({ x: 0, alt: 0 });
    expect(echoPositionAt(path, 99)).toEqual({ x: 0, alt: 1 });
  });
  it('finds the first sample at or above an altitude', () => {
    expect(startOffsetFor(path, 0.4)).toBe(1);
    expect(startOffsetFor(path, 2)).toBe(2);
    expect(startOffsetFor(path, Number.NaN)).toBe(0);
  });
});

describe('needsReassign', () => {
  it('reassigns a finished path', () => {
    expect(needsReassign({ alt: 0.5 }, 0.5, 10, 10)).toBe(true);
  });
  it('reassigns an echo that has drifted far from the player', () => {
    expect(needsReassign({ alt: 0.05 }, 0.5, 3, 100)).toBe(true);
  });
  it('keeps a nearby echo that is still playing', () => {
    expect(needsReassign({ alt: 0.4 }, 0.5, 3, 100)).toBe(false);
  });
});
