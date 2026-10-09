import { create } from 'zustand';
import { FOLDS, foldsForLoop, type BandIndex, type Fold, type Kind } from '@sitl/core';
import type { Profile, Settings } from '@/profile/profile';

export type Phase = 'loading' | 'ritual' | 'launching' | 'flying';

interface AppState {
  id: string;
  phase: Phase;
  kind: Kind;
  fold: Fold;
  band: BandIndex;
  loop: number;
  savedAlt: number;
  unlockedFolds: Fold[];
  settings: Settings;
  dawnAt: number;
  hydrate(p: Profile): void;
  release(kind: Kind, fold: Fold): void;
  setFlying(): void;
  setBand(b: BandIndex): void;
  newDawn(lifetimeAlt: number): void;
  setSavedAlt(a: number): void;
  updateSettings(s: Partial<Settings>): void;
}

export const useApp = create<AppState>()((set, get) => ({
  id: '',
  phase: 'loading',
  kind: 'hope',
  fold: 'dart',
  band: 0,
  loop: 0,
  savedAlt: 0,
  unlockedFolds: ['dart'],
  settings: { autoBreathe: false, reducedMotion: null, muted: false },
  dawnAt: 0,
  hydrate: (p) => set({
    id: p.id, phase: 'ritual', loop: p.loop, savedAlt: p.lifetimeAlt, unlockedFolds: p.unlockedFolds,
    settings: p.settings, fold: p.unlockedFolds[p.unlockedFolds.length - 1] ?? 'dart', band: 0,
  }),
  release: (kind, fold) => set({ kind, fold, phase: 'launching' }),
  setFlying: () => set({ phase: 'flying' }),
  setBand: (band) => set({ band }),
  newDawn: (lifetimeAlt) => {
    const loop = Math.floor(lifetimeAlt);
    const have = get().unlockedFolds;
    const unlockedFolds = FOLDS.filter((f) => have.includes(f) || foldsForLoop(loop).includes(f));
    set({ loop, unlockedFolds, savedAlt: Math.max(get().savedAlt, lifetimeAlt), phase: 'ritual', band: 0, dawnAt: Date.now() });
  },
  setSavedAlt: (a) => set({ savedAlt: Math.max(get().savedAlt, a) }),
  updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
}));
