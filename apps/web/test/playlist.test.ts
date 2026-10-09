import { describe, expect, it } from 'vitest';
import { CROSSFADE_SECONDS, TRACKS, musicCutoff, nextTrack, shouldAdvance } from '@/audio/playlist';

describe('playlist', () => {
  it('lists the CC0 tracks with their source and licence', () => {
    expect(TRACKS.length).toBe(3);
    for (const t of TRACKS) {
      expect(t.src).toMatch(/^\/music\/.+\.mp3$/);
      expect(t.license).toBe('CC0 1.0');
      expect(t.credit).toContain('The Cynic Project');
    }
  });
  it('cycles through the tracks forever', () => {
    expect(nextTrack(0)).toBe(1);
    expect(nextTrack(TRACKS.length - 1)).toBe(0);
  });
  it('starts the crossfade just before a track ends', () => {
    expect(shouldAdvance(100, 160)).toBe(false);
    expect(shouldAdvance(160 - CROSSFADE_SECONDS + 0.1, 160)).toBe(true);
  });
  it('waits for a known duration', () => {
    expect(shouldAdvance(5, Number.NaN)).toBe(false);
    expect(shouldAdvance(5, Number.POSITIVE_INFINITY)).toBe(false);
  });
  it('muffles the music on the rooftop and opens it fully in the sky', () => {
    expect(musicCutoff(0)).toBeLessThan(1200);
    expect(musicCutoff(1)).toBeGreaterThanOrEqual(18000);
    expect(musicCutoff(0.5)).toBeGreaterThan(musicCutoff(0.2));
  });
});
