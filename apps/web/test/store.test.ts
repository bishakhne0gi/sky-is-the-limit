import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '@/state/store';
import { defaultProfile } from '@/profile/profile';

describe('useApp', () => {
  beforeEach(() => useApp.getState().hydrate(defaultProfile('abc12345')));

  it('hydrates into the ritual phase with saved settings', () => {
    const s = useApp.getState();
    expect(s.phase).toBe('ritual');
    expect(s.id).toBe('abc12345');
    expect(s.settings.timeOfDay).toBe('auto');
  });
  it('release → launching → flying, keeping kind and fold', () => {
    useApp.getState().release('love', 'crane');
    expect(useApp.getState()).toMatchObject({ phase: 'launching', kind: 'love', fold: 'crane' });
    useApp.getState().setFlying();
    expect(useApp.getState().phase).toBe('flying');
  });
  it('writeAnother returns to the ritual', () => {
    useApp.getState().release('hope', 'dart');
    useApp.getState().setFlying();
    useApp.getState().writeAnother();
    expect(useApp.getState().phase).toBe('ritual');
  });
  it('updates settings partially', () => {
    useApp.getState().updateSettings({ timeOfDay: 'dusk' });
    expect(useApp.getState().settings).toEqual({ timeOfDay: 'dusk', muted: false, reducedMotion: null });
  });
});
