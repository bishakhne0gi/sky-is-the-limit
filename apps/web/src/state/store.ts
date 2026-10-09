import { create } from 'zustand';
import type { Fold, Kind } from '@/lib/constants';
import type { Profile, Settings } from '@/profile/profile';

export type Phase = 'loading' | 'ritual' | 'launching' | 'flying';

interface AppState {
  id: string;
  phase: Phase;
  kind: Kind;
  fold: Fold;
  settings: Settings;
  hydrate(p: Profile): void;
  release(kind: Kind, fold: Fold): void;
  setFlying(): void;
  writeAnother(): void;
  updateSettings(s: Partial<Settings>): void;
}

export const useApp = create<AppState>()((set, get) => ({
  id: '',
  phase: 'loading',
  kind: 'hope',
  fold: 'dart',
  settings: { timeOfDay: 'auto', muted: false, reducedMotion: null },
  hydrate: (p) => set({ id: p.id, phase: 'ritual', settings: p.settings }),
  release: (kind, fold) => set({ kind, fold, phase: 'launching' }),
  setFlying: () => set({ phase: 'flying' }),
  writeAnother: () => set({ phase: 'ritual' }),
  updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
}));
