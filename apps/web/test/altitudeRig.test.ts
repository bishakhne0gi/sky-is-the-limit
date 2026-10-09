import { describe, expect, it } from 'vitest';
import { CLOUD_DECK, cameraBaseY } from '@/world/altitudeRig';

describe('cameraBaseY', () => {
  it('rises monotonically through a loop', () => {
    let prev = -Infinity;
    for (let a = 0; a <= 1; a += 0.01) {
      const y = cameraBaseY(a);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });
  it('is below the cloud deck on the Ground and above it from Above the Clouds', () => {
    expect(cameraBaseY(0.05)).toBeLessThan(CLOUD_DECK.bottom);
    expect(cameraBaseY(0.33)).toBeGreaterThan(10);
    expect(cameraBaseY(0.2)).toBeGreaterThan(CLOUD_DECK.bottom - 15);
  });
});
