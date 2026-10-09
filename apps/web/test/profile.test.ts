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
  it('returns defaults with an id when storage is unavailable', () => {
    const p = loadProfile(null);
    expect(p.id).toMatch(/.{8,}/);
    expect(p).toMatchObject({ lifetimeAlt: 0, loop: 0, unlockedFolds: ['dart'] });
  });
  it('returns defaults when storage throws', () => {
    expect(() => loadProfile(throwing)).not.toThrow();
    expect(loadProfile(throwing).lifetimeAlt).toBe(0);
  });
  it('returns defaults for corrupt JSON', () => {
    expect(loadProfile(memStorage({ [PROFILE_KEY]: '{not json' })).lifetimeAlt).toBe(0);
  });
  it('sanitises invalid fields and derives loop and folds from altitude', () => {
    const raw = { id: 'abc12345', lifetimeAlt: 2.4, loop: 99, unlockedFolds: ['dart', 'bogus'], settings: { autoBreathe: 'yes', muted: true } };
    const p = loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify(raw) }));
    expect(p.id).toBe('abc12345');
    expect(p.loop).toBe(2);
    expect(p.unlockedFolds).toEqual(['dart', 'glider', 'crane']);
    expect(p.settings).toEqual({ autoBreathe: false, reducedMotion: null, muted: true });
  });
  it('rejects a negative or non-numeric altitude', () => {
    const p = loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify({ id: 'abc12345', lifetimeAlt: 'high' }) }));
    expect(p.lifetimeAlt).toBe(0);
  });
});

describe('saveProfile', () => {
  it('writes only whitelisted fields (never words)', () => {
    const s = memStorage();
    const p = { ...defaultProfile('abc12345'), lifetimeAlt: 1.5, loop: 1, words: 'secret' } as Profile & { words: string };
    saveProfile(s, p);
    const stored = JSON.parse(s.data[PROFILE_KEY]!);
    expect(Object.keys(stored).sort()).toEqual(['id', 'lifetimeAlt', 'loop', 'settings', 'unlockedFolds']);
    expect(JSON.stringify(stored)).not.toContain('secret');
  });
  it('does not throw when storage is full or missing', () => {
    expect(() => saveProfile(throwing, defaultProfile())).not.toThrow();
    expect(() => saveProfile(null, defaultProfile())).not.toThrow();
  });
});
