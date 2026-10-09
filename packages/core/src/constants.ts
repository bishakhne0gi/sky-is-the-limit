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
