/** Calm, beat-free ambient tracks, all CC0 (public domain) from OpenGameArt. */
export const TRACKS = [
  { src: '/music/calm-ambient-1.mp3', title: 'Calm Ambient 1 (Synthwave 4k)', credit: 'The Cynic Project / cynicmusic.com / pixelsphere.org', license: 'CC0 1.0', url: 'https://opengameart.org/content/calm-ambient-1-synthwave-4k' },
  { src: '/music/calm-relax-1.mp3', title: 'Calm Relax 1 (Synthwave 421k)', credit: 'The Cynic Project / cynicmusic.com / pixelsphere.org', license: 'CC0 1.0', url: 'https://opengameart.org/content/calm-relax-1-synthwave-421k' },
  { src: '/music/calm-ambient-3.mp3', title: 'Calm Ambient 3 (Lifewave 2k)', credit: 'The Cynic Project / cynicmusic.com / pixelsphere.org', license: 'CC0 1.0', url: 'https://opengameart.org/content/calm-ambient-3-lifewave-2k' },
] as const;

export const CROSSFADE_SECONDS = 8;

export const nextTrack = (i: number) => (i + 1) % TRACKS.length;

/** True once the playing track is within the crossfade window of its end. */
export function shouldAdvance(currentTime: number, duration: number): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return duration - currentTime <= CROSSFADE_SECONDS;
}

/** Low-pass cutoff (Hz): heard through the rain on the rooftop, fully open above the clouds. */
export function musicCutoff(skyWeight: number): number {
  const k = Number.isFinite(skyWeight) ? Math.min(1, Math.max(0, skyWeight)) : 0;
  return 900 * Math.pow(20000 / 900, k);
}
