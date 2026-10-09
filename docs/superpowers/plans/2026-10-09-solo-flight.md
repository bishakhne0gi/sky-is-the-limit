# Solo Flight (Plan 1 of 2) Implementation Plan

> **Superseded (2026-10-09):** the breath/bands/echoes design was dropped in favour of the v1 flight plus the ritual. See the revised spec. This plan is kept as a record of what was built first.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the v1 single-file piece into a deployable Next.js app that delivers the full single-player journey: the ritual, breath-driven flight through five altitude bands, new dawns, folds, story lines, seed echoes, and generative audio.

**Architecture:** A pnpm workspace. `packages/core` holds pure, tested game logic (bands, breath, lift). `apps/web` is a Next.js App Router app. The `/fly` page lazy-loads a React Three Fiber scene in which every visual element is its own component. Per-frame state lives in a mutable `live` object, read inside `useFrame`. UI-relevant state lives in a zustand store. Shaders are ported from v1 (`legacy/v1.html`). Multiplayer is Plan 2. This plan leaves the seams it needs: `live.others`, `live.lastSyncAt` and `queueShootingStar()`.

**Tech Stack:** pnpm 10 · Next.js 16.4.0 · React 19.3.0 · three 0.186.1 · @react-three/fiber 9.8.1 · @react-three/postprocessing 3.1.3 · postprocessing 6.39.5 · zustand 5.0.15 · TypeScript 5.9.3 · Vitest 5.0.3

**Spec:** `docs/superpowers/specs/2026-10-09-sky-is-the-limit-design.md`

## Global Constraints

- Node ≥ 22, pnpm 10. Exact versions as listed in Tech Stack. TypeScript 5.9.3 (not 7.x).
- **Intention words are never persisted or transmitted.** They live only in `src/flight/intention.ts` module memory.
- **No numbers or scores during flight.** Lifetime altitude may appear on the ritual screen only.
- **Altitude never decreases.**
- Every `localStorage` access goes through try/catch, and the app works without storage.
- Kind colors: hope `#ffc65a`, release `#a9c8ff`, courage `#ff7a3d`, love `#ff8fb1`, peace `#5fe0c8`.
- Bands (loop range → story line):
  - The Ground 0.00–0.12 → "Everything heavy starts here."
  - The Fog 0.12–0.32 → "You can't see far. You don't need to."
  - Above the Clouds 0.32–0.58 → "Look how far you've come."
  - The Quiet 0.58–0.82 → "Nothing to prove up here."
  - The Stars 0.82–1.00 → "There was never a top."
- Folds by loop: Dart (0), Glider (1), Crane (2), Lantern-wing (3), Star-kite (4+).
- Steadiness 0.85 solo completes a loop in ~540 s. Updraft: +0.15 per real flyer, +0.075 per echo, capped at 0.60. Sync boost: +0.5 for 6 s.
- Breath ranges: inhale 3–6 s, exhale 4–8 s, full falloff at 1.5 s / 10 s. Rushing under 1.5 s → flutter for 3 s.
- 1 loop = 30,000 ft.
- Visual style: v1's glass UI. Fonts are Instrument Serif (display) and Inter (UI).
- Performance: adaptive pixel ratio (step down if the average frame time is over 1/40 s, minimum 0.75). Coarse-pointer devices use 50% of the clouds.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **`localStorage` blocked, full or corrupt:** the app must start with defaults and never throw. Pinned in Task 4, `profile.test.ts`.
2. **Tab backgrounded, then one huge frame:** altitude must not leap. `dt` is clamped to `MAX_DT`. Pinned in Task 3, `lift.test.ts` (`climbStep` clamp).
3. **Holding forever, or never pressing:** steadiness must decay toward 0 with no NaN, even if the clock goes backwards. Pinned in Task 2, `breath.test.ts`.
4. **Touch cancelled, window blurred, or tab hidden mid-inhale:** the breath must release rather than stick on "inhaling". Multi-touch must not release early. Pinned in Task 6, `breathInput.test.ts`.
5. **One step crossing a loop boundary, or several:** new dawn fires exactly once per crossing and folds unlock correctly. Pinned in Task 1, `bands.test.ts` (`advanceAltitude`), and Task 4, `store.test.ts` (`newDawn`).

---

## File Map

```
package.json, pnpm-workspace.yaml, tsconfig.base.json, README.md
legacy/v1.html                                  (moved from index.html)
packages/core/
  package.json, tsconfig.json
  src/index.ts                                  re-exports
  src/constants.ts                              all tuning constants, bands, kinds, folds
  src/bands.ts                                  altitude ↔ loop/band math, fold/element unlocks
  src/breath.ts                                 BreathTracker + steadiness scoring
  src/lift.ts                                   updraft, climb rate, proximity
  test/bands.test.ts, test/breath.test.ts, test/lift.test.ts
apps/web/
  package.json, tsconfig.json, next.config.ts, vitest.config.ts, next-env.d.ts
  app/layout.tsx, app/globals.css, app/page.tsx, app/page.module.css
  app/fly/page.tsx, app/fly/FlyClient.tsx
  src/lib/rng.ts                                seeded RNG
  src/lib/env.ts                                safeLocalStorage, prefersReducedMotion, isCoarsePointer
  src/profile/profile.ts                        load/save/validate device profile
  src/profile/persist.ts                        persistNow() (store + live → storage)
  src/state/store.ts                            zustand UI store (useApp)
  src/flight/live.ts                            mutable per-frame state
  src/flight/altitude.ts                        setLiveAltitude()
  src/flight/intention.ts                       in-memory words
  src/flight/breathInput.ts                     pure input state (pointers/keys/blur)
  src/flight/attachInput.ts                     DOM wiring for BreathInput + steering
  src/flight/guide.ts                           guide phase + visibility rules
  src/flight/FlightSystem.tsx                   per-frame flight loop
  src/world/Experience.tsx                      Canvas + all world components + overlay
  src/world/palette.ts                          band presets + blending (pure)
  src/world/livePalette.ts                      THREE.Color mirror of the palette
  src/world/altitudeRig.ts                      cameraBaseY(loopAlt)
  src/world/CameraRig.tsx, PaletteDriver.tsx, Lights.tsx, Effects.tsx, AdaptiveQuality.tsx
  src/world/shaders/noise.ts                    shared GLSL noise
  src/world/sky/SkyDome.tsx
  src/world/clouds/cloudField.ts                puff generation, wrap + depth sort (pure)
  src/world/clouds/cloudMaterial.ts             billboard cloud ShaderMaterial (shared by whales)
  src/world/clouds/CloudSea.tsx
  src/world/planes/foldGeometry.ts              5 fold geometries
  src/world/planes/glowTexture.ts
  src/world/planes/PlayerPlane.tsx              plane + glow + contrails
  src/world/planes/BreathRing.tsx
  src/world/ground/Rooftop.tsx, City.tsx, Rain.tsx
  src/world/elements/Words.tsx, Birds.tsx, Whales.tsx, Lanterns.tsx, ShootingStars.tsx
  src/echoes/seed.ts, src/echoes/playback.ts, src/echoes/EchoPlanes.tsx
  src/story/storyMemory.ts
  src/audio/padParams.ts, src/audio/engine.ts, src/audio/AudioDriver.tsx
  src/ui/Overlay.tsx, Ritual.tsx, Ritual.module.css, StoryLine.tsx, Hud.tsx, DawnFlash.tsx, ui.module.css
  test/*.test.ts                                (web unit tests)
```

---

### Task 1: Workspace and core altitude math

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/src/constants.ts`, `packages/core/src/bands.ts`, `packages/core/src/index.ts`
- Test: `packages/core/test/bands.test.ts`

**Interfaces:**
- Produces:
  - `BANDS`, `BandIndex` (`0|1|2|3|4`), `KINDS`, `Kind`, `KIND_ORDER`, `FOLDS`, `Fold`
  - Constants: `FEET_PER_LOOP`, `SOLO_LOOP_SECONDS`, `REFERENCE_STEADINESS`, `BASE_RATE`, `UPDRAFT_PER_FLYER`, `UPDRAFT_PER_ECHO`, `UPDRAFT_CAP`, `SYNC_BOOST`, `SYNC_BOOST_SECONDS`, `PROXIMITY_RADIUS`, `MAX_DT`, `RUSH_SECONDS`, `FLUTTER_SECONDS`
  - Functions:
    - `bandIndexAt(loopAlt): BandIndex`
    - `bandProgress(loopAlt): number`
    - `bandWeight(loopAlt, band, fade?): number`
    - `splitAltitude(lifetimeAlt): { loop, loopAlt }`
    - `advanceAltitude(lifetimeAlt, delta): { lifetimeAlt, loopsCrossed }`
    - `foldsForLoop(loop): Fold[]`
    - `elementsForLoop(loop): { birdsJoin, lanternsFromFog, moreShootingStars, auroraEverywhere }`

- [ ] **Step 1: Create the workspace files**

`package.json`:
```json
{
  "name": "sky-is-the-limit",
  "private": true,
  "packageManager": "pnpm@10.28.1",
  "scripts": {
    "dev": "pnpm --filter @sitl/web dev",
    "build": "pnpm --filter @sitl/web build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`packages/core/package.json`:
```json
{
  "name": "@sitl/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" }
}
```

`packages/core/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "noEmit": true, "types": [] }, "include": ["src", "test"] }
```

Run: `cd packages/core && pnpm add -D typescript@5.9.3 vitest@5.0.3 && cd ../..`

- [ ] **Step 2: Write `constants.ts`**

```ts
export const BANDS = [
  { id: 'ground', name: 'The Ground', start: 0, end: 0.12, line: 'Everything heavy starts here.' },
  { id: 'fog', name: 'The Fog', start: 0.12, end: 0.32, line: "You can't see far. You don't need to." },
  { id: 'above', name: 'Above the Clouds', start: 0.32, end: 0.58, line: "Look how far you've come." },
  { id: 'quiet', name: 'The Quiet', start: 0.58, end: 0.82, line: 'Nothing to prove up here.' },
  { id: 'stars', name: 'The Stars', start: 0.82, end: 1, line: 'There was never a top.' },
] as const;
export type BandIndex = 0 | 1 | 2 | 3 | 4;

export const KINDS = {
  hope: '#ffc65a',
  release: '#a9c8ff',
  courage: '#ff7a3d',
  love: '#ff8fb1',
  peace: '#5fe0c8',
} as const;
export type Kind = keyof typeof KINDS;
export const KIND_ORDER: readonly Kind[] = ['hope', 'release', 'courage', 'love', 'peace'];

export const FOLDS = ['dart', 'glider', 'crane', 'lanternwing', 'starkite'] as const;
export type Fold = (typeof FOLDS)[number];

export const FEET_PER_LOOP = 30000;
export const SOLO_LOOP_SECONDS = 540;
export const REFERENCE_STEADINESS = 0.85;
/** Loops per second at steadiness 1, no updraft. */
export const BASE_RATE = 1 / (SOLO_LOOP_SECONDS * REFERENCE_STEADINESS);

export const UPDRAFT_PER_FLYER = 0.15;
export const UPDRAFT_PER_ECHO = 0.075;
export const UPDRAFT_CAP = 0.6;
export const SYNC_BOOST = 0.5;
export const SYNC_BOOST_SECONDS = 6;
export const PROXIMITY_RADIUS = 0.25;

/** Largest simulation step in seconds; protects against tab-resume frame spikes. */
export const MAX_DT = 0.1;
export const RUSH_SECONDS = 1.5;
export const FLUTTER_SECONDS = 3;
```

- [ ] **Step 3: Write the failing test `packages/core/test/bands.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  advanceAltitude, bandIndexAt, bandProgress, bandWeight, elementsForLoop, foldsForLoop, splitAltitude,
} from '../src/bands';

describe('bandIndexAt', () => {
  it('maps band starts to the band above the boundary', () => {
    expect(bandIndexAt(0)).toBe(0);
    expect(bandIndexAt(0.1199)).toBe(0);
    expect(bandIndexAt(0.12)).toBe(1);
    expect(bandIndexAt(0.45)).toBe(2);
    expect(bandIndexAt(0.7)).toBe(3);
    expect(bandIndexAt(0.82)).toBe(4);
    expect(bandIndexAt(0.9999)).toBe(4);
  });
  it('clamps junk input', () => {
    expect(bandIndexAt(-1)).toBe(0);
    expect(bandIndexAt(Number.NaN)).toBe(0);
    expect(bandIndexAt(5)).toBe(4);
  });
});

describe('bandProgress', () => {
  it('is 0..1 within the current band', () => {
    expect(bandProgress(0.22)).toBeCloseTo(0.5, 5);
    expect(bandProgress(0.12)).toBeCloseTo(0, 5);
    expect(bandProgress(0.06)).toBeCloseTo(0.5, 5);
  });
});

describe('bandWeight', () => {
  it('is 1 inside, 0 far away, 0.5 at a boundary', () => {
    expect(bandWeight(0.45, 2)).toBe(1);
    expect(bandWeight(0.05, 2)).toBe(0);
    expect(bandWeight(0.32, 2)).toBeCloseTo(0.5, 5);
    expect(bandWeight(0.32, 1)).toBeCloseTo(0.5, 5);
  });
  it('never fades the first band at 0 or the last band at 1', () => {
    expect(bandWeight(0, 0)).toBe(1);
    expect(bandWeight(1, 4)).toBe(1);
  });
});

describe('splitAltitude', () => {
  it('splits lifetime altitude into loop and loop altitude', () => {
    const s = splitAltitude(2.25);
    expect(s.loop).toBe(2);
    expect(s.loopAlt).toBeCloseTo(0.25, 9);
  });
  it('treats negative and non-finite as zero', () => {
    expect(splitAltitude(-3)).toEqual({ loop: 0, loopAlt: 0 });
    expect(splitAltitude(Number.NaN)).toEqual({ loop: 0, loopAlt: 0 });
    expect(splitAltitude(Number.POSITIVE_INFINITY)).toEqual({ loop: 0, loopAlt: 0 });
  });
});

describe('advanceAltitude', () => {
  it('reports exactly one crossing when stepping over a loop boundary', () => {
    const r = advanceAltitude(0.99, 0.02);
    expect(r.loopsCrossed).toBe(1);
    expect(r.lifetimeAlt).toBeCloseTo(1.01, 9);
  });
  it('reports multiple crossings for a huge step', () => {
    expect(advanceAltitude(0.5, 2.6).loopsCrossed).toBe(3);
  });
  it('never decreases', () => {
    expect(advanceAltitude(1.5, -0.4)).toEqual({ lifetimeAlt: 1.5, loopsCrossed: 0 });
    expect(advanceAltitude(1.5, Number.NaN)).toEqual({ lifetimeAlt: 1.5, loopsCrossed: 0 });
  });
  it('reports no crossing inside a loop', () => {
    expect(advanceAltitude(0.2, 0.1).loopsCrossed).toBe(0);
  });
});

describe('unlocks', () => {
  it('unlocks one fold per loop, capped at five', () => {
    expect(foldsForLoop(0)).toEqual(['dart']);
    expect(foldsForLoop(2)).toEqual(['dart', 'glider', 'crane']);
    expect(foldsForLoop(10)).toHaveLength(5);
    expect(foldsForLoop(-1)).toEqual(['dart']);
  });
  it('adds world elements per loop', () => {
    expect(elementsForLoop(0)).toEqual({ birdsJoin: false, lanternsFromFog: false, moreShootingStars: false, auroraEverywhere: false });
    expect(elementsForLoop(4)).toEqual({ birdsJoin: true, lanternsFromFog: true, moreShootingStars: true, auroraEverywhere: true });
    expect(elementsForLoop(2).lanternsFromFog).toBe(true);
    expect(elementsForLoop(2).moreShootingStars).toBe(false);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @sitl/core test`
Expected: FAIL with "Failed to resolve import ../src/bands".

- [ ] **Step 5: Implement `bands.ts` and `index.ts`**

`packages/core/src/bands.ts`:
```ts
import { BANDS, FOLDS, type BandIndex, type Fold } from './constants';

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export function bandIndexAt(loopAlt: number): BandIndex {
  const a = clamp01(loopAlt);
  for (let i = BANDS.length - 1; i >= 0; i--) if (a >= BANDS[i].start) return i as BandIndex;
  return 0;
}

export function bandProgress(loopAlt: number): number {
  const a = clamp01(loopAlt);
  const b = BANDS[bandIndexAt(a)];
  return clamp01((a - b.start) / (b.end - b.start));
}

/** 1 inside `band`, cross-fading to 0 across ±fade around its edges. */
export function bandWeight(loopAlt: number, band: BandIndex, fade = 0.03): number {
  const a = clamp01(loopAlt);
  const b = BANDS[band];
  const lo = band === 0 ? 1 : smooth(b.start - fade, b.start + fade, a);
  const hi = band === 4 ? 1 : 1 - smooth(b.end - fade, b.end + fade, a);
  return Math.min(lo, hi);
}

export function splitAltitude(lifetimeAlt: number): { loop: number; loopAlt: number } {
  const safe = Number.isFinite(lifetimeAlt) && lifetimeAlt > 0 ? lifetimeAlt : 0;
  const loop = Math.floor(safe);
  return { loop, loopAlt: safe - loop };
}

/** Monotonic: negative or non-finite deltas are ignored. */
export function advanceAltitude(lifetimeAlt: number, delta: number): { lifetimeAlt: number; loopsCrossed: number } {
  const from = splitAltitude(lifetimeAlt);
  const d = Number.isFinite(delta) && delta > 0 ? delta : 0;
  const next = from.loop + from.loopAlt + d;
  return { lifetimeAlt: next, loopsCrossed: Math.floor(next) - from.loop };
}

export function foldsForLoop(loop: number): Fold[] {
  const n = Math.min(FOLDS.length, Math.max(0, Math.floor(loop)) + 1);
  return FOLDS.slice(0, n);
}

export function elementsForLoop(loop: number) {
  return {
    birdsJoin: loop >= 1,
    lanternsFromFog: loop >= 2,
    moreShootingStars: loop >= 3,
    auroraEverywhere: loop >= 4,
  };
}
```

`packages/core/src/index.ts`:
```ts
export * from './constants';
export * from './bands';
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/core test && pnpm --filter @sitl/core typecheck`
Expected: all `bands.test.ts` tests PASS, and typecheck exits 0.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json pnpm-lock.yaml packages/core
git commit -m "feat(core): workspace scaffold and altitude/band math

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Breath tracker and steadiness

**Files:**
- Create: `packages/core/src/breath.ts`
- Modify: `packages/core/src/index.ts` (add the export)
- Test: `packages/core/test/breath.test.ts`

**Interfaces:**
- Consumes: `RUSH_SECONDS` and `FLUTTER_SECONDS` from `constants.ts`.
- Produces:
  - `interface Breath { inhale: number; exhale: number }`
  - `interface BreathSnapshot { inhaling: boolean; steadiness: number; flutter: boolean; recentBreaths: number; inhaleStartedAt: number | null }`
  - `rangeScore(d, lo, hi, min?, max?)`
  - `breathRangeScore(b)`
  - `consistencyScore(breaths)`
  - `targetSteadiness(breaths)`
  - `class BreathTracker`:
    - `constructor(now: number)`
    - `press(t: number): void`
    - `release(t: number): void`
    - `update(t: number): BreathSnapshot`
    - public read-only fields: `steadiness`, `inhaling`

- [ ] **Step 1: Write the failing test `packages/core/test/breath.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { BreathTracker, consistencyScore, rangeScore, targetSteadiness } from '../src/breath';

/** Drive a tracker through [inhale, exhale] pairs, updating every 50 ms. Returns the final snapshot. */
function breathe(tracker: BreathTracker, start: number, pattern: [number, number][]) {
  let t = start;
  let snap = tracker.update(t);
  for (const [inh, exh] of pattern) {
    tracker.press(t);
    for (const end = t + inh; t < end; t += 0.05) snap = tracker.update(t);
    tracker.release(t);
    for (const end = t + exh; t < end; t += 0.05) snap = tracker.update(t);
  }
  return { snap, t };
}

describe('rangeScore', () => {
  it('is 1 inside the comfortable range', () => {
    expect(rangeScore(4, 3, 6)).toBe(1);
  });
  it('falls off linearly to 0 at 1.5 s and 10 s', () => {
    expect(rangeScore(1.5, 3, 6)).toBe(0);
    expect(rangeScore(2.25, 3, 6)).toBeCloseTo(0.5, 5);
    expect(rangeScore(8, 3, 6)).toBeCloseTo(0.5, 5);
    expect(rangeScore(12, 3, 6)).toBe(0);
  });
  it('is 0 for non-finite input', () => {
    expect(rangeScore(Number.NaN, 3, 6)).toBe(0);
  });
});

describe('targetSteadiness', () => {
  it('starts at 0.3 and rises slowly until three breaths exist', () => {
    expect(targetSteadiness([])).toBeCloseTo(0.3, 5);
    expect(targetSteadiness([{ inhale: 4, exhale: 6 }])).toBeCloseTo(0.4, 5);
  });
  it('is 1 for three ideal, identical breaths', () => {
    const b = { inhale: 4, exhale: 6 };
    expect(targetSteadiness([b, b, b])).toBeCloseTo(1, 5);
  });
  it('penalises inconsistent periods', () => {
    expect(consistencyScore([{ inhale: 2, exhale: 2 }, { inhale: 6, exhale: 8 }, { inhale: 3, exhale: 9 }])).toBeLessThan(0.3);
  });
});

describe('BreathTracker', () => {
  it('reaches high steadiness with steady 4 s / 6 s breathing', () => {
    const { snap } = breathe(new BreathTracker(0), 0, Array(6).fill([4, 6]));
    expect(snap.steadiness).toBeGreaterThan(0.8);
    expect(snap.flutter).toBe(false);
  });

  it('scores erratic breathing well below steady breathing', () => {
    const steady = breathe(new BreathTracker(0), 0, Array(6).fill([4, 6])).snap.steadiness;
    const erratic = breathe(new BreathTracker(0), 0, [[2, 2], [6, 8], [3, 9], [2, 2], [6, 8], [3, 9]]).snap.steadiness;
    expect(erratic).toBeLessThan(steady - 0.25);
  });

  it('flutters for 3 s after a rushed inhale', () => {
    const tr = new BreathTracker(0);
    tr.press(0);
    tr.release(0.5);
    expect(tr.update(1).flutter).toBe(true);
    expect(tr.update(3.6).flutter).toBe(false);
  });

  it('flutters after a rushed exhale', () => {
    const tr = new BreathTracker(0);
    tr.press(0); tr.release(4); tr.press(4.5);
    expect(tr.update(5).flutter).toBe(true);
  });

  it('decays toward zero when the breath is held forever', () => {
    const tr = new BreathTracker(0);
    tr.press(0);
    let s = tr.update(0);
    for (let t = 0; t <= 30; t += 0.1) s = tr.update(t);
    expect(s.steadiness).toBeLessThan(0.05);
    expect(s.inhaling).toBe(true);
  });

  it('decays toward zero when never pressed', () => {
    const tr = new BreathTracker(0);
    let s = tr.update(0);
    for (let t = 0; t <= 30; t += 0.1) s = tr.update(t);
    expect(s.steadiness).toBeLessThan(0.05);
  });

  it('survives a clock that goes backwards', () => {
    const tr = new BreathTracker(0);
    tr.update(10);
    const s = tr.update(5);
    expect(Number.isFinite(s.steadiness)).toBe(true);
  });

  it('ignores repeated press/release calls', () => {
    const tr = new BreathTracker(0);
    tr.press(0); tr.press(1); tr.release(4); tr.release(5);
    expect(tr.update(5).recentBreaths).toBe(0);
    tr.press(10);
    expect(tr.update(10).recentBreaths).toBe(1);
  });

  it('exposes when the current inhale started', () => {
    const tr = new BreathTracker(0);
    tr.press(2);
    expect(tr.update(3).inhaleStartedAt).toBe(2);
    tr.release(6);
    expect(tr.update(7).inhaleStartedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/core test`
Expected: FAIL with "Failed to resolve import ../src/breath".

- [ ] **Step 3: Implement `packages/core/src/breath.ts`**

```ts
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
```

Add `export * from './breath';` to `packages/core/src/index.ts`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/core test && pnpm --filter @sitl/core typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): breath tracker with steadiness, flutter and decay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Lift, updraft and proximity

**Files:**
- Create: `packages/core/src/lift.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/test/lift.test.ts`

**Interfaces:**
- Consumes: `BASE_RATE`, `UPDRAFT_*`, `SYNC_*`, `PROXIMITY_RADIUS`, `MAX_DT`.
- Produces:
  - `interface Presence { x: number; alt: number; echo: boolean }`
  - `updraft(nearReal, nearEcho): number`
  - `syncBoostAt(now, lastSyncAt: number | null): number`
  - `climbRate({ steadiness, updraft, syncBoost, flutter }): number` (loops per second)
  - `climbStep(rate, dt): number`
  - `countNear(self: { x; alt }, others: Presence[]): { real; echo }`

- [ ] **Step 1: Write the failing test `packages/core/test/lift.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { BASE_RATE, MAX_DT, SOLO_LOOP_SECONDS } from '../src/constants';
import { climbRate, climbStep, countNear, syncBoostAt, updraft } from '../src/lift';

describe('updraft', () => {
  it('adds 0.15 per flyer and 0.075 per echo', () => {
    expect(updraft(2, 0)).toBeCloseTo(0.3, 9);
    expect(updraft(0, 2)).toBeCloseTo(0.15, 9);
  });
  it('caps at 0.6', () => {
    expect(updraft(10, 10)).toBe(0.6);
  });
  it('ignores negative counts', () => {
    expect(updraft(-3, -1)).toBe(0);
  });
});

describe('syncBoostAt', () => {
  it('is 0.5 for 6 s after a sync, then 0', () => {
    expect(syncBoostAt(10, null)).toBe(0);
    expect(syncBoostAt(10, 5)).toBe(0.5);
    expect(syncBoostAt(11.5, 5)).toBe(0);
    expect(syncBoostAt(4, 5)).toBe(0);
  });
});

describe('climbRate', () => {
  it('completes a loop in ~540 s at steadiness 0.85 alone', () => {
    const r = climbRate({ steadiness: 0.85, updraft: 0, syncBoost: 0, flutter: false });
    expect(r * SOLO_LOOP_SECONDS).toBeCloseTo(1, 5);
  });
  it('is 0 while fluttering', () => {
    expect(climbRate({ steadiness: 1, updraft: 0.6, syncBoost: 0.5, flutter: true })).toBe(0);
  });
  it('multiplies updraft and sync boost', () => {
    const r = climbRate({ steadiness: 1, updraft: 0.6, syncBoost: 0.5, flutter: false });
    expect(r).toBeCloseTo(BASE_RATE * 1.6 * 1.5, 12);
  });
  it('is never negative or NaN', () => {
    expect(climbRate({ steadiness: Number.NaN, updraft: 0, syncBoost: 0, flutter: false })).toBe(0);
    expect(climbRate({ steadiness: -1, updraft: 0, syncBoost: 0, flutter: false })).toBe(0);
  });
});

describe('climbStep', () => {
  it('clamps huge frame times so a resumed tab cannot leap', () => {
    expect(climbStep(1, 5)).toBe(MAX_DT);
  });
  it('treats negative or NaN dt as 0', () => {
    expect(climbStep(1, -1)).toBe(0);
    expect(climbStep(1, Number.NaN)).toBe(0);
  });
});

describe('countNear', () => {
  it('counts real flyers and echoes within radius 0.25', () => {
    const near = countNear({ x: 0, alt: 0.5 }, [
      { x: 0.2, alt: 0.5, echo: false },
      { x: 0.3, alt: 0.5, echo: true },
      { x: 0, alt: 0.6, echo: true },
      { x: -0.9, alt: 0.1, echo: false },
    ]);
    expect(near).toEqual({ real: 1, echo: 1 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/core test`
Expected: FAIL with "Failed to resolve import ../src/lift".

- [ ] **Step 3: Implement `packages/core/src/lift.ts`**

```ts
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
```

Add `export * from './lift';` to `packages/core/src/index.ts`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/core test && pnpm --filter @sitl/core typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): lift, updraft, sync boost and proximity

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Next.js shell, device profile, store and live state

