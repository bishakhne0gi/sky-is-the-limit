import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '@/state/store';
import { defaultProfile } from '@/profile/profile';

describe('useApp', () => {
  beforeEach(() => useApp.getState().hydrate(defaultProfile('abc12345')));

  it('hydrates into the ritual phase', () => {
    const s = useApp.getState();
    expect(s.phase).toBe('ritual');
    expect(s.id).toBe('abc12345');
  });

  it('release → launching → flying', () => {
    useApp.getState().release('love', 'dart');
    expect(useApp.getState()).toMatchObject({ phase: 'launching', kind: 'love', fold: 'dart' });
    useApp.getState().setFlying();
    expect(useApp.getState().phase).toBe('flying');
  });

  it('newDawn moves to ritual, advances loop, unlocks folds and stamps dawnAt', () => {
    const before = useApp.getState().dawnAt;
    useApp.getState().newDawn(1.01);
    const s = useApp.getState();
    expect(s.phase).toBe('ritual');
    expect(s.loop).toBe(1);
    expect(s.savedAlt).toBeCloseTo(1.01);
    expect(s.unlockedFolds).toEqual(['dart', 'glider']);
    expect(s.dawnAt).toBeGreaterThan(before);
  });

  it('never lowers savedAlt', () => {
    useApp.getState().setSavedAlt(0.5);
    useApp.getState().setSavedAlt(0.2);
    expect(useApp.getState().savedAlt).toBe(0.5);
  });
});
