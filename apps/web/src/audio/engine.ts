import { padParamsAt } from './padParams';

const VOICES = 4;

/** Generative pad + breath layer. Silent until start() runs inside a user gesture. */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private filter!: BiquadFilterNode;
  private oscs: OscillatorNode[] = [];
  private voiceGains: GainNode[] = [];
  private breathGain!: GainNode;
  private breathFilter!: BiquadFilterNode;
  private band = -1;

  start(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 600; this.filter.Q.value = 0.5; this.filter.connect(this.master);
      const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07; lfoGain.gain.value = 260; lfo.connect(lfoGain).connect(this.filter.frequency); lfo.start();
      for (let i = 0; i < VOICES; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? 'triangle' : 'sine'; o.detune.value = (i - 1.5) * 4; g.gain.value = 0;
        o.connect(g).connect(this.filter); o.start();
        this.oscs.push(o); this.voiceGains.push(g);
      }
      const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      this.breathFilter = ctx.createBiquadFilter(); this.breathFilter.type = 'bandpass'; this.breathFilter.Q.value = 0.7; this.breathFilter.frequency.value = 500;
      this.breathGain = ctx.createGain(); this.breathGain.gain.value = 0;
      noise.connect(this.breathFilter).connect(this.breathGain).connect(this.master); noise.start();
      this.ctx = ctx;
    } catch {
      this.ctx = null; // Audio unavailable: the experience continues silently.
    }
  }

  update(loopAlt: number, inhaling: boolean, steadiness: number, muted: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const p = padParamsAt(loopAlt);
    if (p.band !== this.band) {
      this.band = p.band;
      for (let i = 0; i < VOICES; i++) {
        const f = p.chord[i];
        if (f) this.oscs[i]!.frequency.setTargetAtTime(f, now, 1.5);
        this.voiceGains[i]!.gain.setTargetAtTime(f ? 0.25 : 0, now, 2);
      }
      this.filter.frequency.setTargetAtTime(p.cutoff, now, 3);
    }
    this.master.gain.setTargetAtTime(muted ? 0 : p.gain, now, 0.6);
    this.breathGain.gain.setTargetAtTime(inhaling ? 0.06 + 0.06 * steadiness : 0.015, now, inhaling ? 0.8 : 1.2);
    this.breathFilter.frequency.setTargetAtTime(inhaling ? 900 : 500, now, 0.8);
  }
}

let engine: AmbientEngine | null = null;
export const getEngine = () => (engine ??= new AmbientEngine());
