import { describe, expect, it } from 'vitest';
import { StoryMemory } from '@/story/storyMemory';

describe('StoryMemory', () => {
  it('returns each band line once per loop', () => {
    const m = new StoryMemory();
    expect(m.take(0, 0)).toBe('Everything heavy starts here.');
    expect(m.take(0, 0)).toBeNull();
    expect(m.take(0, 4)).toBe('There was never a top.');
  });
  it('replays lines on the next loop', () => {
    const m = new StoryMemory();
    m.take(0, 2);
    expect(m.take(1, 2)).toBe("Look how far you've come.");
  });
});
