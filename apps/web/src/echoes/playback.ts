import type { EchoPath } from './seed';

export const pathDuration = (p: EchoPath) => Math.max(0, p.samples.length - 1);

export function echoPositionAt(p: EchoPath, seconds: number): { x: number; alt: number } {
  const d = pathDuration(p);
  const s = Number.isFinite(seconds) ? Math.min(d, Math.max(0, seconds)) : 0;
  const i = Math.floor(s), j = Math.min(i + 1, d), f = s - i;
  const a = p.samples[i]!, b = p.samples[j]!;
  return { x: a[0] + (b[0] - a[0]) * f, alt: a[1] + (b[1] - a[1]) * f };
}

/** Seconds into the path at which it first reaches `bandAlt`, so an echo can join beside the player. */
export function startOffsetFor(p: EchoPath, bandAlt: number): number {
  const target = Number.isFinite(bandAlt) ? Math.min(1, Math.max(0, bandAlt)) : 0;
  for (let i = 0; i < p.samples.length; i++) if (p.samples[i]![1] >= target) return i;
  return pathDuration(p);
}

/** Farther than this (in band altitude) and an echo no longer reads as a companion. */
export const MAX_ECHO_DRIFT = 0.3;

export function needsReassign(pos: { alt: number }, playerAlt: number, elapsed: number, duration: number): boolean {
  return elapsed >= duration || Math.abs(pos.alt - playerAlt) > MAX_ECHO_DRIFT;
}
