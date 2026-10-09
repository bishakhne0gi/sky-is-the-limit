import { safeLocalStorage } from '@/lib/env';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { saveProfile } from './profile';

export function persistNow(): void {
  const s = useApp.getState();
  if (!s.id) return;
  const alt = Math.max(s.savedAlt, s.phase === 'flying' ? live.lifetimeAlt : 0);
  saveProfile(safeLocalStorage(), { id: s.id, lifetimeAlt: alt, loop: Math.floor(alt), unlockedFolds: s.unlockedFolds, settings: s.settings });
}
