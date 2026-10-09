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

/** Largest simulation step in seconds; protects against tab-resume frame spikes. */
export const MAX_DT = 0.1;