**Files:**
- Move: `index.html` → `legacy/v1.html`
- Create: `apps/web/package.json` (via pnpm), `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/vitest.config.ts`, `apps/web/next-env.d.ts`
- Create: `apps/web/app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/page.module.css`, `app/fly/page.tsx`, `app/fly/FlyClient.tsx`
- Create: `apps/web/src/lib/env.ts`, `src/lib/rng.ts`, `src/profile/profile.ts`, `src/profile/persist.ts`, `src/state/store.ts`, `src/flight/live.ts`, `src/flight/intention.ts`
- Test: `apps/web/test/profile.test.ts`, `apps/web/test/store.test.ts`, `apps/web/test/rng.test.ts`

**Interfaces:**
- Consumes: `@sitl/core` (`Fold`, `Kind`, `BandIndex`, `foldsForLoop`, `FOLDS`, `Presence`).
- Produces:
  - `src/lib/env.ts`: `safeLocalStorage(): StorageLike | null`, `prefersReducedMotion(): boolean`, `isCoarsePointer(): boolean`, `type StorageLike = Pick<Storage, 'getItem' | 'setItem'>`
  - `src/lib/rng.ts`: `createRng(seed: number): () => number`
  - `src/profile/profile.ts`:
    - `type Settings = { autoBreathe: boolean; reducedMotion: boolean | null; muted: boolean }`
    - `type Profile = { id: string; lifetimeAlt: number; loop: number; unlockedFolds: Fold[]; settings: Settings }`
    - `PROFILE_KEY`, `defaultProfile(id?)`, `parseProfile(raw: unknown): Profile | null`, `loadProfile(storage: StorageLike | null): Profile`, `saveProfile(storage: StorageLike | null, p: Profile): void`
  - `src/state/store.ts`: `useApp` (zustand) with state `{ id, phase: Phase, kind, fold, band, loop, savedAlt, unlockedFolds, settings, dawnAt }` and actions:
    - `hydrate(p: Profile)`
    - `release(kind, fold)`
    - `setFlying()`
    - `setBand(b)`
    - `newDawn(lifetimeAlt)`
    - `setSavedAlt(a)`
    - `updateSettings(partial)`
    - `type Phase = 'loading' | 'ritual' | 'launching' | 'flying'`
  - `src/flight/live.ts`: `live` (shape below)
  - `src/flight/intention.ts`: `setIntention(words)`, `getIntention()`
  - `src/profile/persist.ts`: `persistNow(): void`

- [ ] **Step 1: Move v1 and scaffold the web package**

```bash
mkdir -p legacy && git mv index.html legacy/v1.html 2>/dev/null || mv index.html legacy/v1.html
mkdir -p apps/web && cd apps/web
pnpm init
pnpm add next@16.4.0 react@19.3.0 react-dom@19.3.0 three@0.186.1 @react-three/fiber@9.8.1 @react-three/postprocessing@3.1.3 postprocessing@6.39.5 zustand@5.0.15 "@sitl/core@workspace:*"
pnpm add -D typescript@5.9.3 vitest@5.0.3 @types/three@0.186.0 @types/react@^19 @types/react-dom@^19 @types/node@^24
cd ../..
```

Then edit `apps/web/package.json` so that `name` and `scripts` read:
```json
  "name": "@sitl/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es2022"],
    "jsx": "preserve",
    "noEmit": true,
    "incremental": true,
    "allowJs": false,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/next.config.ts`:
```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sitl/core'],
};
export default config;
```

`apps/web/vitest.config.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'], environment: 'node' },
});
```

`apps/web/next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 2: Write the failing tests**

`apps/web/test/rng.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '@/lib/rng';

