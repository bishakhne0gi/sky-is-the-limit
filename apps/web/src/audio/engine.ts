import { CROSSFADE_SECONDS, TRACKS, musicCutoff, nextTrack, shouldAdvance } from './playlist';

interface Deck { el: HTMLAudioElement; gain: GainNode; track: number }

const MUSIC_LEVEL = 0.8;
const FADE_IN_SECONDS = 4;

/** Calm CC0 ambient music on two crossfading decks, plus soft wind that rises with speed. Silent until start() runs in a user gesture. */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private decks: Deck[] = [];
  private active = 0;
  private advancing = false;
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;

  start(): void {
    if (this.ctx) { this.resume(); return; }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);

      this.musicFilter = ctx.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = musicCutoff(0); this.musicFilter.Q.value = 0.4;
      this.musicFilter.connect(this.master);
      this.decks = [0, 1].map(() => {
        const el = new Audio();
        el.preload = 'auto';
        const gain = ctx.createGain(); gain.gain.value = 0;
        ctx.createMediaElementSource(el).connect(gain).connect(this.musicFilter);
        return { el, gain, track: -1 };
      });

      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'bandpass'; this.windFilter.Q.value = 0.6; this.windFilter.frequency.value = 420;
      this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
      noise.connect(this.windFilter).connect(this.windGain).connect(this.master); noise.start();

      this.ctx = ctx;
      this.play(0, 0, FADE_IN_SECONDS);
    } catch {
      this.ctx = null; // Audio unavailable: the experience continues silently.
    }
  }

  /** Load `track` on `deck` and fade it in over `fade` seconds. */
  private play(deck: number, track: number, fade: number): void {
    const ctx = this.ctx!;
    const d = this.decks[deck]!;
    d.track = track;
    d.el.src = TRACKS[track]!.src;
    d.el.currentTime = 0;
    const now = ctx.currentTime;
    d.gain.gain.cancelScheduledValues(now);
    d.gain.gain.setValueAtTime(0, now);
    d.gain.gain.linearRampToValueAtTime(MUSIC_LEVEL, now + fade);
    void d.el.play().catch(() => undefined);
    this.active = deck;
  }

  private crossfade(): void {
    const ctx = this.ctx!;
    const from = this.decks[this.active]!;
    const now = ctx.currentTime;
    from.gain.gain.cancelScheduledValues(now);
    from.gain.gain.setValueAtTime(from.gain.gain.value, now);
    from.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_SECONDS);
    this.advancing = true;
    window.setTimeout(() => { from.el.pause(); this.advancing = false; }, CROSSFADE_SECONDS * 1000 + 250);
    this.play(1 - this.active, nextTrack(from.track), CROSSFADE_SECONDS);
  }

  resume(): void {
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined);
    const d = this.decks[this.active];
    if (d && d.el.paused && d.track >= 0) void d.el.play().catch(() => undefined);
  }

  suspend(): void {
    if (!this.ctx) return;
    for (const d of this.decks) d.el.pause();
    if (this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined);
  }

  update(skyWeight: number, speed: number, muted: boolean, t: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const cur = this.decks[this.active]!;
    if (!this.advancing && shouldAdvance(cur.el.currentTime, cur.el.duration)) this.crossfade();
    this.musicFilter.frequency.setTargetAtTime(musicCutoff(skyWeight), now, 0.8);
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.6);
    const boost = Math.min(1, Math.max(0, (speed - 38) / 77));
    this.windGain.gain.setTargetAtTime(0.02 + boost * 0.06, now, 0.4);
    this.windFilter.frequency.setTargetAtTime(320 + speed * 4 + Math.sin(t * 0.4) * 100, now, 0.4);
  }
}

let engine: AmbientEngine | null = null;
export const getEngine = () => (engine ??= new AmbientEngine());
