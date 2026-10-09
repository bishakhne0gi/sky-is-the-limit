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
