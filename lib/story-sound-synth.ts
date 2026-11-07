import type { SoundCue, SoundOutput } from './sound-effects.ts';

type Voice = { sources: AudioScheduledSourceNode[]; nodes: AudioNode[]; timer?: ReturnType<typeof setTimeout> };
type Note = readonly [pitch: number, offset: number, duration: number, level: number, type?: OscillatorType];
type Score = { notes: readonly Note[]; paper?: 'forward' | 'backward' | 'index'; duration: number };

/** Distinct original motifs, with short bounded envelopes rather than sampled game SFX. */
const scores: Record<SoundCue, Score> = {
  select: { notes: [[783.99, 0, 0.13, 0.19], [1174.66, 0.035, 0.14, 0.075]], duration: 260 },
  page: { paper: 'forward', notes: [[523.25, .04, .3, .07], [783.99, .11, .34, .06], [1046.5, .2, .4, .045]], duration: 760 },
  open: { paper: 'forward', notes: [[261.63, 0, 0.6, 0.13, 'triangle'], [392, 0.075, 0.6, 0.13, 'triangle'], [523.25, 0.15, 0.6, 0.13, 'triangle'], [783.99, 0.225, 0.6, 0.13, 'triangle']], duration: 960 },
  magic: { notes: [[523.25, 0, 0.4, 0.12], [659.25, 0.045, 0.4, 0.12], [987.77, 0.09, 0.4, 0.12]], duration: 600 },
  'page-back': { paper: 'backward', notes: [[783.99, .03, .3, .065], [587.33, .1, .3, .055], [392, .18, .35, .05, 'triangle']], duration: 700 },
  'menu-open': { notes: [[392, 0, 0.15, 0.13, 'triangle'], [587.33, 0.055, 0.2, 0.11, 'triangle']], duration: 350 },
  'menu-close': { notes: [[587.33, 0, 0.12, 0.12, 'triangle'], [349.23, 0.05, 0.17, 0.1, 'triangle']], duration: 320 },
  quest: { paper: 'forward', notes: [[293.66, 0.03, 0.45, 0.13, 'triangle'], [440, 0.1, 0.4, 0.1, 'triangle'], [587.33, 0.18, 0.4, 0.11]], duration: 700 },
  return: { paper: 'backward', notes: [[392, 0.04, 0.32, 0.1], [293.66, 0.12, 0.34, 0.12, 'triangle']], duration: 600 },
  filter: { paper: 'index', notes: [[1046.5, 0.015, 0.075, 0.07]], duration: 340 },
  inventory: { notes: [[1318.51, 0, 0.18, 0.1], [1760, 0.045, 0.18, 0.08], [2093, 0.085, 0.24, 0.06]], duration: 450 },
  contact: { paper: 'index', notes: [[440, 0.025, 0.3, 0.1, 'triangle'], [659.25, 0.1, 0.35, 0.09]], duration: 570 },
  discover: { notes: [[329.63, 0, 0.38, 0.1], [493.88, 0.055, 0.4, 0.1], [659.25, 0.12, 0.42, 0.09], [987.77, 0.2, 0.45, 0.07]], duration: 780 },
  home: { notes: [[261.63, 0, 0.45, 0.12, 'triangle'], [392, 0.025, 0.42, 0.09, 'triangle'], [523.25, 0.09, 0.4, 0.09]], duration: 610 },
  bookmark: { paper: 'index', notes: [[698.46, 0.05, 0.2, 0.1, 'triangle']], duration: 360 },
  external: { notes: [[659.25, 0, 0.14, 0.13, 'triangle'], [1318.51, 0.06, 0.22, 0.08]], duration: 400 },
  'toggle-on': { notes: [[659.25, 0, 0.12, 0.11], [987.77, 0.04, 0.18, 0.09]], duration: 310 },
  'toggle-off': { notes: [[659.25, 0, 0.1, 0.1], [440, 0.035, 0.15, 0.09]], duration: 280 }
};

