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
