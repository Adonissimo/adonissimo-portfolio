import type { MusicTrack } from './music.ts';

export type AudioStatus = 'unavailable' | 'paused' | 'loading' | 'playing' | 'error';
export type AudioSnapshot = Readonly<{
  available: boolean;
  status: AudioStatus;
  volume: number;
  muted: boolean;
  error: string | null;
}>;
export type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type AudioPort = {
  src: string;
  preload: string;
  loop: boolean;
  volume: number;
  muted: boolean;
  readonly paused: boolean;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
};

export const audioPreferenceKey = 'adonissimo-audio-preferences';

export function clampVolume(value: number, fallback = 0.22): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

export function validAudioPath(value: string): boolean {
  return /^\/audio\/[a-zA-Z0-9_-]+\.(mp3|ogg|m4a|wav)$/.test(value);
}

/** One persistent media element. No playback occurs until play() is called by a user action. */
export class BackgroundAudioPlayer {
  private track: MusicTrack;
  private audio: AudioPort | null = null;
  private storage: PreferenceStorage | undefined;
  private state: AudioSnapshot;
  private initialState: AudioSnapshot;
  private listeners = new Set<() => void>();
  private intent = 0;
  private wantsPlayback = false;
  private fadeTimer: ReturnType<typeof setInterval> | undefined;
  private removeEvents: (() => void) | undefined;
  private backgrounded = false;

  constructor(track: MusicTrack) {
    this.track = { ...track };
    const available = track.enabled && validAudioPath(track.src);
    const initial: AudioSnapshot = { available, status: available ? 'paused' : 'unavailable', volume: clampVolume(track.initialVolume), muted: false, error: null };
    this.state = Object.freeze(initial);
    this.initialState = this.state;
  }

  getSnapshot = (): AudioSnapshot => this.state;
  getServerSnapshot = (): AudioSnapshot => this.initialState;
  subscribe = (notify: () => void): (() => void) => { this.listeners.add(notify); return () => this.listeners.delete(notify); };

  private publish(patch: Partial<AudioSnapshot>): void {
    const next = { ...this.state, ...patch };
    if (next.available === this.state.available && next.status === this.state.status && next.volume === this.state.volume && next.muted === this.state.muted && next.error === this.state.error) return;
    this.state = Object.freeze(next);
    this.listeners.forEach(notify => notify());
  }

  private persist(): void {
    try { this.storage?.setItem(audioPreferenceKey, JSON.stringify({ volume: this.state.volume, muted: this.state.muted })); }
    catch { /* Audio still works when preference storage is blocked. */ }
  }

  private stopFade(): void { clearInterval(this.fadeTimer); this.fadeTimer = undefined; }

  private fadeIn(audio: AudioPort): void {
    this.stopFade();
    // Background tabs throttle timers. Finish a fade without relying on a future tick.
    if (this.backgrounded) { audio.volume = this.state.volume; return; }
    const began = Date.now();
    this.fadeTimer = setInterval(() => {
      if (this.audio !== audio || !this.wantsPlayback || audio.paused) { this.stopFade(); return; }
      const progress = Math.min(1, (Date.now() - began) / 900);
      audio.volume = this.state.volume * progress;
      if (progress === 1) this.stopFade();
    }, 40);
  }

  setBackgrounded = (hidden: boolean): void => {
    this.backgrounded = hidden;
    if (hidden && this.audio && this.wantsPlayback && !this.audio.paused) {
      this.stopFade();
      this.audio.volume = this.state.volume;
    }
    // Visibility never changes the user's play/pause intent.
  };

