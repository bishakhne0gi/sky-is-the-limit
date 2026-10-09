/** World Y of the camera on the rooftop, at cruise, and the cloud deck it climbs through. */
export const ROOFTOP_Y = -70;
export const CRUISE_Y = 12;
export const CLOUD_DECK = { bottom: -11, top: 30 } as const;
export const LAUNCH_SECONDS = 6;

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Camera height through the launch: a slow lift-off, a steady climb through the deck, a gentle arrival. */
export function launchCameraY(k: number): number {
  const t = clamp01(k);
  const e = t * t * (3 - 2 * t);
  return ROOFTOP_Y + (CRUISE_Y - ROOFTOP_Y) * e;
}

/** 0 = rooftop look, 1 = sky look; the switch happens while the camera is inside the deck. */
export function launchBlend(k: number): number {
  return smoothstep(0.35, 0.8, clamp01(k));
}

/** How far inside the cloud deck the camera is (0 outside, ~1 in the middle). Drives the whiteout fog. */
export function insideDeck(camY: number): number {
  return smoothstep(CLOUD_DECK.bottom - 6, CLOUD_DECK.bottom + 4, camY) * smoothstep(12, 4, camY);
}
