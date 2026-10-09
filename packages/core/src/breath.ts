import { FLUTTER_SECONDS, RUSH_SECONDS } from './constants';

export interface Breath { inhale: number; exhale: number }
export interface BreathSnapshot {
  inhaling: boolean;
  steadiness: number;
  flutter: boolean;
  recentBreaths: number;
  inhaleStartedAt: number | null;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 1 inside [lo, hi]; linear falloff to 0 at `min` below and `max` above. */
export function rangeScore(d: number, lo: number, hi: number, min = 1.5, max = 10): number {
  if (!Number.isFinite(d)) return 0;
  if (d >= lo && d <= hi) return 1;
  if (d < lo) return clamp01((d - min) / (lo - min));
  return clamp01((max - d) / (max - hi));
}

export function breathRangeScore(b: Breath): number {
  return (rangeScore(b.inhale, 3, 6) + rangeScore(b.exhale, 4, 8)) / 2;
}

/** 1 when breath periods are identical; 0 once the coefficient of variation reaches 0.5. */
export function consistencyScore(breaths: Breath[]): number {
  const p = breaths.map((b) => b.inhale + b.exhale);
  if (p.length === 0) return 0;
  const mean = p.reduce((s, v) => s + v, 0) / p.length;
  if (mean <= 0) return 0;
  const sd = Math.sqrt(p.reduce((s, v) => s + (v - mean) ** 2, 0) / p.length);
  return clamp01(1 - sd / mean / 0.5);
}

export function targetSteadiness(breaths: Breath[]): number {
  const recent = breaths.slice(-3);
  if (recent.length < 3) return 0.3 + 0.1 * recent.length;
  const range = recent.reduce((s, b) => s + breathRangeScore(b), 0) / recent.length;
  return 0.6 * range + 0.4 * consistencyScore(recent);
}

export class BreathTracker {
  steadiness = 0.3;
  inhaling = false;
  private breaths: Breath[] = [];
  private pressAt: number | null = null;
  private releaseAt: number;
  private flutterUntil = Number.NEGATIVE_INFINITY;
  private lastT: number;

  constructor(now: number) {
    this.releaseAt = now;
    this.lastT = now;
  }

  press(t: number): void {
    if (this.inhaling) return;
    const exhale = t - this.releaseAt;
    if (this.pressAt !== null) {
      this.breaths.push({ inhale: this.releaseAt - this.pressAt, exhale });
      if (this.breaths.length > 3) this.breaths.shift();
      if (exhale < RUSH_SECONDS) this.flutterUntil = t + FLUTTER_SECONDS;
    }
    this.pressAt = t;
    this.inhaling = true;
  }

  release(t: number): void {
    if (!this.inhaling) return;
    if (this.pressAt !== null && t - this.pressAt < RUSH_SECONDS) this.flutterUntil = t + FLUTTER_SECONDS;
    this.releaseAt = t;
    this.inhaling = false;
  }

  update(t: number): BreathSnapshot {
    const dt = Math.max(0, Math.min(t - this.lastT, 0.25));
    this.lastT = Math.max(this.lastT, t);
    // An over-long ongoing phase (holding forever, or never pressing) pulls the target down.
    const ongoing = this.inhaling && this.pressAt !== null
      ? rangeScore(t - this.pressAt, 0, 6)
      : rangeScore(t - this.releaseAt, 0, 8);
    const target = Math.min(targetSteadiness(this.breaths), ongoing);
    this.steadiness += (target - this.steadiness) * (1 - Math.exp(-dt * 1.5));
    if (!Number.isFinite(this.steadiness)) this.steadiness = 0;
    return {
      inhaling: this.inhaling,
      steadiness: this.steadiness,
      flutter: t < this.flutterUntil,
      recentBreaths: this.breaths.length,
      inhaleStartedAt: this.inhaling ? this.pressAt : null,
    };
  }
}
