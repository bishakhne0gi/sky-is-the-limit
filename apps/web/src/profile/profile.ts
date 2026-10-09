import { FOLDS, foldsForLoop, type Fold } from '@sitl/core';
import type { StorageLike } from '@/lib/env';

export type Settings = { autoBreathe: boolean; reducedMotion: boolean | null; muted: boolean };
export type Profile = { id: string; lifetimeAlt: number; loop: number; unlockedFolds: Fold[]; settings: Settings };

export const PROFILE_KEY = 'sitl.profile.v1';

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function defaultProfile(id: string = newId()): Profile {
  return { id, lifetimeAlt: 0, loop: 0, unlockedFolds: ['dart'], settings: { autoBreathe: false, reducedMotion: null, muted: false } };
}

export function parseProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length < 8 || r.id.length > 64) return null;
  const alt = typeof r.lifetimeAlt === 'number' && Number.isFinite(r.lifetimeAlt) && r.lifetimeAlt > 0 ? r.lifetimeAlt : 0;
  const loop = Math.floor(alt);
  const stored = Array.isArray(r.unlockedFolds) ? r.unlockedFolds.filter((f): f is Fold => (FOLDS as readonly unknown[]).includes(f)) : [];
  const unlocked = FOLDS.filter((f) => stored.includes(f) || foldsForLoop(loop).includes(f));
  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  return {
    id: r.id,
    lifetimeAlt: alt,
    loop,
    unlockedFolds: unlocked,
    settings: {
      autoBreathe: s.autoBreathe === true,
      reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : null,
      muted: s.muted === true,
    },
  };
}

export function loadProfile(storage: StorageLike | null): Profile {
  let parsed: Profile | null = null;
  try {
    const text = storage?.getItem(PROFILE_KEY);
    if (text) parsed = parseProfile(JSON.parse(text));
  } catch {
    parsed = null;
  }
  return parsed ?? defaultProfile();
}

export function saveProfile(storage: StorageLike | null, p: Profile): void {
  const data: Profile = {
    id: p.id,
    lifetimeAlt: p.lifetimeAlt,
    loop: p.loop,
    unlockedFolds: [...p.unlockedFolds],
    settings: { autoBreathe: p.settings.autoBreathe, reducedMotion: p.settings.reducedMotion, muted: p.settings.muted },
  };
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: progress simply isn't saved.
  }
}
