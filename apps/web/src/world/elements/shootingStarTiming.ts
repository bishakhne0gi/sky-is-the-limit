import { elementsForLoop } from '@sitl/core';

/** Seconds between ambient stars, or null when they should not appear. */
export function ambientInterval(loop: number, starsWeight: number): number | null {
  if (starsWeight < 0.1) return null;
  return elementsForLoop(loop).moreShootingStars ? 3.5 : 9;
}