describe('createRng', () => {
  it('is deterministic per seed and in [0, 1)', () => {
    const a = createRng(7), b = createRng(7);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

`apps/web/test/profile.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PROFILE_KEY, defaultProfile, loadProfile, saveProfile, type Profile } from '@/profile/profile';
import type { StorageLike } from '@/lib/env';

function memStorage(init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}
const throwing: StorageLike = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('quota'); },
};

describe('loadProfile', () => {
  it('returns defaults with an id when storage is unavailable', () => {
    const p = loadProfile(null);
    expect(p.id).toMatch(/.{8,}/);
    expect(p).toMatchObject({ lifetimeAlt: 0, loop: 0, unlockedFolds: ['dart'] });
  });
  it('returns defaults when storage throws', () => {
    expect(() => loadProfile(throwing)).not.toThrow();
    expect(loadProfile(throwing).lifetimeAlt).toBe(0);
  });
  it('returns defaults for corrupt JSON', () => {
    expect(loadProfile(memStorage({ [PROFILE_KEY]: '{not json' })).lifetimeAlt).toBe(0);
  });
  it('sanitises invalid fields and derives loop and folds from altitude', () => {
    const raw = { id: 'abc12345', lifetimeAlt: 2.4, loop: 99, unlockedFolds: ['dart', 'bogus'], settings: { autoBreathe: 'yes', muted: true } };
    const p = loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify(raw) }));
    expect(p.id).toBe('abc12345');
    expect(p.loop).toBe(2);
    expect(p.unlockedFolds).toEqual(['dart', 'glider', 'crane']);
    expect(p.settings).toEqual({ autoBreathe: false, reducedMotion: null, muted: true });
  });
  it('rejects a negative or non-numeric altitude', () => {
    const p = loadProfile(memStorage({ [PROFILE_KEY]: JSON.stringify({ id: 'abc12345', lifetimeAlt: 'high' }) }));
    expect(p.lifetimeAlt).toBe(0);
  });
});

describe('saveProfile', () => {
  it('writes only whitelisted fields (never words)', () => {
    const s = memStorage();
    const p = { ...defaultProfile('abc12345'), lifetimeAlt: 1.5, loop: 1, words: 'secret' } as Profile & { words: string };
    saveProfile(s, p);
    const stored = JSON.parse(s.data[PROFILE_KEY]!);
    expect(Object.keys(stored).sort()).toEqual(['id', 'lifetimeAlt', 'loop', 'settings', 'unlockedFolds']);
    expect(JSON.stringify(stored)).not.toContain('secret');
  });
  it('does not throw when storage is full or missing', () => {
    expect(() => saveProfile(throwing, defaultProfile())).not.toThrow();
    expect(() => saveProfile(null, defaultProfile())).not.toThrow();
  });
});
```

`apps/web/test/store.test.ts`:
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '@/state/store';
import { defaultProfile } from '@/profile/profile';

describe('useApp', () => {
  beforeEach(() => useApp.getState().hydrate(defaultProfile('abc12345')));

  it('hydrates into the ritual phase', () => {
    const s = useApp.getState();
    expect(s.phase).toBe('ritual');
    expect(s.id).toBe('abc12345');
  });

  it('release → launching → flying', () => {
    useApp.getState().release('love', 'dart');
    expect(useApp.getState()).toMatchObject({ phase: 'launching', kind: 'love', fold: 'dart' });
    useApp.getState().setFlying();
    expect(useApp.getState().phase).toBe('flying');
  });

  it('newDawn moves to ritual, advances loop, unlocks folds and stamps dawnAt', () => {
    const before = useApp.getState().dawnAt;
    useApp.getState().newDawn(1.01);
    const s = useApp.getState();
    expect(s.phase).toBe('ritual');
    expect(s.loop).toBe(1);
    expect(s.savedAlt).toBeCloseTo(1.01);
    expect(s.unlockedFolds).toEqual(['dart', 'glider']);
    expect(s.dawnAt).toBeGreaterThan(before);
  });

  it('never lowers savedAlt', () => {
    useApp.getState().setSavedAlt(0.5);
    useApp.getState().setSavedAlt(0.2);
    expect(useApp.getState().savedAlt).toBe(0.5);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved imports `@/lib/rng`, `@/profile/profile` and `@/state/store`.

- [ ] **Step 4: Implement the modules**

`apps/web/src/lib/env.ts`:
```ts
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function safeLocalStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isCoarsePointer(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}
```

`apps/web/src/lib/rng.ts`:
```ts
/** mulberry32: small, fast, deterministic. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`apps/web/src/profile/profile.ts`:
```ts
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
```

`apps/web/src/state/store.ts`:
```ts
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
```

`apps/web/src/flight/live.ts`:
```ts
import * as THREE from 'three';
import type { BandIndex, Presence } from '@sitl/core';

/** Mutable per-frame state. Read and written inside useFrame only; never drives React renders. */
export const live = {
  time: 0,
  lifetimeAlt: 0,
  loop: 0,
  loopAlt: 0,
  band: 0 as BandIndex,
  bandProgress: 0,
  steadiness: 0.3,
  inhaling: false,
  flutter: false,
  inhaleStartedAt: null as number | null,
  guideVisible: false,
  /** Raw pointer in NDC, eased fast (pointer) and slow (pointerSlow) by CameraRig. */
  pointerRaw: new THREE.Vector2(0, 0.1),
  pointer: new THREE.Vector2(0, 0.1),
  pointerSlow: new THREE.Vector2(0, 0.1),
  camera: { x: 0, y: 0, z: 0 },
  plane: new THREE.Vector3(),
  near: { real: 0, echo: 0 },
  /** Other planes in normalized space. EchoPlanes writes echoes; Plan 2 adds real flyers. */
  others: [] as Presence[],
  lastSyncAt: null as number | null,
};
```

`apps/web/src/flight/intention.ts`:
```ts
// The intention text lives only here, in memory, for the current session.
// It is never written to storage, the store, or the network.
let words = '';
export const setIntention = (w: string) => { words = w.slice(0, 80); };
export const getIntention = () => words;
```

`apps/web/src/profile/persist.ts`:
```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS (rng, profile, store).

- [ ] **Step 6: Create the app routes**

`apps/web/app/globals.css`:
```css
:root {
  --glass: rgba(255, 255, 255, 0.16);
  --glass-border: rgba(255, 255, 255, 0.34);
  --ink: rgba(255, 255, 255, 0.92);
  --ink-dim: rgba(255, 255, 255, 0.62);
  --active-bg: rgba(255, 255, 255, 0.92);
  --active-ink: #1d2433;
  --night: #0b1020;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: var(--night); color: var(--ink); }
body { font-family: var(--font-sans), system-ui, sans-serif; -webkit-font-smoothing: antialiased; overflow: hidden; }
button { font: inherit; color: inherit; }
```

`apps/web/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import './globals.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Sky is the limit',
  description: 'Fold what you carry into a paper plane and rise with strangers. There is no top.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0b1020' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

`apps/web/app/page.module.css`:
```css
.main {
  min-height: 100dvh; display: grid; place-content: center; gap: 22px; text-align: center; padding: 16px;
  background: radial-gradient(120% 90% at 50% 100%, #ffc7a3 0%, #c398c4 38%, #34488a 75%, #0b1020 100%);
}
.title { font: italic 400 clamp(56px, 11vw, 168px)/0.92 var(--font-serif), serif; letter-spacing: -0.02em; text-shadow: 0 0 60px rgba(255,255,255,.45); }
.lede { max-width: 34ch; margin: 0 auto; font-size: 15px; line-height: 1.6; color: var(--ink-dim); }
.begin {
  justify-self: center; padding: 12px 28px; border-radius: 999px; text-decoration: none; color: var(--active-ink);
  background: var(--active-bg); font: 500 13px/1 var(--font-sans); letter-spacing: .24em; text-transform: uppercase;
  box-shadow: 0 8px 30px rgba(0,0,0,.15);
}
```

`apps/web/app/page.tsx`:
```tsx
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Sky is the limit</h1>
      <p className={styles.lede}>Fold what you carry into a paper plane. Breathe it upward with strangers. There is no top — only higher.</p>
      <Link href="/fly" className={styles.begin}>Begin</Link>
    </main>
  );
}
```

`apps/web/app/fly/page.tsx`:
```tsx
import type { Metadata } from 'next';
import FlyClient from './FlyClient';

export const metadata: Metadata = { title: 'Fly · Sky is the limit' };

export default function FlyPage() {
  return <FlyClient />;
}
```

`apps/web/app/fly/FlyClient.tsx` (temporary placeholder; Task 5 replaces the dynamic target):
```tsx
'use client';
export default function FlyClient() {
  return <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center' }}>Preparing the sky…</div>;
}
```

- [ ] **Step 7: Verify the build**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web build`
Expected: both exit 0, and the build lists routes `/` and `/fly`.

- [ ] **Step 8: Commit**

```bash
git add -A legacy apps/web pnpm-lock.yaml
git commit -m "feat(web): Next.js shell, device profile, store and live state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: World foundation (palette, sky, cloud sea, camera, post-processing)

**Files:**
- Create: `src/world/palette.ts`, `src/world/livePalette.ts`, `src/world/altitudeRig.ts`, `src/world/shaders/noise.ts`
- Create: `src/world/clouds/cloudField.ts`, `src/world/clouds/cloudMaterial.ts`, `src/world/clouds/CloudSea.tsx`
- Create: `src/world/sky/SkyDome.tsx`, `src/world/CameraRig.tsx`, `src/world/PaletteDriver.tsx`, `src/world/Lights.tsx`, `src/world/Effects.tsx`, `src/world/AdaptiveQuality.tsx`, `src/world/Experience.tsx`, `src/flight/altitude.ts`
- Modify: `app/fly/FlyClient.tsx`
- Test: `test/palette.test.ts`, `test/altitudeRig.test.ts`, `test/cloudField.test.ts`

(All paths in Tasks 5–11 are relative to `apps/web/` unless stated otherwise.)

**Interfaces:**
- Consumes: `live`, `useApp`, `loadProfile`, `safeLocalStorage`, `isCoarsePointer`, `prefersReducedMotion`, `createRng`, and from core: `bandIndexAt`, `bandProgress`, `splitAltitude`, `MAX_DT`.
- Produces:
  - `palette.ts`: `type RGB`, `interface Palette { top, mid, horizon, sun, lit, shadow, fog: RGB; stars, aurora, sunEl, sunAz, fogNear, fogFar: number }`, `PRESETS: Palette[]` (length 5), `paletteAt(loopAlt): Palette`
  - `livePalette.ts`: `livePalette` (THREE.Color fields `top mid horizon sun lit shadow fog below cirrus tint`, `sunDir: Vector3`, numbers `stars aurora fogNear fogFar`), `applyPalette(p: Palette, loop: number): void`
  - `altitudeRig.ts`: `cameraBaseY(loopAlt): number`, `CLOUD_DECK = { bottom: -11, top: 30 }`
  - `cloudField.ts`: `W`, `L`, `AHEAD`, `wrap(v, m)`, `interface Puff`, `generatePuffs(density, rand)`, `wrapPuff(p, camX, camZ)`, `createSortWork(n)`, `writeSortedPuffs(puffs, work, pos, data, camX, camZ)`
  - `cloudMaterial.ts`: `createCloudMaterial(): THREE.ShaderMaterial`, `updateCloudUniforms(mat, camera, t): void`
  - `shaders/noise.ts`: `NOISE` (GLSL string with `hash`, `noise`, `fbm`, `fbm3`)
  - `flight/altitude.ts`: `setLiveAltitude(a: number): void`
  - `Experience.tsx`: default export `Experience`, which later tasks extend.

- [ ] **Step 1: Write the failing tests**

`test/palette.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { PRESETS, paletteAt } from '@/world/palette';

describe('paletteAt', () => {
  it('returns the band preset in the middle of a band', () => {
    expect(paletteAt(0.05)).toEqual(PRESETS[0]);
    expect(paletteAt(0.45)).toEqual(PRESETS[2]);
    expect(paletteAt(0.9)).toEqual(PRESETS[4]);
  });
  it('is continuous across band boundaries', () => {
    for (const edge of [0.12, 0.32, 0.58, 0.82]) {
      const a = paletteAt(edge - 1e-4), b = paletteAt(edge + 1e-4);
      for (let i = 0; i < 3; i++) expect(Math.abs(a.top[i]! - b.top[i]!)).toBeLessThan(0.02);
      expect(Math.abs(a.fogFar - b.fogFar)).toBeLessThan(5);
    }
  });
  it('handles junk input', () => {
    expect(paletteAt(Number.NaN)).toEqual(PRESETS[0]);
  });
});
```

`test/altitudeRig.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CLOUD_DECK, cameraBaseY } from '@/world/altitudeRig';

describe('cameraBaseY', () => {
  it('rises monotonically through a loop', () => {
    let prev = -Infinity;
    for (let a = 0; a <= 1; a += 0.01) {
      const y = cameraBaseY(a);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });
  it('is below the cloud deck on the Ground and above it from Above the Clouds', () => {
    expect(cameraBaseY(0.05)).toBeLessThan(CLOUD_DECK.bottom);
    expect(cameraBaseY(0.33)).toBeGreaterThan(10);
    expect(cameraBaseY(0.2)).toBeGreaterThan(CLOUD_DECK.bottom - 15);
  });
});
```

`test/cloudField.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { AHEAD, L, createSortWork, generatePuffs, wrapPuff, writeSortedPuffs } from '@/world/clouds/cloudField';
import { createRng } from '@/lib/rng';

describe('cloudField', () => {
  it('keeps a puff stationary in world space as the camera moves (between wraps)', () => {
    const p = { x: 10, y: 0, z: -100, s: 20, seed: 0.5 };
    const a = wrapPuff(p, 0, 0), b = wrapPuff(p, 0, -20);
    expect(b.z).toBeCloseTo(a.z, 6); // world z is p.z shifted by a constant; it must not move
    expect(b.x).toBeCloseTo(a.x, 6);
  });
  it('wraps a puff to the far distance once it is AHEAD units behind the camera', () => {
    const p = { x: 0, y: 0, z: -100, s: 20, seed: 0.5 };
    // At camZ = 0 the puff sits at world z = -70; it wraps when the camera passes z = -100.
    expect(wrapPuff(p, 0, -99).rel).toBeLessThan(AHEAD);
    const wrapped = wrapPuff(p, 0, -101);
    expect(wrapped.rel).toBeGreaterThan(L - 5);
    expect(wrapped.z).toBeLessThan(-101 - L + AHEAD + 5);
  });
  it('writes instances sorted far → near and fades puffs behind the camera', () => {
    const puffs = generatePuffs(0.2, createRng(1));
    const work = createSortWork(puffs.length);
    const pos = new Float32Array(puffs.length * 3), data = new Float32Array(puffs.length * 4);
    writeSortedPuffs(puffs, work, pos, data, 0, -333);
    for (let j = 1; j < puffs.length; j++) expect(pos[j * 3 + 2]!).toBeGreaterThanOrEqual(pos[(j - 1) * 3 + 2]! - 1e-3);
    for (let j = 0; j < puffs.length; j++) if (pos[j * 3 + 2]! > -333) expect(data[j * 4 + 2]).toBe(0);
  });
  it('scales count by density', () => {
    expect(generatePuffs(0.5, createRng(1)).length).toBeLessThan(generatePuffs(1, createRng(1)).length * 0.6);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/world/palette`, `@/world/altitudeRig` and `@/world/clouds/cloudField`.

- [ ] **Step 3: Implement the pure modules**

`src/world/palette.ts`:
```ts
import { BANDS, bandIndexAt, bandProgress } from '@sitl/core';

export type RGB = readonly [number, number, number];
export interface Palette {
  top: RGB; mid: RGB; horizon: RGB; sun: RGB; lit: RGB; shadow: RGB; fog: RGB;
  stars: number; aurora: number; sunEl: number; sunAz: number; fogNear: number; fogFar: number;
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const preset = (c: Record<'top' | 'mid' | 'horizon' | 'sun' | 'lit' | 'shadow' | 'fog', string>, n: Omit<Palette, 'top' | 'mid' | 'horizon' | 'sun' | 'lit' | 'shadow' | 'fog'>): Palette => ({
  top: hex(c.top), mid: hex(c.mid), horizon: hex(c.horizon), sun: hex(c.sun), lit: hex(c.lit), shadow: hex(c.shadow), fog: hex(c.fog), ...n,
});

/** One preset per band: Ground, Fog, Above the Clouds, Quiet, Stars. */
export const PRESETS: Palette[] = [
  preset({ top: '#1d2233', mid: '#3a3f55', horizon: '#6b6a7a', sun: '#ffb07a', lit: '#8d8aa0', shadow: '#2a2c3d', fog: '#4a4b5e' },
    { stars: 0, aurora: 0, sunEl: 2, sunAz: -10, fogNear: 20, fogFar: 380 }),
  preset({ top: '#8c93a8', mid: '#a7adbd', horizon: '#c3c6cf', sun: '#ffe2c4', lit: '#e3e3ea', shadow: '#8f93a5', fog: '#b9bcc8' },
    { stars: 0, aurora: 0, sunEl: 10, sunAz: -14, fogNear: 5, fogFar: 120 }),
  preset({ top: '#34488a', mid: '#c398c4', horizon: '#ffc7a3', sun: '#ffcf9e', lit: '#ffe3cf', shadow: '#8679a6', fog: '#f0c1b6' },
    { stars: 0.1, aurora: 0, sunEl: 6, sunAz: -18, fogNear: 120, fogFar: 720 }),
  preset({ top: '#0f2a6b', mid: '#2f5fb0', horizon: '#9cc3ee', sun: '#fff1dc', lit: '#eef4ff', shadow: '#6d87b8', fog: '#8fb2e0' },
    { stars: 0.05, aurora: 0, sunEl: 22, sunAz: 12, fogNear: 150, fogFar: 800 }),
  preset({ top: '#02050f', mid: '#081433', horizon: '#1b2c58', sun: '#c9d8ff', lit: '#5d73a8', shadow: '#0b1430', fog: '#121d40' },
    { stars: 1, aurora: 1, sunEl: 20, sunAz: 22, fogNear: 150, fogFar: 760 }),
];

const COLOR_KEYS = ['top', 'mid', 'horizon', 'sun', 'lit', 'shadow', 'fog'] as const;
const NUM_KEYS = ['stars', 'aurora', 'sunEl', 'sunAz', 'fogNear', 'fogFar'] as const;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Holds each band's preset, cross-fading into the next band over the last 25% of the band. */
export function paletteAt(loopAlt: number): Palette {
  const a = Number.isFinite(loopAlt) ? Math.min(1, Math.max(0, loopAlt)) : 0;
  const i = bandIndexAt(a);
  const from = PRESETS[i]!;
  if (i === BANDS.length - 1) return from;
  const p = bandProgress(a);
  const x = Math.min(1, Math.max(0, (p - 0.75) / 0.25));
  const t = x * x * (3 - 2 * x);
  if (t === 0) return from;
  const to = PRESETS[i + 1]!;
  const out = { ...from } as { -readonly [K in keyof Palette]: Palette[K] };
  for (const k of COLOR_KEYS) out[k] = mixRGB(from[k], to[k], t);
  for (const k of NUM_KEYS) out[k] = from[k] + (to[k] - from[k]) * t;
  return out;
}
```

`src/world/altitudeRig.ts`:
```ts
/** The cloud deck occupies this world-Y range; the camera rises through it in The Fog. */
export const CLOUD_DECK = { bottom: -11, top: 30 } as const;

const KEYS: readonly [number, number][] = [[0, -70], [0.12, -24], [0.32, 14], [0.58, 28], [0.82, 44], [1, 58]];

export function cameraBaseY(loopAlt: number): number {
  const a = Number.isFinite(loopAlt) ? Math.min(1, Math.max(0, loopAlt)) : 0;
  for (let i = 1; i < KEYS.length; i++) {
    const [a1, y1] = KEYS[i]!;
    if (a <= a1) {
      const [a0, y0] = KEYS[i - 1]!;
      const t = (a - a0) / (a1 - a0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return KEYS[KEYS.length - 1]![1];
}
```

`src/world/clouds/cloudField.ts`:
```ts
export const W = 640;
export const L = 760;
export const AHEAD = 30;

export const wrap = (v: number, m: number) => ((v % m) + m) % m;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

export interface Puff { x: number; y: number; z: number; s: number; seed: number }

/** Cumulus clusters (some tall towers) over a flat floor of large puffs. Ported from v1. */
export function generatePuffs(density: number, rand: () => number): Puff[] {
  const puffs: Puff[] = [];
  const clusters = Math.round(240 * density);
  for (let c = 0; c < clusters; c++) {
    const cx = rand() * W - W / 2, cz = rand() * L;
    const tall = rand() < 0.2 ? 14 + rand() * 18 : 3 + rand() * 7;
    const base = -2 + rand() * 3;
    const n = 6 + Math.floor(rand() * 6);
    for (let k = 0; k < n; k++) {
      const t = rand(), spread = (1 - t * 0.6) * (10 + rand() * 8);
      puffs.push({ x: cx + (rand() - 0.5) * spread * 2, y: base + t * tall, z: cz + (rand() - 0.5) * spread * 1.6, s: (1 - t * 0.45) * (12 + rand() * 13), seed: rand() });
    }
  }
  const floor = Math.round(720 * density);
  for (let k = 0; k < floor; k++) puffs.push({ x: rand() * W - W / 2, y: -9 + rand() * 4, z: rand() * L, s: 26 + rand() * 22, seed: rand() });
  return puffs;
}

/** World position of a puff on the endless torus sliding past the camera. `rel` grows with distance ahead. */
export function wrapPuff(p: Puff, camX: number, camZ: number) {
  const rel = wrap(camZ - p.z, L);
  return { rel, x: camX + wrap(p.x - camX + W / 2, W) - W / 2, z: camZ + AHEAD - rel };
}

export function createSortWork(n: number) {
  return { rel: new Float32Array(n), wx: new Float32Array(n), order: Uint32Array.from({ length: n }, (_, i) => i) };
}

/** Writes aPos (xyz) and aData (scale, seed, fade, height01) sorted far → near for correct alpha blending. */
export function writeSortedPuffs(
  puffs: Puff[], work: ReturnType<typeof createSortWork>, pos: Float32Array, data: Float32Array, camX: number, camZ: number,
): void {
  const n = puffs.length;
  for (let i = 0; i < n; i++) {
    const w = wrapPuff(puffs[i]!, camX, camZ);
    work.rel[i] = w.rel;
    work.wx[i] = w.x;
  }
  work.order.sort((a, b) => work.rel[b]! - work.rel[a]!);
  for (let j = 0; j < n; j++) {
    const i = work.order[j]!, p = puffs[i]!, rel = work.rel[i]!, ahead = rel - AHEAD;
    const edge = 1 - smoothstep(W / 2 - 90, W / 2, Math.abs(work.wx[i]! - camX));
    const fade = smoothstep(3, 22, ahead) * smoothstep(0, 140, L - rel) * edge;
    pos[j * 3] = work.wx[i]!; pos[j * 3 + 1] = p.y; pos[j * 3 + 2] = camZ + AHEAD - rel;
    data[j * 4] = p.s; data[j * 4 + 1] = p.seed; data[j * 4 + 2] = fade; data[j * 4 + 3] = Math.min(1, Math.max(0, (p.y + 9) / 30));
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement the rendering modules**

`src/world/shaders/noise.ts`:
```ts
export const NOISE = /* glsl */ `
  float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.03+17.1; a*=.5; } return v; }
  float fbm3(vec2 p){ float v=0., a=.5; for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.07+11.3; a*=.5; } return v; }
`;
```

`src/world/livePalette.ts`:
```ts
import * as THREE from 'three';
import type { Palette } from './palette';

const WHITE = new THREE.Color(1, 1, 1);

/** THREE mirror of the current palette. Shader uniforms hold references to these objects. */
export const livePalette = {
  top: new THREE.Color(), mid: new THREE.Color(), horizon: new THREE.Color(), sun: new THREE.Color(),
  lit: new THREE.Color(), shadow: new THREE.Color(), fog: new THREE.Color(),
  below: new THREE.Color(), cirrus: new THREE.Color(), tint: new THREE.Color(),
  sunDir: new THREE.Vector3(0, 0.2, -1).normalize(),
  stars: 0, aurora: 0, fogNear: 120, fogFar: 700,
};

export function applyPalette(p: Palette, loop: number): void {
  const lp = livePalette;
  for (const k of ['top', 'mid', 'horizon', 'sun', 'lit', 'shadow', 'fog'] as const) lp[k].setRGB(p[k][0], p[k][1], p[k][2], THREE.SRGBColorSpace);
  const el = THREE.MathUtils.degToRad(p.sunEl), az = THREE.MathUtils.degToRad(p.sunAz);
  lp.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  lp.below.copy(lp.shadow).lerp(lp.fog, 0.5);
  lp.cirrus.copy(lp.lit).lerp(lp.sun, 0.35);
  lp.tint.copy(lp.lit).lerp(WHITE, 0.55);
  lp.stars = p.stars;
  lp.aurora = Math.max(p.aurora, loop >= 4 ? 0.25 : 0);
  lp.fogNear = p.fogNear;
  lp.fogFar = p.fogFar;
}
```

`src/flight/altitude.ts`:
```ts
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
```

`src/world/PaletteDriver.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { live } from '@/flight/live';
import { applyPalette } from './livePalette';
import { paletteAt } from './palette';

export function PaletteDriver() {
  useFrame(() => applyPalette(paletteAt(live.loopAlt), live.loop), -1);
  return null;
}
```

`src/world/CameraRig.tsx`:
```tsx
'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MAX_DT } from '@sitl/core';
import { live } from '@/flight/live';
import { prefersReducedMotion } from '@/lib/env';
import { useApp } from '@/state/store';
import { cameraBaseY } from './altitudeRig';

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const st = useRef({ x: 0, y: cameraBaseY(0), z: 0, roll: 0, fov: 62, speed: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const t = state.clock.elapsedTime;
    const s = st.current;
    const app = useApp.getState();
    const reduced = app.settings.reducedMotion ?? prefersReducedMotion();
    const ritual = app.phase === 'ritual' || app.phase === 'loading';
    const k = (rate: number) => 1 - Math.exp(-rate * dt);

    live.pointer.lerp(live.pointerRaw, k(8));
    live.pointerSlow.lerp(live.pointerRaw, k(1.6));

    const targetSpeed = ritual ? 0 : live.inhaling ? 46 : 38;
    s.speed += (targetSpeed - s.speed) * k(1);
    s.z -= s.speed * dt;
    const px = s.x;
    s.x += (live.pointerSlow.x * (ritual ? 6 : 34) - s.x) * k(1.2);
    const targetY = cameraBaseY(live.loopAlt) + live.pointerSlow.y * (ritual ? 2 : 7) + (live.inhaling ? 2 : 0);
    // Snap on a new-dawn jump (hidden behind the dawn flash); ease otherwise.
    s.y = Math.abs(targetY - s.y) > 40 ? targetY : s.y + (targetY - s.y) * k(1.4);
    const vx = (s.x - px) / Math.max(dt, 1e-3);
    s.roll += ((reduced ? 0 : -vx * 0.012) - s.roll) * k(3);

    camera.position.set(s.x, s.y + (reduced ? 0 : Math.sin(t * 1.3) * 0.15), s.z);
    look.set(s.x + live.pointerSlow.x * 6, s.y + 1.5 + live.pointerSlow.y * 2, s.z - 60);
    camera.lookAt(look);
    camera.rotateZ(s.roll);
    s.fov += ((live.inhaling ? 66 : 62) - s.fov) * k(2);
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    live.camera.x = s.x; live.camera.y = s.y; live.camera.z = s.z;
  }, -1);
  return null;
}
```

`src/world/sky/SkyDome.tsx` (shader ported verbatim from `legacy/v1.html`):
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

export function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: lp.top }, uMid: { value: lp.mid }, uHorizon: { value: lp.horizon }, uSunCol: { value: lp.sun },
      uBelow: { value: lp.below }, uCirrus: { value: lp.cirrus }, uSunDir: { value: lp.sunDir },
      uStars: { value: 0 }, uAurora: { value: 0 }, uTime: { value: 0 }, uCamZ: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform vec3 uTop,uMid,uHorizon,uSunCol,uBelow,uCirrus,uSunDir; uniform float uStars,uAurora,uTime,uCamZ;
      varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.28, h));
        col = mix(col, uTop, smoothstep(0.22, 0.9, h));
        float s = max(dot(d, uSunDir), 0.0);
        col += uSunCol * (pow(s,5.)*.22*(1.-uStars*.7) + pow(s,60.)*.55 + pow(s,2.)*(1.-smoothstep(0.,.3,abs(h)))*.2*(1.-uStars*.8));
        if (h > 0.0) {
          vec2 cp = d.xz/(h+0.06)*0.55 + vec2(0., uCamZ*0.0007);
          float ci = fbm(cp*vec2(.55,2.4) + vec2(uTime*.006, 0.));
          ci = smoothstep(.55,.88,ci) * smoothstep(.02,.22,h) * smoothstep(.95,.35,h);
          col = mix(col, uCirrus + uSunCol*pow(s,4.)*.6, ci*.55);
        }
        vec2 sp = vec2(atan(d.z,d.x), asin(clamp(h,-1.,1.))) * 130.;
        vec2 cell = floor(sp), f = fract(sp) - .5;
        float hs = hash(cell);
        vec2 off = vec2(hash(cell+3.1), hash(cell+7.7)) - .5;
        float star = smoothstep(.13, 0., length(f - off*.6)) * step(.935, hs);
        star *= .55 + .45*sin(uTime*(1.5+hs*5.) + hs*40.);
        col += vec3(.9,.95,1.) * star * uStars * smoothstep(.02,.25,h) * 1.8;
        if (uAurora > 0.001) {
          float az = atan(d.x, -d.z); vec3 aur = vec3(0);
          for (int i=0;i<3;i++){ float fi = float(i);
            float wave = noise(vec2(az*2.4 + fi*3.1 + uTime*.05, uTime*.03 + fi));
            float c = .17 + fi*.075 + (wave-.5)*.2;
            float band = exp(-pow((h-c)*16.,2.)) + exp(-max(h-c,0.)*15.)*smoothstep(c-.015,c,h)*.45;
            float streak = .45 + .55*noise(vec2(az*70. + uTime*.4, fi*5.));
            aur += mix(vec3(.12,1.,.62), vec3(.62,.3,1.), fi*.5) * band * streak * streak * .32;
          }
          col += aur * uAurora * smoothstep(0.,.08,h);
        }
        col += uSunCol * smoothstep(.99935, .99965, s) * 7.;
        col = mix(col, uBelow, smoothstep(0.0, -0.12, h));
        gl_FragColor = vec4(col, 1.);
      }`,
  }), []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamZ!.value = live.camera.z;
    u.uStars!.value = lp.stars;
    u.uAurora!.value = lp.aurora;
    mesh.current?.position.copy(state.camera.position);
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1500, 48, 32]} />
    </mesh>
  );
}
```

`src/world/clouds/cloudMaterial.ts` (v1 cloud shader, including the radial-falloff fix):
```ts
import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

/** Instanced billboard puffs. Attributes: aPos (vec3), aData (scale, seed, fade, height01). */
export function createCloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uPart: { value: 0.85 },
      uLit: { value: lp.lit }, uShadow: { value: lp.shadow }, uSunCol: { value: lp.sun }, uFog: { value: lp.fog },
      uSunScr: { value: new THREE.Vector2(0, 1) }, uRim: { value: 0.6 }, uFogNear: { value: 120 }, uFogFar: { value: 700 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aPos; attribute vec4 aData;
      uniform vec2 uPointer; uniform float uAspect, uPart, uFogNear, uFogFar;
      varying vec2 vUv; varying float vSeed, vFade, vFog, vH;
      void main(){
        vec4 mvC = viewMatrix * vec4(aPos, 1.);
        vec4 cc = projectionMatrix * mvC;
        vec2 dd = cc.xy/cc.w - uPointer; dd.x *= uAspect;
        float l = length(dd);
        float push = uPart * exp(-l*l/.055) * smoothstep(280., 12., -mvC.z);
        vec4 mv = mvC; mv.xy += position.xy * aData.x * (1. - .45*push);
        vec4 clip = projectionMatrix * mv;
        vec2 dir = l > 1e-4 ? dd/l : vec2(0.,1.); dir.x /= uAspect;
        clip.xy += dir * push * .3 * clip.w;
        gl_Position = clip;
        vUv = position.xy * 2.; vSeed = aData.y; vFade = aData.z; vH = aData.w;
        vFog = smoothstep(uFogNear, uFogFar, -mvC.z);
      }`,
    fragmentShader: NOISE + /* glsl */ `
      uniform float uTime, uRim; uniform vec3 uLit, uShadow, uSunCol, uFog; uniform vec2 uSunScr;
      varying vec2 vUv; varying float vSeed, vFade, vFog, vH;
      void main(){
        float n = fbm3(vUv*1.25 + vSeed*31.7 + vec2(uTime*.02, -uTime*.012));
        float d = 1. - length(vUv) + (n - .5);
        float a = smoothstep(.02, .5, d) * smoothstep(1., .72, length(vUv)) * vFade;
        if (a < .004) discard;
        float sa = dot(vUv, uSunScr);
        float light = clamp(.5 + vUv.y*.32 + sa*.22 + (n-.5)*.55, 0., 1.) * mix(.6, 1., vH);
        vec3 col = mix(uShadow, uLit, light);
        col += uSunCol * (1. - smoothstep(.02, .3, d)) * max(sa, 0.) * uRim;
        col = mix(col, uFog, vFog);
        gl_FragColor = vec4(col, a*.92);
      }`,
  });
}

const sv = new THREE.Vector3();
export function updateCloudUniforms(mat: THREE.ShaderMaterial, camera: THREE.PerspectiveCamera, t: number): void {
  const u = mat.uniforms;
  u.uTime!.value = t;
  u.uAspect!.value = camera.aspect;
  (u.uPointer!.value as THREE.Vector2).copy(live.pointer);
  u.uPart!.value += ((live.inhaling ? 1.15 : 0.85) - u.uPart!.value) * 0.05;
  sv.copy(lp.sunDir).transformDirection(camera.matrixWorldInverse);
  (u.uSunScr!.value as THREE.Vector2).set(sv.x, sv.y).normalize();
  u.uRim!.value = (0.35 + 0.65 * Math.max(-sv.z, 0)) * (1 - lp.stars * 0.5);
  u.uFogNear!.value = lp.fogNear;
  u.uFogFar!.value = lp.fogFar;
}
```

`src/world/clouds/CloudSea.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { isCoarsePointer } from '@/lib/env';
import { createRng } from '@/lib/rng';
import { createCloudMaterial, updateCloudUniforms } from './cloudMaterial';
import { createSortWork, generatePuffs, writeSortedPuffs } from './cloudField';

export function CloudSea() {
  const { puffs, geometry, aPos, aData, work } = useMemo(() => {
    const puffs = generatePuffs(isCoarsePointer() ? 0.5 : 1, createRng(1));
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.copy(new THREE.PlaneGeometry(1, 1) as unknown as THREE.InstancedBufferGeometry);
    geometry.instanceCount = puffs.length;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const aData = new THREE.InstancedBufferAttribute(new Float32Array(puffs.length * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    geometry.setAttribute('aData', aData);
    return { puffs, geometry, aPos, aData, work: createSortWork(puffs.length) };
  }, []);
  const material = useMemo(() => createCloudMaterial(), []);

  useFrame((state) => {
    updateCloudUniforms(material, state.camera as THREE.PerspectiveCamera, state.clock.elapsedTime);
    writeSortedPuffs(puffs, work, aPos.array as Float32Array, aData.array as Float32Array, live.camera.x, live.camera.z);
    aPos.needsUpdate = true;
    aData.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
```

`src/world/Lights.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { livePalette as lp } from './livePalette';

export function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    if (sun.current) {
      sun.current.color.copy(lp.sun);
      sun.current.position.copy(live.plane).addScaledVector(lp.sunDir, 50);
      sun.current.target.position.copy(live.plane);
      sun.current.target.updateMatrixWorld();
    }
    if (hemi.current) {
      hemi.current.color.copy(lp.mid);
      hemi.current.groundColor.copy(lp.lit).multiplyScalar(0.7);
    }
  });
  return (
    <>
      <directionalLight ref={sun} intensity={2.4} />
      <hemisphereLight ref={hemi} intensity={1.1} />
    </>
  );
}
```

`src/world/Effects.tsx`:
```tsx
'use client';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.3} darkness={0.45} />
    </EffectComposer>
  );
}
```

`src/world/AdaptiveQuality.tsx`:
```tsx
'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

/** Steps the pixel ratio down (to a 0.75 floor) while the average frame time exceeds 1/40 s. */
export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio, 1.5) });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt; a.n++;
    if (a.t < 2.5) return;
    const avg = a.t / a.n;
    a.t = 0; a.n = 0;
    if (avg > 1 / 40 && a.dpr > 0.75 && !document.hidden) {
      a.dpr = Math.max(0.75, a.dpr - 0.25);
      setDpr(a.dpr);
    }
  });
  return null;
}
```

`src/world/Experience.tsx`:
```tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { setLiveAltitude } from '@/flight/altitude';
import { safeLocalStorage } from '@/lib/env';
import { loadProfile } from '@/profile/profile';
import { useApp } from '@/state/store';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
import { CloudSea } from './clouds/CloudSea';
import { Effects } from './Effects';
import { Lights } from './Lights';
import { PaletteDriver } from './PaletteDriver';
import { SkyDome } from './sky/SkyDome';

