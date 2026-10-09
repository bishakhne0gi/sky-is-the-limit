import { bandIndexAt, bandProgress, splitAltitude } from '@sitl/core';
import { useApp } from '@/state/store';
import { live } from './live';

/** Single write path for altitude-derived live fields. Syncs the band to the store only on change. */
export function setLiveAltitude(a: number): void {
  const s = splitAltitude(a);
  live.lifetimeAlt = s.loop + s.loopAlt;
  live.loop = s.loop;
  live.loopAlt = s.loopAlt;
  live.band = bandIndexAt(s.loopAlt);
  live.bandProgress = bandProgress(s.loopAlt);
  const app = useApp.getState();
  if (app.band !== live.band) app.setBand(live.band);
}
