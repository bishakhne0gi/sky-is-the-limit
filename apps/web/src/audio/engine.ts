import { padFor, type PadKey } from './padParams';

const VOICES = 4;

/** v1 wind (rises with speed) + a soft generative pad per time of day. Silent until start() runs in a user gesture. */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padFilter!: BiquadFilterNode;
  private oscs: OscillatorNode[] = [];
  private voiceGains: GainNode[] = [];
  private padGain!: GainNode;
  private windGain!: GainNode;
  private windFilter!: BiquadFilterNode;
  private key: PadKey | null = null;

  get started(): boolean { return this.ctx !== null; }

  start(): void {
    if (this.ctx) { this.resume(); return; }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);

      this.padGain = ctx.createGain(); this.padGain.gain.value = 0; this.padGain.connect(this.master);
      this.padFilter = ctx.createBiquadFilter(); this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 600; this.padFilter.Q.value = 0.5;
      this.padFilter.connect(this.padGain);
      const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07; lfoGain.gain.value = 260; lfo.connect(lfoGain).connect(this.padFilter.frequency); lfo.start();
      for (let i = 0; i < VOICES; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? 'triangle' : 'sine'; o.detune.value = (i - 1.5) * 4; g.gain.value = 0;
        o.connect(g).connect(this.padFilter); o.start();
        this.oscs.push(o); this.voiceGains.push(g);
      }

      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'bandpass'; this.windFilter.Q.value = 0.6; this.windFilter.frequency.value = 420;
      this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
      noise.connect(this.windFilter).connect(this.windGain).connect(this.master); noise.start();
      this.ctx = ctx;
    } catch {
      this.ctx = null; // Audio unavailable: the experience continues silently.
    }
  }

  resume(): void { if (this.ctx && this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined); }
  suspend(): void { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined); }

  update(key: PadKey, speed: number, muted: boolean, t: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const p = padFor(key);
    if (key !== this.key) {
      this.key = key;
      for (let i = 0; i < VOICES; i++) {
        const f = p.chord[i];
        if (f) this.oscs[i]!.frequency.setTargetAtTime(f, now, 1.5);
        this.voiceGains[i]!.gain.setTargetAtTime(f ? 0.25 : 0, now, 2);
      }
      this.padFilter.frequency.setTargetAtTime(p.cutoff, now, 3);
      this.padGain.gain.setTargetAtTime(p.gain, now, 2);
    }
    const boost = Math.min(1, Math.max(0, (speed - 38) / 77));
    this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.6);
    this.windGain.gain.setTargetAtTime(0.05 + boost * 0.09, now, 0.3);
    this.windFilter.frequency.setTargetAtTime(320 + speed * 5 + Math.sin(t * 0.4) * 120, now, 0.3);
  }
}

let engine: AmbientEngine | null = null;
export const getEngine = () => (engine ??= new AmbientEngine());
