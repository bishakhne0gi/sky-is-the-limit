import { describe, expect, it } from 'vitest';
import { FrameBudget } from '@/world/frameBudget';

const feed = (b: FrameBudget, dt: number, seconds: number) => {
  let stepDown = false;
  for (let t = 0; t < seconds; t += dt) stepDown = b.sample(dt) || stepDown;
  return stepDown;
};

describe('FrameBudget', () => {
  it('asks to step down when frames are consistently slower than 1/40 s', () => {
    expect(feed(new FrameBudget(), 1 / 25, 3)).toBe(true);
  });
  it('stays put at 60 fps', () => {
    expect(feed(new FrameBudget(), 1 / 60, 10)).toBe(false);
  });
  it('ignores stalls from a throttled or backgrounded window', () => {
    expect(feed(new FrameBudget(), 1, 30)).toBe(false);
  });
});