  attach(audio: AudioPort, storage?: PreferenceStorage): () => void {
    this.detach();
    this.audio = audio;
    this.storage = storage;
    let preferences: { volume?: unknown; muted?: unknown } = {};
    try {
      const saved: unknown = JSON.parse(storage?.getItem(audioPreferenceKey) || '{}');
      if (saved && typeof saved === 'object') preferences = saved as typeof preferences;
    } catch { /* Unreadable or invalid preferences use the quiet defaults. */ }
    this.publish({ volume: typeof preferences.volume === 'number' ? clampVolume(preferences.volume) : this.state.volume, muted: typeof preferences.muted === 'boolean' ? preferences.muted : this.state.muted });
    audio.preload = 'none';
    audio.loop = true;
    audio.volume = this.state.volume;
    audio.muted = this.state.muted;
    if (this.state.available) audio.src = this.track.src;
    const playing = () => {
      if (!this.wantsPlayback) { audio.pause(); return; }
      this.publish({ status: 'playing', error: null });
    };
    const paused = () => { this.stopFade(); this.publish({ status: this.state.available ? 'paused' : 'unavailable' }); };
    const waiting = () => { if (this.wantsPlayback && !audio.paused) this.publish({ status: 'loading' }); };
    const failed = () => {
      this.intent++;
      this.wantsPlayback = false;
      this.stopFade();
      this.publish({ status: 'error', error: 'The music could not load. You can continue without it.' });
    };
    audio.addEventListener('playing', playing);
    audio.addEventListener('pause', paused);
    audio.addEventListener('waiting', waiting);
    audio.addEventListener('error', failed);
    this.removeEvents = () => {
      audio.removeEventListener('playing', playing);
      audio.removeEventListener('pause', paused);
      audio.removeEventListener('waiting', waiting);
      audio.removeEventListener('error', failed);
    };
    return () => { if (this.audio === audio) this.detach(); };
  }

  detach(): void {
    this.intent++;
    this.wantsPlayback = false;
    this.stopFade();
    this.removeEvents?.();
    this.removeEvents = undefined;
    this.audio?.pause();
    this.audio = null;
    if (this.state.status !== 'unavailable') this.publish({ status: 'paused' });
  }

  play = (): Promise<boolean> => {
    const audio = this.audio;
    if (!this.state.available || !audio) return Promise.resolve(false);
    if (this.wantsPlayback && !audio.paused && this.state.status === 'playing') return Promise.resolve(true);
    const intent = ++this.intent;
    this.wantsPlayback = true;
    this.stopFade();
    audio.volume = 0;
    this.publish({ status: 'loading', error: null });
    let started: Promise<void>;
    // Keep the actual play() call inside the original click event, before any await/timer.
    try { started = audio.play(); }
    catch (error) { return Promise.resolve(this.playFailed(error, intent)); }
    return Promise.resolve(started).then(() => {
      if (intent !== this.intent || this.audio !== audio || !this.wantsPlayback) {
        if (!this.wantsPlayback) audio.pause();
        return false;
      }
      if (audio.paused) { this.publish({ status: 'paused' }); return false; }
      this.publish({ status: 'playing', error: null });
      this.fadeIn(audio);
      return true;
    }).catch(error => this.playFailed(error, intent));
  };

  private playFailed(error: unknown, intent: number): false {
    if (intent !== this.intent) return false;
    this.wantsPlayback = false;
    this.stopFade();
    const blocked = error instanceof Error && error.name === 'NotAllowedError';
    this.publish({ status: 'error', error: blocked ? 'Your browser paused the music. Press Play music to try again.' : 'The music could not load. You can continue without it.' });
    return false;
  }

  pause = (): void => {
    this.intent++;
    this.wantsPlayback = false;
    this.stopFade();
    this.audio?.pause();
    this.publish({ status: this.state.available ? 'paused' : 'unavailable' });
  };

  setVolume = (volume: number): void => {
    this.stopFade();
    const next = clampVolume(volume);
    this.publish({ volume: next, muted: next > 0 ? false : this.state.muted });
    if (this.audio) { this.audio.volume = next; this.audio.muted = this.state.muted; }
    this.persist();
  };

  setMuted = (muted: boolean): void => {
    this.stopFade();
    const volume = !muted && this.state.volume === 0 ? clampVolume(this.track.initialVolume) || 0.22 : this.state.volume;
    this.publish({ muted, volume });
    if (this.audio) { this.audio.muted = muted; this.audio.volume = volume; }
    this.persist();
  };
}
