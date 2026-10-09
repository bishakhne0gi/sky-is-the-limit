import { describe, expect, it } from 'vitest';
import { BASE_RATE, MAX_DT, SOLO_LOOP_SECONDS } from '../src/constants';
import { climbRate, climbStep, countNear, syncBoostAt, updraft } from '../src/lift';

describe('updraft', () => {
  it('adds 0.15 per flyer and 0.075 per echo', () => {
    expect(updraft(2, 0)).toBeCloseTo(0.3, 9);
    expect(updraft(0, 2)).toBeCloseTo(0.15, 9);
  });
  it('caps at 0.6', () => {
    expect(updraft(10, 10)).toBe(0.6);
  });
  it('ignores negative counts', () => {
    expect(updraft(-3, -1)).toBe(0);
  });
});

describe('syncBoostAt', () => {
  it('is 0.5 for 6 s after a sync, then 0', () => {
    expect(syncBoostAt(10, null)).toBe(0);
    expect(syncBoostAt(10, 5)).toBe(0.5);
    expect(syncBoostAt(11.5, 5)).toBe(0);
    expect(syncBoostAt(4, 5)).toBe(0);
  });
});

describe('climbRate', () => {
  it('completes a loop in ~540 s at steadiness 0.85 alone', () => {
    const r = climbRate({ steadiness: 0.85, updraft: 0, syncBoost: 0, flutter: false });
    expect(r * SOLO_LOOP_SECONDS).toBeCloseTo(1, 5);
  });
  it('is 0 while fluttering', () => {
    expect(climbRate({ steadiness: 1, updraft: 0.6, syncBoost: 0.5, flutter: true })).toBe(0);
  });
  it('multiplies updraft and sync boost', () => {
    const r = climbRate({ steadiness: 1, updraft: 0.6, syncBoost: 0.5, flutter: false });
    expect(r).toBeCloseTo(BASE_RATE * 1.6 * 1.5, 12);
  });
  it('is never negative or NaN', () => {
    expect(climbRate({ steadiness: Number.NaN, updraft: 0, syncBoost: 0, flutter: false })).toBe(0);
    expect(climbRate({ steadiness: -1, updraft: 0, syncBoost: 0, flutter: false })).toBe(0);
  });
});

describe('climbStep', () => {
  it('clamps huge frame times so a resumed tab cannot leap', () => {
    expect(climbStep(1, 5)).toBe(MAX_DT);
  });
  it('treats negative or NaN dt as 0', () => {
    expect(climbStep(1, -1)).toBe(0);
    expect(climbStep(1, Number.NaN)).toBe(0);
  });
});

describe('countNear', () => {
  it('counts real flyers and echoes within radius 0.25', () => {
    const near = countNear({ x: 0, alt: 0.5 }, [
      { x: 0.2, alt: 0.5, echo: false },
      { x: 0.3, alt: 0.5, echo: true },
      { x: 0, alt: 0.6, echo: true },
      { x: -0.9, alt: 0.1, echo: false },
    ]);
    expect(near).toEqual({ real: 1, echo: 1 });
  });
});
