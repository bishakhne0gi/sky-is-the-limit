import { describe, expect, it } from 'vitest';
import { CRUISE_Y, LAUNCH_SECONDS, ROOFTOP_Y, insideDeck, launchBlend, launchCameraY } from '@/world/launch';

describe('launch curve', () => {
  it('starts at the rooftop and ends at cruise height', () => {
    expect(launchCameraY(0)).toBeCloseTo(ROOFTOP_Y, 6);
    expect(launchCameraY(1)).toBeCloseTo(CRUISE_Y, 6);
    expect(LAUNCH_SECONDS).toBeGreaterThanOrEqual(5);
  });
  it('rises monotonically', () => {
    let prev = -Infinity;
    for (let k = 0; k <= 1; k += 0.01) { const y = launchCameraY(k); expect(y).toBeGreaterThanOrEqual(prev); prev = y; }
  });
  it('blends from rooftop look to sky look while passing the deck', () => {
    expect(launchBlend(0)).toBe(0);
    expect(launchBlend(1)).toBe(1);
    expect(launchBlend(0.2)).toBeLessThan(0.05);
  });
  it('clamps junk progress', () => {
    expect(launchCameraY(Number.NaN)).toBeCloseTo(ROOFTOP_Y, 6);
    expect(launchBlend(7)).toBe(1);
  });
});

describe('insideDeck', () => {
  it('is 0 far below the deck and well above it, ~1 in the middle', () => {
    expect(insideDeck(-70)).toBe(0);
    expect(insideDeck(20)).toBe(0);
    expect(insideDeck(-2)).toBeGreaterThan(0.9);
  });
});