/** Dev-only: /fly?alt=2.45 starts at that lifetime altitude. */
function devAltitude(): number | null {
  if (process.env.NODE_ENV === 'production') return null;
  const v = Number(new URLSearchParams(window.location.search).get('alt'));
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export default function Experience() {
  useEffect(() => {
    const p = loadProfile(safeLocalStorage());
    const dev = devAltitude();
    if (dev !== null) { p.lifetimeAlt = dev; p.loop = Math.floor(dev); }
    useApp.getState().hydrate(p);
    setLiveAltitude(dev ?? Math.floor(p.lifetimeAlt));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas
        dpr={[0.75, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.1, far: 3000 }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping; }}
        style={{ touchAction: 'none' }}
      >
        <PaletteDriver />
        <CameraRig />
        <Lights />
        <SkyDome />
        <CloudSea />
        <AdaptiveQuality />
        <Effects />
      </Canvas>
    </div>
  );
}
```

Replace `app/fly/FlyClient.tsx`:
```tsx
'use client';
import dynamic from 'next/dynamic';

const Experience = dynamic(() => import('@/world/Experience'), {
  ssr: false,
  loading: () => <div style={{ position: 'fixed', inset: 0, background: '#0b1020' }} />,
});

export default function FlyClient() {
  return <Experience />;
}
```

- [ ] **Step 6: Typecheck, test and look at it**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Run `pnpm dev` and open `http://localhost:3000/fly?alt=0.45`. Expected: the golden cloud sea from v1 with the sun at the horizon. The camera is still, because the phase is `ritual` and the speed is 0. Also open `?alt=0.05` (dark, overcast deck overhead), `?alt=0.2` (inside grey fog), `?alt=0.7` (deep-blue clear air) and `?alt=0.9` (night, stars, aurora). The browser console must show no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): band palettes, sky dome, cloud sea, camera rig and post-processing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Flight (input, guide, flight loop, folds, player plane, rooftop)

**Files:**
- Create: `src/flight/breathInput.ts`, `src/flight/attachInput.ts`, `src/flight/guide.ts`, `src/flight/FlightSystem.tsx`
- Create: `src/world/planes/foldGeometry.ts`, `src/world/planes/glowTexture.ts`, `src/world/planes/PlayerPlane.tsx`, `src/world/planes/BreathRing.tsx`, `src/world/ground/Rooftop.tsx`
- Modify: `src/world/Experience.tsx`
- Test: `test/breathInput.test.ts`, `test/guide.test.ts`, `test/foldGeometry.test.ts`

**Interfaces:**
- Consumes: from core: `BreathTracker`, `advanceAltitude`, `climbRate`, `climbStep`, `countNear`, `updraft`, `syncBoostAt`, `MAX_DT`, `KINDS`. Also `live`, `useApp`, `setLiveAltitude`, `persistNow`.
- Produces:
  - `breathInput.ts`: `class BreathInput { held: boolean; pointerDown(id); pointerUp(id); pointerCancel(id); keyDown(code); keyUp(code); blur() }`
  - `attachInput.ts`: `attachInput(el: HTMLElement, input: BreathInput): () => void`. Any element with a `data-ui` attribute is excluded from steering.
  - `guide.ts`: `GUIDE_IN = 4`, `GUIDE_OUT = 6`, `guidePhase(t): { inhaling: boolean; scale: number }`, `class GuideVisibility { constructor(loop: number); visible: boolean; update(t, steadiness): boolean }`
  - `foldGeometry.ts`: `foldGeometry(fold: Fold): THREE.BufferGeometry` (cached and shared; never dispose)
  - `glowTexture.ts`: `glowTexture(): THREE.Texture` (cached)
  - Components: `FlightSystem`, `PlayerPlane`, `BreathRing`, `Rooftop`

- [ ] **Step 1: Write the failing tests**

`test/breathInput.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BreathInput } from '@/flight/breathInput';

describe('BreathInput', () => {
  it('holds while any pointer is down (multi-touch)', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.pointerDown(2); i.pointerUp(1);
    expect(i.held).toBe(true);
    i.pointerUp(2);
    expect(i.held).toBe(false);
  });
  it('releases on pointercancel', () => {
    const i = new BreathInput();
    i.pointerDown(7); i.pointerCancel(7);
    expect(i.held).toBe(false);
  });
  it('releases everything on blur (tab hidden, window switch)', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.keyDown('Space'); i.blur();
    expect(i.held).toBe(false);
  });
  it('treats Space as a breath key and ignores other keys', () => {
    const i = new BreathInput();
    i.keyDown('KeyA');
    expect(i.held).toBe(false);
    i.keyDown('Space');
    expect(i.held).toBe(true);
    i.keyUp('Space');
    expect(i.held).toBe(false);
  });
  it('ignores an up for a pointer it never saw', () => {
    const i = new BreathInput();
    i.pointerDown(1); i.pointerUp(99);
    expect(i.held).toBe(true);
  });
});
```

`test/guide.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { GuideVisibility, guidePhase } from '@/flight/guide';

describe('guidePhase', () => {
  it('inhales for 4 s then exhales for 6 s, repeating', () => {
    expect(guidePhase(1).inhaling).toBe(true);
    expect(guidePhase(5).inhaling).toBe(false);
    expect(guidePhase(11).inhaling).toBe(true);
  });
  it('scale peaks at the end of the inhale', () => {
    expect(guidePhase(0).scale).toBeCloseTo(0, 5);
    expect(guidePhase(4).scale).toBeCloseTo(1, 5);
    expect(guidePhase(9.999).scale).toBeLessThan(0.01);
  });
});

describe('GuideVisibility', () => {
  it('starts visible on loop 0 and hidden on later loops', () => {
    expect(new GuideVisibility(0).visible).toBe(true);
    expect(new GuideVisibility(1).visible).toBe(false);
  });
  it('hides after 30 s of steadiness above 0.7', () => {
    const g = new GuideVisibility(0);
    for (let t = 0; t < 29; t += 0.5) g.update(t, 0.8);
    expect(g.visible).toBe(true);
    for (let t = 29; t <= 31; t += 0.5) g.update(t, 0.8);
    expect(g.visible).toBe(false);
  });
  it('returns after 20 s below 0.3, on any loop', () => {
    const g = new GuideVisibility(2);
    for (let t = 0; t <= 21; t += 0.5) g.update(t, 0.1);
    expect(g.visible).toBe(true);
  });
  it('a brief dip does not toggle it', () => {
    const g = new GuideVisibility(1);
    for (let t = 0; t <= 10; t += 0.5) g.update(t, 0.1);
    g.update(10.5, 0.5);
    for (let t = 11; t <= 25; t += 0.5) g.update(t, 0.1);
    expect(g.visible).toBe(false);
  });
});
```

`test/foldGeometry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FOLDS } from '@sitl/core';
import { foldGeometry } from '@/world/planes/foldGeometry';

describe('foldGeometry', () => {
  it.each(FOLDS)('%s is a finite triangle soup within a 5-unit span', (fold) => {
    const g = foldGeometry(fold);
    const pos = g.getAttribute('position');
    expect(pos.count % 3).toBe(0);
    expect(pos.count).toBeGreaterThanOrEqual(9);
    for (let i = 0; i < pos.array.length; i++) expect(Number.isFinite(pos.array[i])).toBe(true);
    g.computeBoundingBox();
    const size = g.boundingBox!.getSize(new THREE.Vector3());
    expect(Math.max(size.x, size.y, size.z)).toBeLessThanOrEqual(5);
  });
  it('caches geometries', () => {
    expect(foldGeometry('crane')).toBe(foldGeometry('crane'));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/flight/breathInput`, `@/flight/guide` and `@/world/planes/foldGeometry`.

- [ ] **Step 3: Implement the pure modules**

`src/flight/breathInput.ts`:
```ts
/** Input state for the breath: held while any pointer or Space is down. Pure, so it can be tested without a DOM. */
export class BreathInput {
  held = false;
  private pointers = new Set<number>();
  private key = false;

  pointerDown(id: number) { this.pointers.add(id); this.sync(); }
  pointerUp(id: number) { this.pointers.delete(id); this.sync(); }
  pointerCancel(id: number) { this.pointerUp(id); }
  keyDown(code: string) { if (code === 'Space') { this.key = true; this.sync(); } }
  keyUp(code: string) { if (code === 'Space') { this.key = false; this.sync(); } }
  blur() { this.pointers.clear(); this.key = false; this.sync(); }

  private sync() { this.held = this.pointers.size > 0 || this.key; }
}
```

`src/flight/guide.ts`:
```ts
export const GUIDE_IN = 4;
export const GUIDE_OUT = 6;
const PERIOD = GUIDE_IN + GUIDE_OUT;
const ease = (x: number) => x * x * (3 - 2 * x);

export function guidePhase(t: number): { inhaling: boolean; scale: number } {
  const c = ((t % PERIOD) + PERIOD) % PERIOD;
  if (c < GUIDE_IN) return { inhaling: true, scale: ease(c / GUIDE_IN) };
  return { inhaling: false, scale: 1 - ease((c - GUIDE_IN) / GUIDE_OUT) };
}

/** Loop 0 starts with the guide; 30 s steady (> 0.7) hides it; 20 s lost (< 0.3) brings it back. */
export class GuideVisibility {
  visible: boolean;
  private steadySince: number | null = null;
  private lostSince: number | null = null;

  constructor(loop: number) {
    this.visible = loop === 0;
  }

  update(t: number, steadiness: number): boolean {
    this.steadySince = steadiness > 0.7 ? (this.steadySince ?? t) : null;
    this.lostSince = steadiness < 0.3 ? (this.lostSince ?? t) : null;
    if (this.visible && this.steadySince !== null && t - this.steadySince >= 30) this.visible = false;
    if (!this.visible && this.lostSince !== null && t - this.lostSince >= 20) this.visible = true;
    return this.visible;
  }
}
```

`src/world/planes/foldGeometry.ts`:
```ts
import * as THREE from 'three';
import type { Fold } from '@sitl/core';

type V = readonly [number, number, number];
const tri = (...vs: V[]) => vs.flat();

// Every fold faces -Z (nose forward) with wings in X.
const N: V = [0, 0, -2.1], TL: V = [-1.45, 0.18, 1.05], TR: V = [1.45, 0.18, 1.05], C: V = [0, 0, 1.05], K: V = [0, -0.5, 1.05], Kn: V = [0, -0.05, -1.6];
const DART = [...tri(N, TL, C), ...tri(N, C, TR), ...tri(Kn, C, K), ...tri(Kn, K, C)];

const SOURCES: Record<Fold, number[]> = {
  dart: DART,
  glider: (() => {
    const n: V = [0, 0, -1.6], l: V = [-2.2, 0.1, 0.7], r: V = [2.2, 0.1, 0.7], c: V = [0, 0, 0.9], k: V = [0, -0.35, 0.9], kn: V = [0, -0.04, -1.2];
    return [...tri(n, l, c), ...tri(n, c, r), ...tri(kn, c, k), ...tri(kn, k, c)];
  })(),
  crane: (() => {
    const f: V = [0, 0, -0.5], b: V = [0, 0, 0.5];
    return [
      ...tri([-2.2, 0.6, 0], f, b), ...tri([2.2, 0.6, 0], b, f),
      ...tri(f, [0, 0.9, -1.6], [0, 0.1, -0.2]),
      ...tri(b, [0, 0.8, 1.5], [0, 0.1, 0.2]),
      ...tri(f, [0, -0.4, 0], b),
    ];
  })(),
  lanternwing: [...DART, ...tri(TL, [-1.45, 0.7, 1.05], [-1.1, 0.18, 0.6]), ...tri(TR, [1.1, 0.18, 0.6], [1.45, 0.7, 1.05])],
  starkite: (() => {
    const n: V = [0, 0, -2], l: V = [-1.3, 0, 0], t: V = [0, 0, 2.2], r: V = [1.3, 0, 0], c: V = [0, 0.25, 0];
    return [...tri(n, l, c), ...tri(n, c, r), ...tri(l, t, c), ...tri(c, t, r)];
  })(),
};

const cache = new Map<Fold, THREE.BufferGeometry>();

/** Shared, cached geometry per fold. Callers must not dispose it. */
export function foldGeometry(fold: Fold): THREE.BufferGeometry {
  let g = cache.get(fold);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(SOURCES[fold], 3));
    g.computeVertexNormals();
    cache.set(fold, g);
  }
  return g;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement the DOM wiring and the flight loop**

`src/flight/attachInput.ts`:
```ts
import { live } from './live';
import type { BreathInput } from './breathInput';

/** Breath press on the canvas; steering from pointer position; release on up/cancel/blur/hidden. */
export function attachInput(el: HTMLElement, input: BreathInput): () => void {
  const isUi = (e: Event) => e.target instanceof Element && e.target.closest('[data-ui]') !== null;
  const isTyping = (e: Event) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  const steer = (e: PointerEvent) => {
    if (isUi(e)) return;
    live.pointerRaw.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  const down = (e: PointerEvent) => { steer(e); input.pointerDown(e.pointerId); };
  const up = (e: PointerEvent) => input.pointerUp(e.pointerId);
  const cancel = (e: PointerEvent) => input.pointerCancel(e.pointerId);
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space' || isTyping(e) || e.repeat) return;
    e.preventDefault();
    input.keyDown(e.code);
  };
  const keyUp = (e: KeyboardEvent) => input.keyUp(e.code);
  const blur = () => input.blur();
  const visibility = () => { if (document.hidden) input.blur(); };

  el.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', steer);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    el.removeEventListener('pointerdown', down);
    window.removeEventListener('pointermove', steer);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
    window.removeEventListener('blur', blur);
    document.removeEventListener('visibilitychange', visibility);
  };
}
```

`src/flight/FlightSystem.tsx`:
```tsx
'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BreathTracker, MAX_DT, advanceAltitude, climbRate, climbStep, countNear, syncBoostAt, updraft } from '@sitl/core';
import { persistNow } from '@/profile/persist';
import { useApp } from '@/state/store';
import { setLiveAltitude } from './altitude';
import { attachInput } from './attachInput';
import { BreathInput } from './breathInput';
import { GuideVisibility, guidePhase } from './guide';
import { live } from './live';