/** Original, short procedural cues: paper, harp and fairy bells. No game audio or requests. */
export class StorySoundSynth implements SoundOutput {
  private context: AudioContext;
  private master: GainNode;
  private limiter: DynamicsCompressorNode;
  private papers = new Map<'forward' | 'backward' | 'index', AudioBuffer>();
  private voices = new Set<Voice>();
  private epoch = 0;
  private disposed = false;

  constructor(context: AudioContext = new AudioContext({ latencyHint: 'interactive' })) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -16;
    this.limiter.knee.value = 18;
    this.limiter.ratio.value = 5;
    this.limiter.attack.value = 0.004;
    this.limiter.release.value = 0.12;
    this.master.connect(this.limiter);
    this.limiter.connect(context.destination);
  }

  async play(cue: SoundCue, volume: number): Promise<boolean> {
    if (this.disposed || this.context.state === 'closed') return false;
    const epoch = this.epoch;
    // Called before the first await; iOS/Chrome can unlock in the actual user gesture.
    if (this.context.state !== 'running') await this.context.resume();
    if (this.disposed || epoch !== this.epoch || this.context.state !== 'running') return false;
    while (this.voices.size >= 3) this.release(this.voices.values().next().value!);
    const voice: Voice = { sources: [], nodes: [] };
    this.voices.add(voice);
    const now = this.context.currentTime + 0.008;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.65, now, 0.008);
    try {
      const score = scores[cue];
      if (score.paper) this.rustle(voice, now, score.paper);
      score.notes.forEach(([pitch, offset, duration, level, type]) => this.note(voice, now + offset, pitch, duration, level, type ?? 'sine'));
      voice.timer = setTimeout(() => this.release(voice), score.duration);
      return true;
    } catch {
      this.release(voice);
      return false;
    }
  }

  private note(voice: Voice, at: number, pitch: number, duration: number, level: number, type: OscillatorType): void {
    const tone = this.context.createOscillator();
    const gain = this.context.createGain();
    voice.sources.push(tone);
    voice.nodes.push(tone, gain);
    tone.type = type;
    tone.frequency.setValueAtTime(pitch, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    tone.connect(gain);
    gain.connect(this.master);
    tone.start(at);
    tone.stop(at + duration + 0.015);
  }

  private rustle(voice: Voice, at: number, kind: 'forward' | 'backward' | 'index'): void {
    const duration = kind === 'index' ? 0.18 : 0.44;
    let paper = this.papers.get(kind);
    if (!paper) {
      const rate = this.context.sampleRate;
      paper = this.context.createBuffer(1, Math.ceil(rate * duration), rate);
      const samples = paper.getChannelData(0);
      let seed = kind === 'backward' ? 43019 : kind === 'index' ? 7927 : 91357;
      for (let i = 0; i < samples.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        const noise = (seed >>> 0) / 2147483648 - 1;
        samples[i] = noise * (0.6 + 0.4 * Math.sin(i / rate * Math.PI * 31));
      }
      this.papers.set(kind, paper);
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    voice.sources.push(source);
    voice.nodes.push(source, filter, gain);
    source.buffer = paper;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(kind === 'backward' ? 700 : kind === 'index' ? 2200 : 1500, at);
    filter.frequency.exponentialRampToValueAtTime(kind === 'backward' ? 1500 : 700, at + duration * 0.91);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.18, at + duration * 0.057);
    gain.gain.linearRampToValueAtTime(kind === 'index' ? 0.28 : 0.45, at + duration * (kind === 'backward' ? 0.58 : 0.25));
    gain.gain.linearRampToValueAtTime(0.12, at + duration * 0.72);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(at);
    source.stop(at + duration);
  }

  private release(voice: Voice): void {
    clearTimeout(voice.timer);
    voice.sources.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } });
    voice.nodes.forEach(node => node.disconnect());
    this.voices.delete(voice);
  }

  stop(): void {
    this.epoch++;
    this.voices.forEach(voice => this.release(voice));
    if (!this.disposed && this.context.state !== 'closed') void this.context.suspend().catch(() => undefined);
  }

  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    this.master.disconnect();
    this.limiter.disconnect();
    this.papers.clear();
    if (this.context.state !== 'closed') void this.context.close().catch(() => undefined);
  }
}
