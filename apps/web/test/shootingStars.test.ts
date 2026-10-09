import { describe, expect, it } from 'vitest';
import { ambientInterval } from '@/world/elements/shootingStarTiming';

describe('ambientInterval', () => {
  it('is null outside The Stars', () => {
    expect(ambientInterval(0, 0)).toBeNull();
    expect(ambientInterval(5, 0.05)).toBeNull();
  });
  it('is more frequent from loop 3', () => {
    expect(ambientInterval(0, 1)).toBe(9);
    expect(ambientInterval(3, 1)).toBe(3.5);
  });
});