const LAUNCH_SECONDS = 4;
const ease = (x: number) => x * x * (3 - 2 * x);

export function FlightSystem() {
  const gl = useThree((s) => s.gl);
  const input = useMemo(() => new BreathInput(), []);
  const tracker = useRef<BreathTracker | null>(null);
  const guide = useRef<GuideVisibility | null>(null);
  const launch = useRef<{ from: number; to: number; start: number } | null>(null);
  const saveTimer = useRef(0);

  useEffect(() => attachInput(gl.domElement, input), [gl, input]);
  useEffect(() => {
    const save = () => persistNow();
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', save);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', save);
    };
  }, []);

  useFrame((state, rawDt) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    live.time = t;
    const app = useApp.getState();

    if (app.phase === 'loading' || app.phase === 'ritual') {
      live.inhaling = false;
      live.flutter = false;
      launch.current = null;
      if (live.lifetimeAlt !== Math.floor(app.savedAlt)) setLiveAltitude(Math.floor(app.savedAlt));
      return;
    }

    if (app.phase === 'launching') {
      const L = (launch.current ??= { from: Math.floor(app.savedAlt), to: app.savedAlt, start: t });
      const k = Math.min(1, (t - L.start) / LAUNCH_SECONDS);
      setLiveAltitude(L.from + (L.to - L.from) * ease(k));
      if (k >= 1) {
        launch.current = null;
        tracker.current = new BreathTracker(t);
        guide.current = new GuideVisibility(live.loop);
        app.setFlying();
      }
      return;
    }

    // Flying.
    const tr = (tracker.current ??= new BreathTracker(t));
    const gv = (guide.current ??= new GuideVisibility(live.loop));
    const wantInhale = app.settings.autoBreathe ? guidePhase(t).inhaling : input.held;
    if (wantInhale) tr.press(t);
    else tr.release(t);
    const snap = tr.update(t);
    live.inhaling = snap.inhaling;
    live.steadiness = snap.steadiness;
    live.flutter = snap.flutter;
    live.inhaleStartedAt = snap.inhaleStartedAt;
    live.guideVisible = gv.update(t, snap.steadiness);

    live.near = countNear({ x: live.pointer.x, alt: live.bandProgress }, live.others);
    const rate = climbRate({
      steadiness: snap.steadiness,
      updraft: updraft(live.near.real, live.near.echo),
      syncBoost: syncBoostAt(t, live.lastSyncAt),
      flutter: snap.flutter,
    });
    const next = advanceAltitude(live.lifetimeAlt, climbStep(rate, dt));
    setLiveAltitude(next.lifetimeAlt);

    if (next.loopsCrossed > 0) {
      app.newDawn(next.lifetimeAlt);
      tracker.current = null;
      guide.current = null;
      persistNow();
      return;
    }
    if ((saveTimer.current += dt) > 5) {
      saveTimer.current = 0;
      app.setSavedAlt(live.lifetimeAlt);
      persistNow();
    }
  }, -2);

  return null;
}
```

`src/world/planes/glowTexture.ts`:
```ts
import * as THREE from 'three';

let tex: THREE.Texture | null = null;
export function glowTexture(): THREE.Texture {
  if (tex) return tex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  tex = new THREE.CanvasTexture(c);
  return tex;
}
```

`src/world/planes/PlayerPlane.tsx` (plane, glow and v1 contrails):
```tsx
'use client';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { KINDS, MAX_DT } from '@sitl/core';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { livePalette as lp } from '../livePalette';
import { foldGeometry } from './foldGeometry';
import { glowTexture } from './glowTexture';

const TN = 40;
const TIPS = [new THREE.Vector3(-1.4, 0.18, 1.0), new THREE.Vector3(1.4, 0.18, 1.0)];

function makeTrail() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TN * 6), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aT', new THREE.BufferAttribute(Float32Array.from({ length: TN * 2 }, (_, i) => (i >> 1) / (TN - 1)), 1));
  const idx: number[] = [];
  for (let i = 0; i < TN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uCol: { value: lp.tint } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `attribute float aT; varying float vT, vNear; void main(){ vT = aT; vec4 mv = modelViewMatrix*vec4(position,1.); vNear = smoothstep(4., 11., -mv.z); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uCol; varying float vT, vNear; void main(){ gl_FragColor = vec4(uCol*.4*pow(1.-vT, 2.)*vNear, 1.); }`,
  }));
  m.frustumCulled = false;
  m.renderOrder = 4;
  return { mesh: m, hist: [] as THREE.Vector3[] };
}

export function PlayerPlane() {
  const camera = useThree((s) => s.camera);
  const kind = useApp((s) => s.kind);
  const fold = useApp((s) => s.fold);
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xf7f4ee, roughness: 0.55, side: THREE.DoubleSide, flatShading: true, emissive: new THREE.Color(KINDS[kind]), emissiveIntensity: 0.2,
  }), [kind]);
  const glowMat = useMemo(() => new THREE.SpriteMaterial({
    map: glowTexture(), color: new THREE.Color(KINDS[kind]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }), [kind]);
  const trails = useMemo(() => [makeTrail(), makeTrail()], []);
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);

  useFrame((state, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    const t = state.clock.elapsedTime;
    const phase = useApp.getState().phase;
    const flying = phase === 'launching' || phase === 'flying';
    g.visible = flying;
    trails.forEach((tr) => { tr.mesh.visible = flying; });
    if (!flying) { trails.forEach((tr) => { tr.hist.length = 0; }); return; }

    tmp.target.set(live.pointer.x * 7.5, live.pointer.y * 3.2 - 1.4, -13).applyQuaternion(camera.quaternion).add(camera.position);
    if (g.position.lengthSq() === 0) g.position.copy(tmp.target);
    g.position.lerp(tmp.target, 1 - Math.exp(-6 * dt));
    const lx = live.pointer.x - live.pointerSlow.x, ly = live.pointer.y - live.pointerSlow.y;
    const flutter = live.flutter ? Math.sin(t * 38) * 0.12 : 0;
    g.rotation.set(ly * 0.9 + Math.sin(t * 1.7) * 0.03 + flutter, -lx * 0.5, -lx * 1.6 + Math.sin(t * 1.1) * 0.05 + flutter, 'YXZ');
    g.updateMatrixWorld();
    live.plane.copy(g.position);

    material.emissiveIntensity = 0.15 + live.steadiness * 0.6 + (live.inhaling ? 0.2 : 0);
    if (glow.current) {
      const s = 3 + live.steadiness * 4 + (live.inhaling ? 1.5 : 0);
      glow.current.scale.setScalar(s);
      glowMat.opacity = 0.3 + live.steadiness * 0.4;
    }

    trails.forEach((tr, i) => {
      tr.hist.unshift(g.localToWorld(tmp.a.copy(TIPS[i]!)).clone());
      if (tr.hist.length > TN) tr.hist.pop();
      const P = tr.mesh.geometry.attributes.position!.array as Float32Array;
      for (let j = 0; j < TN; j++) {
        const p = tr.hist[Math.min(j, tr.hist.length - 1)]!, q = tr.hist[Math.min(j + 1, tr.hist.length - 1)]!;
        tmp.b.subVectors(p, q);
        if (tmp.b.lengthSq() < 1e-6) tmp.b.set(0, 0, 1);
        tmp.c.subVectors(camera.position, p).cross(tmp.b).normalize().multiplyScalar(0.035 * (1 - j / TN) + 0.006);
        P.set([p.x + tmp.c.x, p.y + tmp.c.y, p.z + tmp.c.z, p.x - tmp.c.x, p.y - tmp.c.y, p.z - tmp.c.z], j * 6);
      }
      tr.mesh.geometry.attributes.position!.needsUpdate = true;
    });
  });

  return (
    <>
      <group ref={group}>
        <mesh geometry={foldGeometry(fold)} material={material} />
        <sprite ref={glow} material={glowMat} scale={4} />
      </group>
      {trails.map((tr, i) => <primitive key={i} object={tr.mesh} />)}
    </>
  );
}
```

`src/world/planes/BreathRing.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { guidePhase } from '@/flight/guide';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';

export function BreathRing() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const flying = useApp.getState().phase === 'flying';
    const target = flying && live.guideVisible ? 0.45 : 0;
    material.opacity += (target - material.opacity) * (1 - Math.exp(-2 * dt));
    m.visible = material.opacity > 0.01;
    m.position.copy(live.plane);
    m.quaternion.copy(state.camera.quaternion);
    m.scale.setScalar(1.3 + guidePhase(state.clock.elapsedTime).scale * 1.3);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={5}>
      <ringGeometry args={[1.6, 1.72, 64]} />
    </mesh>
  );
}
```

`src/world/ground/Rooftop.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { cameraBaseY } from '../altitudeRig';

/** A dark rain-wet rooftop under the camera during the ritual. It stays put once the plane launches. */
export function Rooftop() {
  const group = useRef<THREE.Group>(null);
  const anchored = useRef(false);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const phase = useApp.getState().phase;
    if (phase === 'ritual' || phase === 'loading') {
      g.position.set(live.camera.x, cameraBaseY(0) - 6, live.camera.z - 16);
      anchored.current = true;
    }
    g.visible = anchored.current && phase !== 'flying';
    if (phase === 'flying') anchored.current = false;
  });
  return (
    <group ref={group}>
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[70, 2, 36]} />
        <meshStandardMaterial color="#15161d" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.6, -17.6]}>
        <boxGeometry args={[70, 1.2, 0.8]} />
        <meshStandardMaterial color="#1c1e27" roughness={0.6} />
      </mesh>
    </group>
  );
}
```

Modify `src/world/Experience.tsx`: add these imports:
```tsx
import { FlightSystem } from '@/flight/FlightSystem';
import { BreathRing } from './planes/BreathRing';
import { PlayerPlane } from './planes/PlayerPlane';
import { Rooftop } from './ground/Rooftop';
```
Then insert `<FlightSystem />` as the first child of `<Canvas>`, and insert `<Rooftop />`, `<PlayerPlane />` and `<BreathRing />` directly after `<CloudSea />`.

Also add a temporary dev launch so the flight can be tried before the Ritual UI exists (Task 9 removes this). In `Experience`'s `useEffect`, after `hydrate`, add:
```tsx
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).has('skip')) {
      useApp.getState().release('hope', useApp.getState().fold);
    }
