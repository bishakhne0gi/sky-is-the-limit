import { describe, expect, it } from 'vitest';
import { ambientInterval } from '@/world/elements/shootingStarTiming';

describe('ambientInterval', () => {
  it('is null when there are no stars', () => {
    expect(ambientInterval(0)).toBeNull();
    expect(ambientInterval(0.05)).toBeNull();
  });
  it('is every few seconds under a full night sky', () => {
    expect(ambientInterval(1)).toBe(6);
  });
});
