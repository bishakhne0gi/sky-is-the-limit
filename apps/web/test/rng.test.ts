import { describe, expect, it } from 'vitest';
import { createRng } from '@/lib/rng';

describe('createRng', () => {
  it('is deterministic per seed and in [0, 1)', () => {
    const a = createRng(7), b = createRng(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