```

- [ ] **Step 6: Typecheck, test and fly**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Manual check at `http://localhost:3000/fly?skip`:
1. The plane rises off the rooftop over about 4 s, then flies.
2. Holding the mouse (or Space) for about 4 s and releasing for about 6 s, repeatedly, slowly brightens the plane's glow. The breath ring is visible and pulsing.
3. Rapid clicking makes the plane flutter.
4. Switching tabs mid-hold, then returning, leaves the plane not inhaling.

Then reload `?alt=0.995&skip` and breathe steadily. Within a few seconds the phase returns to ritual (the plane hides and the camera snaps to the rooftop). Afterwards `localStorage['sitl.profile.v1']` shows `loop: 1` and `unlockedFolds` containing `glider`.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): breath-driven flight, folds, player plane, guide ring and rooftop

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Seed echoes (companions that fill the sky)

**Files:**
- Create: `src/echoes/seed.ts`, `src/echoes/playback.ts`, `src/echoes/EchoPlanes.tsx`
- Modify: `src/world/Experience.tsx`
- Test: `test/echoes.test.ts`

**Interfaces:**
- Consumes: `createRng`, `foldGeometry`, `glowTexture`, `live`, `useApp`, and from core: `BANDS`, `FOLDS`, `KIND_ORDER`, `KINDS`, `SOLO_LOOP_SECONDS`, `bandWeight`.
- Produces:
  - `seed.ts`: `interface EchoPath { kind: Kind; fold: Fold; loop: number; band: BandIndex; samples: [number, number][] }`, `ECHOES_PER_BAND = 4`, `generateSeedEchoes(seed?: number): EchoPath[]`
  - `playback.ts`: `pathDuration(p): number`, `echoPositionAt(p, seconds): { x; alt }`, `startOffsetFor(p, bandAlt): number`
  - `EchoPlanes.tsx`: `EchoPlanes` component. It writes `live.others` every frame, and `ECHO_X_SCALE = 40` / `BAND_UNITS = 40` are exported for Plan 2's remote planes.

- [ ] **Step 1: Write the failing test `test/echoes.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { ECHOES_PER_BAND, generateSeedEchoes } from '@/echoes/seed';
import { echoPositionAt, pathDuration, startOffsetFor } from '@/echoes/playback';

describe('generateSeedEchoes', () => {
  const echoes = generateSeedEchoes();
  it('is deterministic', () => {
    expect(generateSeedEchoes()).toEqual(echoes);
  });
  it('has 4 paths per band', () => {
    for (let b = 0; b < 5; b++) expect(echoes.filter((e) => e.band === b)).toHaveLength(ECHOES_PER_BAND);
  });
  it('produces valid, monotonic paths of at most 180 samples', () => {
    for (const e of echoes) {
      expect(e.samples.length).toBeGreaterThanOrEqual(30);
      expect(e.samples.length).toBeLessThanOrEqual(180);
      for (let i = 0; i < e.samples.length; i++) {
        const [x, alt] = e.samples[i]!;
        expect(x).toBeGreaterThanOrEqual(-1);
        expect(x).toBeLessThanOrEqual(1);
        if (i > 0) expect(alt).toBeGreaterThanOrEqual(e.samples[i - 1]![1]);
      }
      expect(e.samples[0]![1]).toBe(0);
      expect(e.samples.at(-1)![1]).toBeCloseTo(1, 9);
    }
  });
});

describe('playback', () => {
  const path = { kind: 'hope' as const, fold: 'dart' as const, loop: 0, band: 2 as const, samples: [[0, 0], [1, 0.5], [0, 1]] as [number, number][] };
  it('runs at 1 Hz', () => {
    expect(pathDuration(path)).toBe(2);
  });
  it('interpolates between samples', () => {
    expect(echoPositionAt(path, 0.5)).toEqual({ x: 0.5, alt: 0.25 });
  });
  it('clamps outside the path', () => {
    expect(echoPositionAt(path, -3)).toEqual({ x: 0, alt: 0 });
    expect(echoPositionAt(path, 99)).toEqual({ x: 0, alt: 1 });
  });
  it('finds the first sample at or above an altitude', () => {
    expect(startOffsetFor(path, 0.4)).toBe(1);
    expect(startOffsetFor(path, 2)).toBe(2);
    expect(startOffsetFor(path, Number.NaN)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/echoes/seed`.

- [ ] **Step 3: Implement `seed.ts` and `playback.ts`**

`src/echoes/seed.ts`:
```ts
import { BANDS, FOLDS, KIND_ORDER, SOLO_LOOP_SECONDS, type BandIndex, type Fold, type Kind } from '@sitl/core';
import { createRng } from '@/lib/rng';

/** A recorded flight through one band: 1 Hz samples of [x ∈ -1..1, bandAlt ∈ 0..1]. Never contains words. */
export interface EchoPath { kind: Kind; fold: Fold; loop: number; band: BandIndex; samples: [number, number][] }

export const ECHOES_PER_BAND = 4;

export function generateSeedEchoes(seed = 7): EchoPath[] {
  const rand = createRng(seed);
  const out: EchoPath[] = [];
  for (let band = 0; band < BANDS.length; band++) {
    const span = BANDS[band]!.end - BANDS[band]!.start;
    for (let k = 0; k < ECHOES_PER_BAND; k++) {
      const n = Math.min(180, Math.max(30, Math.round(span * SOLO_LOOP_SECONDS * (0.8 + rand() * 0.4))));
      const f1 = 0.02 + rand() * 0.04, f2 = 0.05 + rand() * 0.08, p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2;
      const cx = rand() * 1.2 - 0.6, exp = 0.85 + rand() * 0.3;
      const samples: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const x = Math.max(-1, Math.min(1, cx + 0.35 * Math.sin(i * f1 + p1) + 0.12 * Math.sin(i * f2 + p2)));
        samples.push([x, Math.pow(u, exp)]);
      }
      out.push({
        kind: KIND_ORDER[Math.floor(rand() * KIND_ORDER.length)]!,
        fold: FOLDS[Math.floor(rand() * FOLDS.length)]!,
        loop: Math.floor(rand() * 6),
        band: band as BandIndex,
        samples,
      });
    }
  }
  return out;
}
```

`src/echoes/playback.ts`:
```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement `EchoPlanes.tsx`**

```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { KINDS, bandWeight, type Presence } from '@sitl/core';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { foldGeometry } from '@/world/planes/foldGeometry';
import { glowTexture } from '@/world/planes/glowTexture';
import { echoPositionAt, pathDuration, startOffsetFor } from './playback';
import { generateSeedEchoes, type EchoPath } from './seed';

export const MAX_ECHOES = 5;
/** Shared mapping from normalized space to world units (also used by Plan 2's remote planes). */
export const ECHO_X_SCALE = 40;
export const BAND_UNITS = 40;

interface Slot { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; glow: THREE.Sprite; path: EchoPath | null; startT: number; offset: number; zOff: number; pos: { x: number; alt: number } }

export function EchoPlanes() {
  const seeds = useMemo(() => generateSeedEchoes(), []);
  const group = useRef<THREE.Group>(null);
  const cursor = useRef(0);
  const lastBand = useRef(-1);
  const slots = useMemo<Slot[]>(() => Array.from({ length: MAX_ECHOES }, (_, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, transparent: true, opacity: 0, side: THREE.DoubleSide, flatShading: true, emissiveIntensity: 0.5, depthWrite: false });
    const mesh = new THREE.Mesh(foldGeometry('dart'), mat);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    glow.scale.setScalar(4);
    mesh.add(glow);
    return { mesh, mat, glow, path: null, startT: 0, offset: 0, zOff: 6 + i * 7, pos: { x: 0, alt: 0 } };
  }), []);
  const constellation = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((MAX_ECHOES - 1) * 6), 3).setUsage(THREE.DynamicDrawUsage));
    const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    line.frustumCulled = false;
    return line;
  }, []);

  const assign = (slot: Slot, t: number) => {
    const pool = seeds.filter((e) => e.band === live.band);
    const path = pool[cursor.current++ % pool.length]!;
    slot.path = path;
    slot.startT = t;
    slot.offset = startOffsetFor(path, live.bandProgress + (Math.random() - 0.5) * 0.12);
    slot.mesh.geometry = foldGeometry(path.fold);
    slot.mat.emissive.set(KINDS[path.kind]);
    (slot.glow.material as THREE.SpriteMaterial).color.set(KINDS[path.kind]);
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const phase = useApp.getState().phase;
    const active = phase === 'flying' || phase === 'launching';
    if (group.current) group.current.visible = active;
    if (!active) { live.others = []; lastBand.current = -1; return; }
    if (live.band !== lastBand.current) { lastBand.current = live.band; slots.forEach((s) => assign(s, t)); }

    const others: Presence[] = [];
    for (const s of slots) {
      if (!s.path) continue;
      let elapsed = t - s.startT + s.offset;
      if (elapsed >= pathDuration(s.path)) { assign(s, t); elapsed = s.offset; }
      s.pos = echoPositionAt(s.path, elapsed);
      const fade = Math.min(1, (t - s.startT) / 2, (pathDuration(s.path) - elapsed) / 2);
      s.mat.opacity = 0.5 * fade;
      (s.glow.material as THREE.SpriteMaterial).opacity = 0.35 * fade;
      s.mesh.position.set(s.pos.x * ECHO_X_SCALE, live.camera.y - 1.4 + (s.pos.alt - live.bandProgress) * BAND_UNITS, live.camera.z - 13 - s.zOff);
      s.mesh.rotation.set(0, 0, Math.sin(t * 0.7 + s.zOff) * 0.15);
      others.push({ x: s.pos.x, alt: s.pos.alt, echo: true });
    }
    live.others = others;

    // The Stars: link the echoes into a faint constellation, ordered left → right.
    const sorted = [...slots].sort((a, b) => a.mesh.position.x - b.mesh.position.x);
    const P = constellation.geometry.attributes.position!.array as Float32Array;
    for (let i = 0; i < MAX_ECHOES - 1; i++) {
      const a = sorted[i]!.mesh.position, b = sorted[i + 1]!.mesh.position;
      P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    }
    constellation.geometry.attributes.position!.needsUpdate = true;
    (constellation.material as THREE.LineBasicMaterial).opacity = 0.35 * bandWeight(live.loopAlt, 4);
  });

  return (
    <group ref={group}>
      {slots.map((s, i) => <primitive key={i} object={s.mesh} />)}
      <primitive object={constellation} />
    </group>
  );
}
```

Modify `src/world/Experience.tsx`: `import { EchoPlanes } from '@/echoes/EchoPlanes';` and insert `<EchoPlanes />` directly after `<PlayerPlane />`.

- [ ] **Step 6: Typecheck, test and look at it**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Manual check at `/fly?alt=0.4&skip`: five translucent, softly glowing planes in different colors and folds fly around you, drifting slowly above and below. Steering into the middle of them should visibly speed up your climb compared with flying far off to one side. At `/fly?alt=0.9&skip`, faint lines join the echoes like a constellation.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): seed echoes that fly beside you and lift you

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Band elements (city and rain, words, birds, whales, lanterns, shooting stars)

**Files:**
- Create: `src/world/ground/City.tsx`, `src/world/ground/Rain.tsx`
- Create: `src/world/elements/Words.tsx`, `Birds.tsx`, `Whales.tsx`, `Lanterns.tsx`, `ShootingStars.tsx`
- Modify: `src/world/Experience.tsx`
- Test: `test/shootingStars.test.ts`

**Interfaces:**
- Consumes: `live`, `livePalette`, `useApp`, `createCloudMaterial`, `updateCloudUniforms`, `W`, `L`, `AHEAD`, `wrap`, `NOISE`, `cameraBaseY`, and from core: `bandWeight`, `elementsForLoop`.
- Produces: `ShootingStars.tsx` exports `queueShootingStar(from: THREE.Vector3, to: THREE.Vector3): void` (Plan 2 calls it on sync events) and the pure `ambientInterval(loop: number, starsWeight: number): number | null`.

- [ ] **Step 1: Write the failing test `test/shootingStars.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { ambientInterval } from '@/world/elements/ShootingStars';

describe('ambientInterval', () => {
  it('is null outside The Stars', () => {
    expect(ambientInterval(0, 0)).toBeNull();
    expect(ambientInterval(5, 0.05)).toBeNull();
  });
  it('is more frequent from loop 3', () => {
    expect(ambientInterval(0, 1)).toBe(9);
    expect(ambientInterval(3, 1)).toBe(3.5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/world/elements/ShootingStars`.

- [ ] **Step 3: Implement `ShootingStars.tsx`**

```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bandWeight, elementsForLoop } from '@sitl/core';
import { live } from '@/flight/live';

const POOL = 6;
const LIFE = 1.2;
const queue: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];

/** Spawn a star that arcs from → to (world space). Used by Plan 2 for breath-sync moments. */
export function queueShootingStar(from: THREE.Vector3, to: THREE.Vector3): void {
  queue.push({ from: from.clone(), to: to.clone() });
}

/** Seconds between ambient stars, or null when they should not appear. */
export function ambientInterval(loop: number, starsWeight: number): number | null {
  if (starsWeight < 0.1) return null;
  return elementsForLoop(loop).moreShootingStars ? 3.5 : 9;
}

export function ShootingStars() {
  const nextAt = useRef(5);
  const stars = useMemo(() => Array.from({ length: POOL }, () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3).setUsage(THREE.DynamicDrawUsage));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#fff4e0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    line.frustumCulled = false;
    return { line, from: new THREE.Vector3(), to: new THREE.Vector3(), born: -99 };
  }), []);
  const head = useMemo(() => new THREE.Vector3(), []);
  const tail = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const spawn = (from: THREE.Vector3, to: THREE.Vector3) => {
      const s = stars.reduce((a, b) => (a.born < b.born ? a : b));
      s.from.copy(from); s.to.copy(to); s.born = t;
    };
    while (queue.length) { const q = queue.shift()!; spawn(q.from, q.to); }
    const interval = ambientInterval(live.loop, bandWeight(live.loopAlt, 4));
    if (interval !== null && t > nextAt.current) {
      nextAt.current = t + interval * (0.6 + Math.random() * 0.8);
      const from = new THREE.Vector3(live.camera.x + (Math.random() - 0.5) * 400, live.camera.y + 90 + Math.random() * 90, live.camera.z - 500);
      const dir = new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, -0.35, 0.15).normalize();
      spawn(from, from.clone().addScaledVector(dir, 260));
    }
    for (const s of stars) {
      const k = (t - s.born) / LIFE;
      const m = s.line.material as THREE.LineBasicMaterial;
      if (k < 0 || k > 1) { m.opacity = 0; continue; }
      head.lerpVectors(s.from, s.to, k);
      tail.lerpVectors(s.from, s.to, Math.max(0, k - 0.18));
      (s.line.geometry.attributes.position!.array as Float32Array).set([tail.x, tail.y, tail.z, head.x, head.y, head.z]);
      s.line.geometry.attributes.position!.needsUpdate = true;
      m.opacity = Math.sin(k * Math.PI) * 0.9;
    }
  });

  return <>{stars.map((s, i) => <primitive key={i} object={s.line} />)}</>;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement the remaining elements**

`src/world/ground/City.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { createRng } from '@/lib/rng';

const CW = 2400, CL = 2400, N = 3000;

/** Street-grid lights far below the Ground band. */
export function City() {
  const { geometry, material } = useMemo(() => {
    const rand = createRng(11);
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const alongX = rand() < 0.5;
      pos[i * 3] = alongX ? rand() * CW - CW / 2 : Math.round((rand() * CW) / 40) * 40 - CW / 2 + (rand() - 0.5) * 3;
      pos[i * 3 + 1] = -420;
      pos[i * 3 + 2] = alongX ? Math.round((rand() * CL) / 40) * 40 + (rand() - 0.5) * 3 : rand() * CL;
      seed[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCamX: { value: 0 }, uCamZ: { value: 0 }, uAmt: { value: 0 }, uPR: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uCamX, uCamZ, uAmt, uPR; varying float vA; varying vec3 vC;
        const float W = ${CW}.0, L = ${CL}.0;
        void main(){
          float rel = mod(uCamZ - position.z, L);
          float z = uCamZ + 40. - rel;
          float x = uCamX + mod(position.x - uCamX + W*.5, W) - W*.5;
          vec4 mv = viewMatrix * vec4(x, position.y, z, 1.);
          gl_PointSize = (6. + aSeed*10.) * uPR * 300. / max(-mv.z, 1.);
          vA = uAmt * smoothstep(L, L-400., rel) * (.7 + .3*sin(uTime*(.5 + aSeed*3.) + aSeed*40.));
          vC = mix(vec3(1., .72, .38), vec3(.85, .9, 1.), step(.7, aSeed));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying vec3 vC;
        void main(){ vec2 d = gl_PointCoord - .5; float a = exp(-dot(d,d)*28.) * vA; gl_FragColor = vec4(vC*a*1.6, 1.); }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamX!.value = live.camera.x;
    u.uCamZ!.value = live.camera.z;
    u.uAmt!.value = bandWeight(live.loopAlt, 0);
    u.uPR!.value = state.gl.getPixelRatio() * state.size.height / 900;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />;
}
```

`src/world/ground/Rain.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { createRng } from '@/lib/rng';

const DROPS = 1200;

/** Falling streaks in a box that travels with the camera. Heavy on the Ground, a drizzle into the Fog. */
export function Rain() {
  const { geometry, material } = useMemo(() => {
    const rand = createRng(23);
    const base = new Float32Array(DROPS * 6), end = new Float32Array(DROPS * 2);
    for (let i = 0; i < DROPS; i++) {
      const x = rand() * 90, y = rand() * 70, z = rand() * 140;
      base.set([x, y, z, x, y, z], i * 6);
      end[i * 2 + 1] = 1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 6), 3));
    geometry.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
    geometry.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uAmt: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute vec3 aBase; attribute float aEnd; uniform float uTime, uAmt; uniform vec3 uCam; varying float vA;
        void main(){
          vec3 box = vec3(90., 70., 140.);
          vec3 p;
          p.x = mod(aBase.x - uCam.x + box.x*.5, box.x) - box.x*.5 + uCam.x;
          p.y = mod(aBase.y - uTime*38. - uCam.y + box.y*.5, box.y) - box.y*.5 + uCam.y;
          p.z = mod(aBase.z - uCam.z, box.z) - box.z + uCam.z + 10.;
          p += vec3(.6, 1.8, 0.) * aEnd;
          vA = uAmt * (1. - aEnd*.7);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`,
      fragmentShader: /* glsl */ `varying float vA; void main(){ gl_FragColor = vec4(vec3(.75,.8,.9)*vA*.35, 1.); }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    (u.uCam!.value as THREE.Vector3).set(live.camera.x, live.camera.y, live.camera.z);
    u.uAmt!.value = bandWeight(live.loopAlt, 0) + bandWeight(live.loopAlt, 1) * 0.3;
  });
  return <lineSegments geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
```

