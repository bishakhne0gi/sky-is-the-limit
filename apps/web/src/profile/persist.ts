import { safeLocalStorage } from '@/lib/env';
import { useApp } from '@/state/store';
import { saveProfile } from './profile';

export function persistNow(): void {
  const s = useApp.getState();
  if (s.id) saveProfile(safeLocalStorage(), { id: s.id, settings: s.settings });
}
