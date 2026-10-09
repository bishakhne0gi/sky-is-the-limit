import { describe, expect, it } from 'vitest';
import { PROFILE_KEY, defaultProfile, loadProfile, saveProfile, type Profile } from '@/profile/profile';
import type { StorageLike } from '@/lib/env';

function memStorage(init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}
const throwing: StorageLike = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('quota'); },
};

describe('loadProfile', () => {
  it('uses the v2 key', () => {
    expect(PROFILE_KEY).toBe('sitl.profile.v2');
  });
  it('returns defaults with an id when storage is unavailable', () => {
    const p = loadProfile(null);
    expect(p.id).toMatch(/.{8,}/);
    expect(p.settings).toEqual({ timeOfDay: 'auto', muted: false, reducedMotion: null });
  });
  it('returns defaults when storage throws', () => {
    expect(() => loadProfile(throwing)).not.toThrow();
  });
  it('returns defaults for corrupt JSON', () => {
    expect(loadProfile(memStorage({ [PROFILE_KEY]: '{not json' })).settings.timeOfDay).toBe('auto');
  });
  it('sanitises invalid settings', () => {
    const raw = { id: 'abc12345', settings: { timeOfDay: 'noon', muted: 'yes', reducedMotion: true } };
    const p = loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify(raw) }));
    expect(p).toEqual({ id: 'abc12345', settings: { timeOfDay: 'auto', muted: false, reducedMotion: true } });
  });
  it('keeps a valid time of day', () => {
    const raw = { id: 'abc12345', settings: { timeOfDay: 'night' } };
    expect(loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify(raw) })).settings.timeOfDay).toBe('night');
  });
});

describe('saveProfile', () => {
  it('writes only whitelisted fields (never words)', () => {
    const s = memStorage();
    const p = { ...defaultProfile('abc12345'), words: 'secret' } as Profile & { words: string };
    saveProfile(s, p);
    const stored = JSON.parse(s.data[PROFILE_KEY]!);
    expect(Object.keys(stored).sort()).toEqual(['id', 'settings']);
    expect(JSON.stringify(stored)).not.toContain('secret');
  });
  it('does not throw when storage is full or missing', () => {
    expect(() => saveProfile(throwing, defaultProfile())).not.toThrow();
    expect(() => saveProfile(null, defaultProfile())).not.toThrow();
  });
});