`src/world/elements/Words.tsx` (v1 words; visible only Above the Clouds):
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { AHEAD, wrap } from '../clouds/cloudField';
import { livePalette as lp } from '../livePalette';
import { NOISE } from '../shaders/noise';

const WORDS = ['Sky', 'is the', 'limit'];
const SPACE = 330, WL = SPACE * WORDS.length;

const fragment = NOISE + /* glsl */ `
  uniform sampler2D uTex; uniform float uDist, uTime, uWeight; uniform vec3 uTint, uSunCol; varying vec2 vUv;
  void main(){
    vec4 t = texture2D(uTex, vUv);
    float n = fbm(vUv*vec2(9., 2.6) + vec2(uTime*.12, 0.)) * 1.12;
    float dis = smoothstep(170., 30., uDist);
    float keep = smoothstep(dis - .14, dis + .04, n);
    float ember = (smoothstep(dis - .16, dis, n) - smoothstep(dis, dis + .14, n)) * step(.02, dis);
    float a = t.a * keep * smoothstep(560., 330., uDist) * uWeight;
    vec3 col = uTint * (1.15 + .9*t.a) + uSunCol * ember * 3.5;
    gl_FragColor = vec4(col, a);
  }`;

export function Words() {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[]>([]);
  const geometry = useMemo(() => new THREE.PlaneGeometry(66, 16.5), []);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled || !group.current) return;
      const family = getComputedStyle(document.documentElement).getPropertyValue('--font-serif').trim() || 'Georgia, serif';
      meshes.current = WORDS.map((w, i) => {
        const cv = document.createElement('canvas');
        cv.width = 2048; cv.height = 512;
        const g = cv.getContext('2d')!;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
        g.font = `italic 400 330px ${family}`;
        g.shadowColor = 'rgba(255,255,255,.65)'; g.shadowBlur = 50;
        g.fillText(w, 1024, 270); g.shadowBlur = 0; g.fillText(w, 1024, 270);
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 4;
        const m = new THREE.Mesh(geometry, new THREE.ShaderMaterial({
          uniforms: { uTex: { value: tex }, uDist: { value: 999 }, uTime: { value: 0 }, uWeight: { value: 0 }, uTint: { value: lp.tint }, uSunCol: { value: lp.sun } },
          transparent: true, depthWrite: false,
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
          fragmentShader: fragment,
        }));
        m.renderOrder = 2;
        m.frustumCulled = false;
        m.userData.z = -260 - i * SPACE;
        group.current!.add(m);
        return m;
      });
    });
    return () => {
      cancelled = true;
      meshes.current.forEach((m) => { m.material.uniforms.uTex!.value.dispose(); m.material.dispose(); m.removeFromParent(); });
      meshes.current = [];
    };
  }, [geometry]);

  useFrame((state) => {
    const weight = bandWeight(live.loopAlt, 2);
    for (const m of meshes.current) {
      const rel = wrap(live.camera.z - (m.userData.z as number), WL);
      m.position.set(live.camera.x * 0.55, live.camera.y + 3.5, live.camera.z + AHEAD - rel);
      m.visible = rel > AHEAD && weight > 0.01;
      const u = m.material.uniforms;
      u.uDist!.value = rel - AHEAD;
      u.uTime!.value = state.clock.elapsedTime;
      u.uWeight!.value = weight;
    }
  });
  return <group ref={group} />;
}
```

`src/world/elements/Birds.tsx` (v1 flocks; in Above the Clouds; from loop 1, one flock flies in formation with you):
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight, elementsForLoop } from '@sitl/core';
import { live } from '@/flight/live';
import { AHEAD, L, W, wrap } from '../clouds/cloudField';
import { livePalette as lp } from '../livePalette';

const FLOCKS = 7, PER = 7, NB = FLOCKS * PER;

export function Birds() {
  const flocks = useMemo(() => Array.from({ length: FLOCKS }, () => ({ x: Math.random() * W - W / 2, y: 4 + Math.random() * 18, z: Math.random() * L, v: 9 + Math.random() * 8 })), []);
  const birdCol = useMemo(() => new THREE.Color(), []);
  const { geometry, material, aPos } = useMemo(() => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.5, -1.25, 0, 0.15, 0, 0, 0.35, 0, 0, -0.5, 0, 0, 0.35, 1.25, 0, 0.15], 3));
    geometry.instanceCount = NB;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(NB * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    const material = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uAmt: { value: 0 }, uCol: { value: birdCol }, uFog: { value: lp.fog } },
      vertexShader: /* glsl */ `
        attribute vec4 aPos; uniform float uTime; varying float vFog;
        void main(){ vec3 p = position*1.1; float ax = abs(p.x);
          p.y += sin(uTime*9. + aPos.w*40.) * .75 * ax; p.z += ax*.15;
          vec4 mv = viewMatrix * vec4(p + aPos.xyz, 1.);
          vFog = smoothstep(80., 520., -mv.z);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform vec3 uCol, uFog; uniform float uAmt; varying float vFog;
        void main(){ gl_FragColor = vec4(mix(uCol, uFog, vFog), uAmt*(1.-vFog*.6)); }`,
    });
    return { geometry, material, aPos };
  }, [birdCol]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const weight = bandWeight(live.loopAlt, 2);
    material.uniforms.uTime!.value = t;
    material.uniforms.uAmt!.value = weight;
    birdCol.copy(lp.shadow).multiplyScalar(0.35);
    const A = aPos.array as Float32Array;
    const join = elementsForLoop(live.loop).birdsJoin;
    flocks.forEach((f, fi) => {
      const formation = join && fi === 0;
      const rel = wrap(live.camera.z - (f.z - t * f.v), L);
      const baseX = formation ? live.plane.x : live.camera.x + wrap(f.x - live.camera.x + W / 2, W) - W / 2;
      const baseY = formation ? live.plane.y + 1.2 : live.camera.y + f.y;
      const baseZ = formation ? live.plane.z + 2 : live.camera.z + AHEAD - rel;
      for (let k = 0; k < PER; k++) {
        const i = fi * PER + k, side = k % 2 ? 1 : -1, rank = (k + 1) >> 1;
        A[i * 4] = baseX + side * rank * 2.1 + Math.sin(t * 0.7 + i) * 0.3;
        A[i * 4 + 1] = baseY + Math.sin(t * 0.9 + i * 1.7) * 0.4 - rank * 0.15;
        A[i * 4 + 2] = !formation && rel < AHEAD + 4 ? 1e5 : baseZ + rank * 2.4;
        A[i * 4 + 3] = i / NB;
      }
    });
    aPos.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />;
}
```

`src/world/elements/Whales.tsx` (cloud-whales in The Quiet, built from cloud puffs):
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight } from '@sitl/core';
import { live } from '@/flight/live';
import { AHEAD, L, W, wrap } from '../clouds/cloudField';
import { createCloudMaterial, updateCloudUniforms } from '../clouds/cloudMaterial';

interface Part { dx: number; dy: number; s: number; tail: boolean }

function whaleTemplate(): Part[] {
  const parts: Part[] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const r = Math.sin(Math.PI * Math.pow(u, 0.7)) * 8 + 1.5;
    const dx = (0.5 - u) * 70; // head at +x
    parts.push({ dx, dy: -r * 0.15, s: r * 2.4, tail: false });
    if (i % 2 === 0) parts.push({ dx, dy: -r * 0.55, s: r * 1.6, tail: false });
  }
  parts.push({ dx: -38, dy: 5, s: 9, tail: true }, { dx: -40, dy: -4, s: 8, tail: true });
  return parts;
}

const WHALES = [
  { x0: -120, y: 18, z0: 200, speed: 3.2, phase: 0 },
  { x0: 160, y: 26, z0: 460, speed: 2.4, phase: 2 },
  { x0: 20, y: 34, z0: 690, speed: 2.8, phase: 4 },
];

