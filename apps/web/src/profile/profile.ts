import type { StorageLike } from '@/lib/env';
import type { TimeSetting } from '@/world/timeOfDay';

export type Settings = { timeOfDay: TimeSetting; muted: boolean; reducedMotion: boolean | null };
export type Profile = { id: string; settings: Settings };

export const PROFILE_KEY = 'sitl.profile.v2';
const TIME_SETTINGS: readonly TimeSetting[] = ['auto', 'dawn', 'day', 'dusk', 'night'];

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function defaultProfile(id: string = newId()): Profile {
  return { id, settings: { timeOfDay: 'auto', muted: false, reducedMotion: null } };
}

export function parseProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || r.id.length < 8 || r.id.length > 64) return null;
  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  return {
    id: r.id,
    settings: {
      timeOfDay: TIME_SETTINGS.includes(s.timeOfDay as TimeSetting) ? (s.timeOfDay as TimeSetting) : 'auto',
      muted: s.muted === true,
      reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : null,
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
    settings: { timeOfDay: p.settings.timeOfDay, muted: p.settings.muted, reducedMotion: p.settings.reducedMotion },
  };
  try {
    storage?.setItem(PROFILE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: settings simply aren't saved.
  }
}
