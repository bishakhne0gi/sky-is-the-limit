import { describe, expect, it } from 'vitest';
import { BreathTracker, consistencyScore, rangeScore, targetSteadiness } from '../src/breath';

/** Drive a tracker through [inhale, exhale] pairs, updating every 50 ms. Returns the final snapshot. */
function breathe(tracker: BreathTracker, start: number, pattern: [number, number][]) {
  let t = start;
  let snap = tracker.update(t);
  for (const [inh, exh] of pattern) {
    tracker.press(t);
    for (const end = t + inh; t < end; t += 0.05) snap = tracker.update(t);
    tracker.release(t);
    for (const end = t + exh; t < end; t += 0.05) snap = tracker.update(t);
  }
  return { snap, t };
}

describe('rangeScore', () => {
  it('is 1 inside the comfortable range', () => {
    expect(rangeScore(4, 3, 6)).toBe(1);
  });
  it('falls off linearly to 0 at 1.5 s and 10 s', () => {
    expect(rangeScore(1.5, 3, 6)).toBe(0);
    expect(rangeScore(2.25, 3, 6)).toBeCloseTo(0.5, 5);
    expect(rangeScore(8, 3, 6)).toBeCloseTo(0.5, 5);
    expect(rangeScore(12, 3, 6)).toBe(0);
  });
  it('is 0 for non-finite input', () => {
    expect(rangeScore(Number.NaN, 3, 6)).toBe(0);
  });
});

describe('targetSteadiness', () => {
  it('starts at 0.3 and rises slowly until three breaths exist', () => {
    expect(targetSteadiness([])).toBeCloseTo(0.3, 5);
    expect(targetSteadiness([{ inhale: 4, exhale: 6 }])).toBeCloseTo(0.4, 5);
  });
  it('is 1 for three ideal, identical breaths', () => {
    const b = { inhale: 4, exhale: 6 };
    expect(targetSteadiness([b, b, b])).toBeCloseTo(1, 5);
  });
  it('penalises inconsistent periods', () => {
    expect(consistencyScore([{ inhale: 2, exhale: 2 }, { inhale: 6, exhale: 8 }, { inhale: 3, exhale: 9 }])).toBeLessThan(0.3);
  });
});

describe('BreathTracker', () => {
  it('reaches high steadiness with steady 4 s / 6 s breathing', () => {
    const { snap } = breathe(new BreathTracker(0), 0, Array(6).fill([4, 6]));
    expect(snap.steadiness).toBeGreaterThan(0.8);
    expect(snap.flutter).toBe(false);
  });

  it('scores erratic breathing well below steady breathing', () => {
    const steady = breathe(new BreathTracker(0), 0, Array(6).fill([4, 6])).snap.steadiness;
    const erratic = breathe(new BreathTracker(0), 0, [[2, 2], [6, 8], [3, 9], [2, 2], [6, 8], [3, 9]]).snap.steadiness;
    expect(erratic).toBeLessThan(steady - 0.25);
  });

  it('flutters for 3 s after a rushed inhale', () => {
    const tr = new BreathTracker(0);
    tr.press(0);
    tr.release(0.5);
    expect(tr.update(1).flutter).toBe(true);
    expect(tr.update(3.6).flutter).toBe(false);
  });

  it('flutters after a rushed exhale', () => {
    const tr = new BreathTracker(0);
    tr.press(0); tr.release(4); tr.press(4.5);
    expect(tr.update(5).flutter).toBe(true);
  });

  it('decays toward zero when the breath is held forever', () => {
    const tr = new BreathTracker(0);
    tr.press(0);
    let s = tr.update(0);
    for (let t = 0; t <= 30; t += 0.1) s = tr.update(t);
    expect(s.steadiness).toBeLessThan(0.05);
    expect(s.inhaling).toBe(true);
  });

  it('decays toward zero when never pressed', () => {
    const tr = new BreathTracker(0);
    let s = tr.update(0);
    for (let t = 0; t <= 30; t += 0.1) s = tr.update(t);
    expect(s.steadiness).toBeLessThan(0.05);
  });

  it('survives a clock that goes backwards', () => {
    const tr = new BreathTracker(0);
    tr.update(10);
    const s = tr.update(5);
    expect(Number.isFinite(s.steadiness)).toBe(true);
  });

  it('ignores repeated press/release calls', () => {
    const tr = new BreathTracker(0);
    tr.press(0); tr.press(1); tr.release(4); tr.release(5);
    expect(tr.update(5).recentBreaths).toBe(0);
    tr.press(10);
    expect(tr.update(10).recentBreaths).toBe(1);
  });

  it('exposes when the current inhale started', () => {
    const tr = new BreathTracker(0);
    tr.press(2);
    expect(tr.update(3).inhaleStartedAt).toBe(2);
    tr.release(6);
    expect(tr.update(7).inhaleStartedAt).toBeNull();
  });
});
