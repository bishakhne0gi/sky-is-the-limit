import {
  BASE_RATE, MAX_DT, PROXIMITY_RADIUS, SYNC_BOOST, SYNC_BOOST_SECONDS,
  UPDRAFT_CAP, UPDRAFT_PER_ECHO, UPDRAFT_PER_FLYER,
} from './constants';

/** Another plane in normalized space: x ∈ [-1, 1], alt = altitude within the band ∈ [0, 1]. */
export interface Presence { x: number; alt: number; echo: boolean }

export function updraft(nearReal: number, nearEcho: number): number {
  const v = Math.max(0, nearReal) * UPDRAFT_PER_FLYER + Math.max(0, nearEcho) * UPDRAFT_PER_ECHO;
  return Math.min(UPDRAFT_CAP, v);
}

export function syncBoostAt(now: number, lastSyncAt: number | null): number {
  if (lastSyncAt === null) return 0;
  const since = now - lastSyncAt;
  return since >= 0 && since < SYNC_BOOST_SECONDS ? SYNC_BOOST : 0;
}

export function climbRate(o: { steadiness: number; updraft: number; syncBoost: number; flutter: boolean }): number {
  if (o.flutter) return 0;
  const s = Number.isFinite(o.steadiness) ? Math.min(1, Math.max(0, o.steadiness)) : 0;
  return BASE_RATE * s * (1 + Math.max(0, o.updraft)) * (1 + Math.max(0, o.syncBoost));
}

export function climbStep(rate: number, dt: number): number {
  const d = Number.isFinite(dt) ? Math.min(MAX_DT, Math.max(0, dt)) : 0;
  return Math.max(0, rate) * d;
}

export function countNear(self: { x: number; alt: number }, others: readonly Presence[]): { real: number; echo: number } {
  let real = 0;
  let echo = 0;
  for (const o of others) {
    if (Math.hypot(o.x - self.x, o.alt - self.alt) > PROXIMITY_RADIUS) continue;
    if (o.echo) echo++;
    else real++;
  }
  return { real, echo };
}