export function Whales() {
  const template = useMemo(whaleTemplate, []);
  const count = template.length * WHALES.length;
  const { geometry, aPos, aData } = useMemo(() => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.copy(new THREE.PlaneGeometry(1, 1) as unknown as THREE.InstancedBufferGeometry);
    geometry.instanceCount = count;
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const aData = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aPos', aPos);
    geometry.setAttribute('aData', aData);
    return { geometry, aPos, aData };
  }, [count]);
  const material = useMemo(() => createCloudMaterial(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const weight = bandWeight(live.loopAlt, 3);
    updateCloudUniforms(material, state.camera as THREE.PerspectiveCamera, t);
    material.uniforms.uPart!.value = 0;
    const P = aPos.array as Float32Array, D = aData.array as Float32Array;
    let j = 0;
    WHALES.forEach((w, wi) => {
      const rel = wrap(live.camera.z - w.z0, L);
      const z = live.camera.z + AHEAD - rel;
      const cx = live.camera.x + wrap(w.x0 + t * w.speed - live.camera.x + W / 2, W) - W / 2;
      const fade = weight * Math.min(1, Math.max(0, (rel - AHEAD - 20) / 60)) * Math.min(1, Math.max(0, (L - rel) / 160));
      for (const p of template) {
        const sway = Math.sin(t * 0.5 + p.dx * 0.05 + w.phase) * 1.5 + (p.tail ? Math.sin(t * 0.8 + w.phase) * 3 : 0);
        P.set([cx + p.dx, live.camera.y + w.y + p.dy + sway, z], j * 3);
        D.set([p.s, (wi * 37 + j) % 1000 / 1000, fade, 0.8], j * 4);
        j++;
      }
    });
    aPos.needsUpdate = true;
    aData.needsUpdate = true;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />;
}
```

`src/world/elements/Lanterns.tsx` (v1 lanterns; The Stars, and from loop 2 also the Fog through the Quiet):
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { bandWeight, elementsForLoop } from '@sitl/core';
import { live } from '@/flight/live';
import { AHEAD, L, W } from '../clouds/cloudField';

const NL = 420;

export function Lanterns() {
  const { geometry, material } = useMemo(() => {
    const base = new Float32Array(NL * 3), seed = new Float32Array(NL);
    for (let i = 0; i < NL; i++) { base.set([Math.random() * W - W / 2, Math.random() * 80, Math.random() * L], i * 3); seed[i] = Math.random(); }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(base, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCamX: { value: 0 }, uCamY: { value: 0 }, uCamZ: { value: 0 }, uAmt: { value: 0 }, uPR: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime, uCamX, uCamY, uCamZ, uAmt, uPR; varying float vA, vF;
        const float W = ${W}.0, L = ${L}.0;
        void main(){
          float rel = mod(uCamZ - position.z, L);
          float z = uCamZ + ${AHEAD}.0 - rel;
          float x = uCamX + mod(position.x - uCamX + W*.5, W) - W*.5 + sin(uTime*.3 + aSeed*20.)*2.;
          float y = mod(position.y + uTime*(1.1 + aSeed*1.6), 80.) - 30. + uCamY;
          vec4 mv = viewMatrix * vec4(x, y, z, 1.);
          gl_PointSize = 950. * uPR * (.7 + aSeed*.6) / max(-mv.z, 1.);
          float ly = y - uCamY;
          vA = uAmt * smoothstep(L, L-160., rel) * smoothstep(0., 14., rel - ${AHEAD}.0) * smoothstep(-30., -22., ly) * smoothstep(50., 35., ly);
          vF = .8 + .2*sin(uTime*(9.+aSeed*8.) + aSeed*50.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA, vF;
        void main(){
          vec2 uv = gl_PointCoord - .5; uv.y = -uv.y;
          vec2 q = abs(uv - vec2(0., .01)) - vec2(.038, .06);
          float body = 1. - smoothstep(0., .015, length(max(q, 0.)) - .012);
          float halo = exp(-dot(uv,uv)*30.);
          vec3 col = vec3(1., .5, .16)*halo*1.1 + vec3(1., .82, .55)*body*2.6;
          gl_FragColor = vec4(col * vF * vA, 1.);
        }`,
    });
    return { geometry, material };
  }, []);

  useFrame((state) => {
    const a = live.loopAlt;
    const lower = elementsForLoop(live.loop).lanternsFromFog ? 0.6 * (bandWeight(a, 1) + bandWeight(a, 2) + bandWeight(a, 3)) : 0;
    const u = material.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uCamX!.value = live.camera.x; u.uCamY!.value = live.camera.y; u.uCamZ!.value = live.camera.z;
    u.uAmt!.value = Math.min(1, bandWeight(a, 4) + lower);
    u.uPR!.value = state.gl.getPixelRatio() * state.size.height / 900;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
```

Modify `src/world/Experience.tsx`: import `City`, `Rain`, `Words`, `Birds`, `Whales`, `Lanterns` and `ShootingStars` from their new paths, and insert them directly after `<CloudSea />` in this order: `<City /> <Rain /> <Whales /> <Words /> <Birds /> <Lanterns /> <ShootingStars />`.

- [ ] **Step 6: Typecheck, test and walk the bands**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Manual check (each with `&skip`):
- `?alt=0.05`: rain streaks and warm city lights far below, with the cloud ceiling overhead.
- `?alt=0.2`: grey fog and light drizzle.
- `?alt=0.45`: golden sea, birds, and *Sky · is the · limit* dissolving into embers as you fly through.
- `?alt=0.7`: blue air, with cloud-whales drifting across, tails swaying.
- `?alt=0.9`: night, aurora, rising lanterns and occasional shooting stars.
- `?alt=1.45`: a bird flock flies in formation with you.
- `?alt=3.9`: frequent shooting stars.

The console must show no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): band elements - city, rain, words, birds, whales, lanterns, shooting stars

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Ritual, story lines, dawn flash and settings

**Files:**
- Create: `src/story/storyMemory.ts`, `src/ui/Overlay.tsx`, `src/ui/Ritual.tsx`, `src/ui/Ritual.module.css`, `src/ui/StoryLine.tsx`, `src/ui/Hud.tsx`, `src/ui/DawnFlash.tsx`, `src/ui/ui.module.css`
- Modify: `src/world/Experience.tsx` (render `<Overlay />`, remove the Task 6 `?skip` block)
- Test: `test/storyMemory.test.ts`

**Interfaces:**
- Consumes: `useApp`, `setIntention`, `persistNow`, `live`, and from core: `BANDS`, `KINDS`, `KIND_ORDER`, `FEET_PER_LOOP`.
- Produces:
  - `storyMemory.ts`: `class StoryMemory { take(loop: number, band: BandIndex): string | null }`
  - `Overlay` / `Ritual` take an optional `onRelease?: () => void`, called synchronously inside the *Let it go* click. Task 10 passes `getEngine().start()` here so audio starts within a user gesture.

- [ ] **Step 1: Write the failing test `test/storyMemory.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { StoryMemory } from '@/story/storyMemory';

describe('StoryMemory', () => {
  it('returns each band line once per loop', () => {
    const m = new StoryMemory();
    expect(m.take(0, 0)).toBe('Everything heavy starts here.');
    expect(m.take(0, 0)).toBeNull();
    expect(m.take(0, 4)).toBe('There was never a top.');
  });
  it('replays lines on the next loop', () => {
    const m = new StoryMemory();
    m.take(0, 2);
    expect(m.take(1, 2)).toBe("Look how far you've come.");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/story/storyMemory`.

- [ ] **Step 3: Implement `src/story/storyMemory.ts`**

```ts
import { BANDS, type BandIndex } from '@sitl/core';

/** Story lines are shown at most once per band per loop. */
export class StoryMemory {
  private seen = new Set<string>();
  take(loop: number, band: BandIndex): string | null {
    const key = `${loop}:${band}`;
    if (this.seen.has(key)) return null;
    this.seen.add(key);
    return BANDS[band].line;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement the UI**

`src/ui/ui.module.css`:
```css
.layer { position: fixed; inset: 0; pointer-events: none; z-index: 5; }
.story {
  position: absolute; left: 50%; top: 26%; transform: translateX(-50%); width: min(90vw, 760px); text-align: center;
  font: italic 400 clamp(28px, 4.6vw, 54px)/1.1 var(--font-serif), serif; color: #fff;
  text-shadow: 0 0 40px rgba(255,255,255,.35), 0 2px 24px rgba(0,0,0,.2);
  opacity: 0; animation: story 12.5s ease forwards;
}
@keyframes story { 0%, 32% { opacity: 0; filter: blur(8px); } 44%, 84% { opacity: 1; filter: blur(0); } 100% { opacity: 0; filter: blur(6px); } }
.hud { position: absolute; right: max(18px, env(safe-area-inset-right)); bottom: max(18px, env(safe-area-inset-bottom)); display: flex; gap: 8px; pointer-events: auto; }
.chip {
  appearance: none; cursor: pointer; padding: 8px 12px; border-radius: 999px; font: 500 11px/1 var(--font-sans); letter-spacing: .14em; text-transform: uppercase;
  color: var(--ink); background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.chip[aria-pressed='true'] { background: var(--active-bg); color: var(--active-ink); }
.hint { position: absolute; left: 50%; bottom: max(26px, env(safe-area-inset-bottom)); transform: translateX(-50%); font: 500 11px/1 var(--font-sans); letter-spacing: .24em; text-transform: uppercase; color: var(--ink-dim); animation: hint 14s ease forwards; white-space: nowrap; }
@keyframes hint { 0% { opacity: 0; } 10%, 80% { opacity: 1; } 100% { opacity: 0; } }
.dawn { position: absolute; inset: 0; background: radial-gradient(circle at 50% 60%, #fff6e6 0%, #ffd3a8 45%, rgba(255,200,160,0) 100%); animation: dawn 3.2s ease forwards; }
@keyframes dawn { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
@media (max-width: 560px) { .hud { left: 16px; right: 16px; justify-content: center; } .hint { bottom: 64px; } }
@media (prefers-reduced-motion: reduce) { .story, .dawn { animation-duration: .01s; animation-iteration-count: 1; } }
```

`src/ui/Ritual.module.css`:
```css
.ritual {
  position: absolute; inset: 0; display: grid; place-items: center; pointer-events: auto; padding: 16px;
  background: radial-gradient(90% 70% at 50% 40%, rgba(11,16,32,.15), rgba(11,16,32,.55));
}
.card { width: min(92vw, 520px); display: grid; gap: 18px; justify-items: center; text-align: center; }
.risen { font: 500 11px/1.4 var(--font-sans); letter-spacing: .24em; text-transform: uppercase; color: var(--ink-dim); }
.prompt { font: italic 400 clamp(34px, 6vw, 60px)/1 var(--font-serif), serif; color: #fff; text-shadow: 0 0 40px rgba(255,255,255,.3); }
.paper {
  width: 100%; aspect-ratio: 1.6; padding: 22px; border-radius: 4px; background: #f7f4ee; color: #2a2a33;
  box-shadow: 0 0 0 1px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.35), 0 0 70px -10px var(--glow);
  transform-origin: 50% 50%; transition: box-shadow .4s;
}
.paper textarea {
  width: 100%; height: 100%; resize: none; border: 0; outline: 0; background: transparent; text-align: center;
  font: italic 400 26px/1.35 var(--font-serif), serif; color: #2a2a33;
}
.folding { animation: fold 1.6s cubic-bezier(.6,.0,.2,1) forwards; }
@keyframes fold {
  0% { transform: none; }
  35% { transform: perspective(800px) rotateX(70deg) scale(.8); }
  60% { transform: perspective(800px) rotateX(70deg) rotateZ(45deg) scale(.35); opacity: 1; }
  100% { transform: perspective(800px) translateY(-70vh) rotateX(70deg) rotateZ(45deg) scale(.15); opacity: 0; }
}
.row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.choice {
  appearance: none; cursor: pointer; padding: 9px 14px; border-radius: 999px; font: 500 13px/1 var(--font-sans);
  color: var(--ink-dim); background: var(--glass); border: 1px solid var(--glass-border); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  display: inline-flex; gap: 8px; align-items: center;
}
.choice[aria-checked='true'] { background: var(--active-bg); color: var(--active-ink); }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 10px var(--c); }
.release {
  appearance: none; cursor: pointer; padding: 13px 30px; border: 0; border-radius: 999px; background: var(--active-bg); color: var(--active-ink);
  font: 600 12px/1 var(--font-sans); letter-spacing: .26em; text-transform: uppercase; box-shadow: 0 8px 30px rgba(0,0,0,.2);
}
.release:disabled { opacity: .5; }
.note { font: 400 12px/1 var(--font-sans); color: var(--ink-dim); }
```

`src/ui/Ritual.tsx`:
```tsx
'use client';
import { useState, type CSSProperties } from 'react';
import { FEET_PER_LOOP, KINDS, KIND_ORDER, type Fold, type Kind } from '@sitl/core';
import { setIntention } from '@/flight/intention';
import { useApp } from '@/state/store';
import styles from './Ritual.module.css';

const KIND_LABEL: Record<Kind, string> = { hope: 'Hope', release: 'Release', courage: 'Courage', love: 'Love', peace: 'Peace' };
const FOLD_LABEL: Record<Fold, string> = { dart: 'Dart', glider: 'Glider', crane: 'Crane', lanternwing: 'Lantern-wing', starkite: 'Star-kite' };

export function Ritual({ onRelease }: { onRelease?: () => void }) {
  const savedAlt = useApp((s) => s.savedAlt);
  const loop = useApp((s) => s.loop);
  const unlocked = useApp((s) => s.unlockedFolds);
  const [words, setWords] = useState('');
  const [kind, setKind] = useState<Kind>(useApp.getState().kind);
  const [fold, setFold] = useState<Fold>(unlocked[unlocked.length - 1] ?? 'dart');
  const [folding, setFolding] = useState(false);

  const release = () => {
    setIntention(words);
    setFolding(true);
    onRelease?.();
    window.setTimeout(() => {
      useApp.getState().release(kind, fold);
      setFolding(false);
      setWords('');
    }, 1600);
  };

  return (
    <div className={styles.ritual} data-ui>
      <div className={styles.card}>
        {savedAlt > 0 && (
          <p className={styles.risen}>
            You have risen {Math.floor(savedAlt * FEET_PER_LOOP).toLocaleString('en-US')} ft{loop > 0 ? ` · dawn ${loop + 1}` : ''}
          </p>
        )}
        <h2 className={styles.prompt}>What are you carrying up?</h2>
        <div className={`${styles.paper} ${folding ? styles.folding : ''}`} style={{ '--glow': KINDS[kind] } as CSSProperties}>
          <textarea
            value={words}
            maxLength={80}
            onChange={(e) => setWords(e.target.value)}
            placeholder="A few words, or nothing at all"
            aria-label="What you are carrying"
            disabled={folding}
          />
        </div>
        <div className={styles.row} role="radiogroup" aria-label="Kind of intention">
          {KIND_ORDER.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === kind} className={styles.choice} onClick={() => setKind(k)} style={{ '--c': KINDS[k] } as CSSProperties}>
              <span className={styles.dot} />{KIND_LABEL[k]}
            </button>
          ))}
        </div>
        {unlocked.length > 1 && (
          <div className={styles.row} role="radiogroup" aria-label="Fold">
            {unlocked.map((f) => (
              <button key={f} type="button" role="radio" aria-checked={f === fold} className={styles.choice} onClick={() => setFold(f)}>{FOLD_LABEL[f]}</button>
            ))}
          </div>
        )}
        <button type="button" className={styles.release} onClick={release} disabled={folding}>Let it go</button>
        <p className={styles.note}>Your words stay on this device.</p>
      </div>
    </div>
  );
}
```

`src/ui/StoryLine.tsx`:
```tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { StoryMemory } from '@/story/storyMemory';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function StoryLine() {
  const memory = useMemo(() => new StoryMemory(), []);
  const band = useApp((s) => s.band);
  const loop = useApp((s) => s.loop);
  const phase = useApp((s) => s.phase);
  const [line, setLine] = useState<{ key: string; text: string } | null>(null);

  useEffect(() => {
    if (phase !== 'flying') return;
    const text = memory.take(loop, band);
    if (text) setLine({ key: `${loop}:${band}`, text });
  }, [band, loop, phase, memory]);

  if (!line || phase === 'ritual') return null;
  return <p key={line.key} className={styles.story} onAnimationEnd={() => setLine(null)}>{line.text}</p>;
}
```

`src/ui/Hud.tsx`:
```tsx
'use client';
import { persistNow } from '@/profile/persist';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function Hud() {
  const settings = useApp((s) => s.settings);
  const phase = useApp((s) => s.phase);
  const loop = useApp((s) => s.loop);
  const toggle = (k: 'muted' | 'autoBreathe' | 'reducedMotion') => {
    const s = useApp.getState().settings;
    const next = k === 'muted' ? { muted: !s.muted }
      : k === 'autoBreathe' ? { autoBreathe: !s.autoBreathe }
      : { reducedMotion: !(s.reducedMotion ?? false) };
    useApp.getState().updateSettings(next);
    persistNow();
  };
  return (
    <>
      {phase === 'flying' && loop === 0 && <p className={styles.hint}>Hold to breathe in · release to glide</p>}
      <div className={styles.hud} data-ui>
        <button type="button" className={styles.chip} aria-pressed={!settings.muted} onClick={() => toggle('muted')}>{settings.muted ? 'Sound off' : 'Sound on'}</button>
        <button type="button" className={styles.chip} aria-pressed={settings.autoBreathe} onClick={() => toggle('autoBreathe')}>Auto-breathe</button>
        <button type="button" className={styles.chip} aria-pressed={settings.reducedMotion === true} onClick={() => toggle('reducedMotion')}>Calm motion</button>
      </div>
    </>
  );
}
```

`src/ui/DawnFlash.tsx`:
```tsx
'use client';
import { useApp } from '@/state/store';
import styles from './ui.module.css';

export function DawnFlash() {
  const dawnAt = useApp((s) => s.dawnAt);
  if (!dawnAt) return null;
  return <div key={dawnAt} className={styles.dawn} />;
}
```

`src/ui/Overlay.tsx`:
```tsx
'use client';
import { useApp } from '@/state/store';
import { DawnFlash } from './DawnFlash';
import { Hud } from './Hud';
import { Ritual } from './Ritual';
import { StoryLine } from './StoryLine';
import styles from './ui.module.css';

export function Overlay({ onRelease }: { onRelease?: () => void }) {
  const phase = useApp((s) => s.phase);
  return (
    <div className={styles.layer}>
      <StoryLine />
      {phase === 'ritual' && <Ritual onRelease={onRelease} />}
      <DawnFlash />
      <Hud />
    </div>
  );
}
```

Modify `src/world/Experience.tsx`:
1. Delete the `?skip` block added in Task 6, Step 5.
2. Add `import { Overlay } from '@/ui/Overlay';`.
3. Render `<Overlay />` as a sibling directly after `</Canvas>`, inside the wrapping `<div>`.

- [ ] **Step 6: Typecheck, test and walk the ritual**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Manual check at `/fly`:
1. The ritual card sits over the rainy rooftop. Typing works, Space types a space in the textarea rather than breathing, and choosing a kind recolors the paper's glow.
2. *Let it go* folds the paper away. The plane launches in its color and the hint appears.
3. About 4 s into the Ground band, "Everything heavy starts here." fades in and out.
4. The settings chips work and survive a reload.
5. At `?alt=0.995`, after breathing to the top: a warm flash, then the ritual again, now with a fold choice that includes Glider, and "You have risen 30,… ft · dawn 2".
6. In `localStorage` and in the Network tab, the typed words appear nowhere.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): ritual, story lines, dawn flash and settings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Generative audio

**Files:**
- Create: `src/audio/padParams.ts`, `src/audio/engine.ts`, `src/audio/AudioDriver.tsx`
- Modify: `src/world/Experience.tsx`
- Test: `test/padParams.test.ts`

**Interfaces:**
- Consumes: `bandIndexAt`, `live`, `useApp`.
- Produces:
  - `padParams.ts`: `CHORDS: number[][]`, `padParamsAt(loopAlt): { band: BandIndex; chord: number[]; cutoff: number; gain: number }`
  - `engine.ts`: `getEngine(): AmbientEngine`, with `start(): void` and `update(loopAlt, inhaling, steadiness, muted): void`
  - `AudioDriver`: a component inside the Canvas

- [ ] **Step 1: Write the failing test `test/padParams.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { CHORDS, padParamsAt } from '@/audio/padParams';

describe('padParamsAt', () => {
  it('has a chord of positive frequencies for every band', () => {
    expect(CHORDS).toHaveLength(5);
    for (const c of CHORDS) { expect(c.length).toBeGreaterThanOrEqual(3); c.forEach((f) => expect(f).toBeGreaterThan(20)); }
  });
  it('picks the band from loop altitude', () => {
    expect(padParamsAt(0.7).band).toBe(3);
    expect(padParamsAt(0.7).chord).toBe(CHORDS[3]);
  });
  it('The Quiet is the sparsest and softest', () => {
    expect(padParamsAt(0.7).gain).toBeLessThan(padParamsAt(0.45).gain);
    expect(padParamsAt(0.7).chord.length).toBeLessThan(padParamsAt(0.45).chord.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @sitl/web test`
Expected: FAIL with unresolved `@/audio/padParams`.

- [ ] **Step 3: Implement `src/audio/padParams.ts`**

```ts
import { bandIndexAt, type BandIndex } from '@sitl/core';

/** Hz. Ground A-minor, Fog F-add9, Above Cmaj7, Quiet open D (sparse), Stars Emaj7. */
export const CHORDS: number[][] = [
  [110, 164.81, 220, 261.63],
  [87.31, 130.81, 220, 329.63],
  [130.81, 196, 329.63, 493.88],
  [146.83, 220, 369.99],
  [164.81, 246.94, 415.3, 622.25],
];
const CUTOFF = [500, 700, 1400, 1100, 1800];
const GAIN = [0.16, 0.15, 0.18, 0.11, 0.15];

export function padParamsAt(loopAlt: number): { band: BandIndex; chord: number[]; cutoff: number; gain: number } {
  const band = bandIndexAt(loopAlt);
  return { band, chord: CHORDS[band]!, cutoff: CUTOFF[band]!, gain: GAIN[band]! };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @sitl/web test`
Expected: PASS.

- [ ] **Step 5: Implement the engine and driver, and wire up the gesture**

`src/audio/engine.ts`:
```ts
import { padParamsAt } from './padParams';

const VOICES = 4;

/** Generative pad + breath layer. Silent until start() runs inside a user gesture. */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private filter!: BiquadFilterNode;
  private oscs: OscillatorNode[] = [];
  private voiceGains: GainNode[] = [];
  private breathGain!: GainNode;
  private breathFilter!: BiquadFilterNode;
  private band = -1;

  start(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 600; this.filter.Q.value = 0.5; this.filter.connect(this.master);
      const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07; lfoGain.gain.value = 260; lfo.connect(lfoGain).connect(this.filter.frequency); lfo.start();
      for (let i = 0; i < VOICES; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? 'triangle' : 'sine'; o.detune.value = (i - 1.5) * 4; g.gain.value = 0;
        o.connect(g).connect(this.filter); o.start();
        this.oscs.push(o); this.voiceGains.push(g);
      }
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      this.breathFilter = ctx.createBiquadFilter(); this.breathFilter.type = 'bandpass'; this.breathFilter.Q.value = 0.7; this.breathFilter.frequency.value = 500;
      this.breathGain = ctx.createGain(); this.breathGain.gain.value = 0;
      noise.connect(this.breathFilter).connect(this.breathGain).connect(this.master); noise.start();
      this.ctx = ctx;
    } catch {
      this.ctx = null; // Audio unavailable: the experience continues silently.
    }
  }

  update(loopAlt: number, inhaling: boolean, steadiness: number, muted: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const p = padParamsAt(loopAlt);
    if (p.band !== this.band) {
      this.band = p.band;
      for (let i = 0; i < VOICES; i++) {
        const f = p.chord[i];
        if (f) this.oscs[i]!.frequency.setTargetAtTime(f, now, 1.5);
        this.voiceGains[i]!.gain.setTargetAtTime(f ? 0.25 : 0, now, 2);
      }
      this.filter.frequency.setTargetAtTime(p.cutoff, now, 3);
    }
    this.master.gain.setTargetAtTime(muted ? 0 : p.gain, now, 0.6);
    this.breathGain.gain.setTargetAtTime(inhaling ? 0.06 + 0.06 * steadiness : 0.015, now, inhaling ? 0.8 : 1.2);
    this.breathFilter.frequency.setTargetAtTime(inhaling ? 900 : 500, now, 0.8);
  }
}

let engine: AmbientEngine | null = null;
export const getEngine = () => (engine ??= new AmbientEngine());
```

`src/audio/AudioDriver.tsx`:
```tsx
'use client';
import { useFrame } from '@react-three/fiber';
import { live } from '@/flight/live';
import { useApp } from '@/state/store';
import { getEngine } from './engine';

export function AudioDriver() {
  useFrame(() => getEngine().update(live.loopAlt, live.inhaling, live.steadiness, useApp.getState().settings.muted));
  return null;
}
```

Modify `src/world/Experience.tsx`:
1. Add `import { AudioDriver } from '@/audio/AudioDriver';` and `import { getEngine } from '@/audio/engine';`.
2. Insert `<AudioDriver />` inside `<Canvas>` after `<ShootingStars />`.
3. Change the overlay to `<Overlay onRelease={() => getEngine().start()} />`, so audio starts inside the *Let it go* click gesture.

- [ ] **Step 6: Typecheck, test and listen**

Run: `pnpm --filter @sitl/web typecheck && pnpm --filter @sitl/web test`
Expected: PASS.

Manual check at `/fly`:
1. Silence until *Let it go*, then a soft pad fades in.
2. Holding to inhale brings in a gentle breath swell.
3. The chord shifts on entering each band. The Quiet is noticeably sparser.
4. *Sound off* fades everything out.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): generative ambient pad and breath layer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Verification, README and deploy readiness

**Files:**
- Create: `README.md`
- Modify: none, unless verification finds issues.

- [ ] **Step 1: Run the full automated suite**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: all core and web tests pass, typecheck reports 0 errors, and `next build` succeeds with routes `/` and `/fly`.

- [ ] **Step 2: Production smoke test**

Run: `pnpm --filter @sitl/web start`, then open `http://localhost:3000/`, click *Begin*, and complete the ritual.

Expected:
- No console errors.
- `?alt=` is ignored in production (the `NODE_ENV` guard).
- Steady breathing climbs. Rapid clicking flutters without losing altitude.
- After a reload you resume at your altitude following the ritual (the rising transition is visible).

- [ ] **Step 3: Mobile and performance check**

In Chrome DevTools device mode (iPhone 14 Pro, 4× CPU throttle):
- Touch-hold breathes and the plane steers toward your finger.
- A second finger doesn't release the breath early.
- Switching apps releases it.
- The frame rate settles (adaptive DPR) instead of stuttering.

On desktop, the Performance panel shows about 60 fps Above the Clouds.

- [ ] **Step 4: Write `README.md`**

```markdown
# Sky is the limit

A shared ritual: fold what you carry into a paper plane and breathe it upward. There is no top — only higher.

## Develop
    pnpm install
    pnpm dev            # http://localhost:3000
    pnpm test           # core + web unit tests
    pnpm typecheck
    pnpm build

Dev-only URL params on `/fly`: `?alt=2.45` starts at that lifetime altitude (loop 2, Above the Clouds).

## Structure
- `packages/core` — pure, tested logic: bands, breath/steadiness, lift.
- `apps/web` — Next.js app. `/fly` lazy-loads the React Three Fiber world in `src/world`.
- `legacy/v1.html` — the original single-file piece.
- Design: `docs/superpowers/specs/2026-10-09-sky-is-the-limit-design.md`

## Deploy (web)
Import the repo in Vercel and set **Root Directory** to `apps/web`. Vercel detects pnpm workspaces and Next.js automatically. Multiplayer (Plan 2) will add `NEXT_PUBLIC_SKY_URL`.

## Privacy
Your words never leave your device and are never stored. Progress (altitude, folds, settings) lives in this browser's localStorage.
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: README for development and deployment

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Spec coverage (self-review)

| Spec section | Task(s) |
|---|---|
| §2.1–2.2 Ritual, kinds/colors, private words | 4 (`intention.ts`, profile whitelist), 9 |
| §2.3 Bands, story lines, new dawn, folds, world elements per loop | 1, 5, 6, 8, 9 |
| §2.3 Ritual each session and dawn; resume with a ~4 s rise | 6 (launching phase), 9 |
| §2.4 Breath-sync shooting star | 8 (`queueShootingStar` seam). The event itself is Plan 2. |
| §2.4 Birds join; cloud parting | 8, 5 |
| §2.5 Sound | 10 |
| §3.1 Input, auto-breathe, reduced motion | 6, 9 |
| §3.2 Steadiness, flutter | 2 |
| §3.3 Lift, updraft (echoes half-weight), sync boost, monotonic altitude | 3, 6, 7 |
| §3.4 Guide ring rules; no numbers in flight | 6, 9 |
| §4.5 Seed echoes (~20 paths) used offline | 7 |
| §4.1–4.4, 4.6, 4.7 Server, protocol, shared total | **Plan 2** |
| §5 Device persistence | 4, 6 |
| §6 Structure, rendering rules, adaptive DPR, mobile clouds | 4, 5 |
| §7 Testing | Unit tests in 1–10. Server and e2e tests are Plan 2. |
