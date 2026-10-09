/** Seconds between ambient shooting stars for a given star brightness, or null when there are none. */
export function ambientInterval(stars: number): number | null {
  return stars < 0.1 ? null : 6;
}
