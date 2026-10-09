import { describe, expect, it } from 'vitest';
import { GuideVisibility, guidePhase } from '@/flight/guide';

describe('guidePhase', () => {
  it('inhales for 4 s then exhales for 6 s, repeating', () => {
    expect(guidePhase(1).inhaling).toBe(true);
    expect(guidePhase(5).inhaling).toBe(false);
    expect(guidePhase(11).inhaling).toBe(true);
  });
  it('scale peaks at the end of the inhale', () => {
    expect(guidePhase(0).scale).toBeCloseTo(0, 5);
    expect(guidePhase(4).scale).toBeCloseTo(1, 5);
    expect(guidePhase(9.999).scale).toBeLessThan(0.01);
  });
});

describe('GuideVisibility', () => {
  it('starts visible on loop 0 and hidden on later loops', () => {
    expect(new GuideVisibility(0).visible).toBe(true);
    expect(new GuideVisibility(1).visible).toBe(false);
  });
  it('hides after 30 s of steadiness above 0.7', () => {
    const g = new GuideVisibility(0);
    for (let t = 0; t < 29; t += 0.5) g.update(t, 0.8);
    expect(g.visible).toBe(true);
    for (let t = 29; t <= 31; t += 0.5) g.update(t, 0.8);
    expect(g.visible).toBe(false);
  });
  it('returns after 20 s below 0.3, on any loop', () => {
    const g = new GuideVisibility(2);
    for (let t = 0; t <= 21; t += 0.5) g.update(t, 0.1);
    expect(g.visible).toBe(true);
  });
  it('a brief dip does not toggle it', () => {
    const g = new GuideVisibility(1);
    for (let t = 0; t <= 10; t += 0.5) g.update(t, 0.1);
    g.update(10.5, 0.5);
    for (let t = 11; t <= 25; t += 0.5) g.update(t, 0.1);
    expect(g.visible).toBe(false);
  });
});
