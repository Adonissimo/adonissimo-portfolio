import { clampVolume, type PreferenceStorage } from './audio-player.ts';

export const soundCollection = [
  { cue: 'select', label: 'Fairy chime', priority: 1, gap: 80 },
  { cue: 'page', label: 'Enchanted page turn', priority: 3, gap: 180 },
  { cue: 'open', label: 'Book opens', priority: 4, gap: 120 },
  { cue: 'magic', label: 'Magic bells', priority: 2, gap: 120 },
  { cue: 'page-back', label: 'Page back', priority: 3, gap: 180 },
  { cue: 'menu-open', label: 'Menu opens', priority: 2, gap: 100 },
  { cue: 'menu-close', label: 'Menu closes', priority: 2, gap: 100 },
  { cue: 'quest', label: 'Quest begins', priority: 3, gap: 180 },
  { cue: 'return', label: 'Journal return', priority: 3, gap: 180 },
  { cue: 'filter', label: 'Index leaf', priority: 3, gap: 150 },
  { cue: 'inventory', label: 'Rupee chime', priority: 2, gap: 140 },
  { cue: 'contact', label: 'Letter seal', priority: 2, gap: 150 },
  { cue: 'discover', label: 'Shrine awakens', priority: 3, gap: 180 },
  { cue: 'home', label: 'Homecoming', priority: 2, gap: 160 },
  { cue: 'bookmark', label: 'Bookmark', priority: 2, gap: 140 },
  { cue: 'external', label: 'Link flourish', priority: 2, gap: 140 },
  { cue: 'toggle-on', label: 'Rune awakens', priority: 2, gap: 100 },
  { cue: 'toggle-off', label: 'Rune rests', priority: 2, gap: 100 }
] as const;
export type SoundCue = typeof soundCollection[number]['cue'];
export type SoundOutput = {
  play(cue: SoundCue, volume: number): Promise<boolean>;
  stop(): void;
  dispose(): void;
};
export type SoundSnapshot = Readonly<{
  available: boolean;
  enabled: boolean;
  volume: number;
  status: 'ready' | 'blocked' | 'unavailable';
}>;
export const soundPreferenceKey = 'adonissimo-sound-effects';
export const initialEffectsVolume = 0.35;

/** Route transitions get intentional paper/magic cues; other controls retain variation. */
export function navigationCue(href: string, currentUrl: string): SoundCue | null {
  try {
    const target = new URL(href, currentUrl);
    const current = new URL(currentUrl);
    if (!['https:', 'http:'].includes(target.protocol) || target.origin !== current.origin ||
      (target.pathname === current.pathname && target.search === current.search)) return null;
    if (target.pathname === '/') return 'return';
    if (current.pathname.startsWith(`${target.pathname.replace(/\/+$/, '')}/`)) return 'page-back';
    if (target.pathname === '/contact') return 'contact';
    if (target.pathname.startsWith('/projects/')) return 'quest';
    return 'page';
  } catch { return null; }
}

/** Semantic feedback, shared by mouse, touch and keyboard activation. */
export function interactionCue({ explicit, disabled, selected, href, currentUrl }: {
  explicit?: string;
  disabled?: boolean;
  selected?: boolean;
  href?: string;
  currentUrl: string;
}): SoundCue | null {
  if (disabled || selected || explicit === 'none') return null;
  const override = soundCollection.find(sound => sound.cue === explicit);
  if (override) return override.cue;
  if (!href) return 'select';
  try {
    const target = new URL(href, currentUrl);
    const current = new URL(currentUrl);
    if (target.href === current.href) return null;
    if (target.protocol === 'mailto:') return 'contact';
    if (target.protocol !== 'https:' && target.protocol !== 'http:') return null;
    if (target.origin !== current.origin) return 'external';
    if (target.pathname === '/' && current.pathname !== '/') return 'return';
    if (target.pathname.startsWith('/projects/') && target.pathname !== current.pathname) return 'quest';
    const sections: Record<string, SoundCue> = { '#inventory': 'inventory', '#about': 'bookmark', '#contact': 'contact', '#home': 'home' };
    return sections[target.hash] ?? 'page';
  } catch { return null; }
}

/** Preferences and burst protection. Creating/attaching this store never starts audio. */
export class SoundEffectsPlayer {
  private readonly initialState: SoundSnapshot = Object.freeze({ available: false, enabled: true, volume: initialEffectsVolume, status: 'ready' });
  private state = this.initialState;
  private listeners = new Set<() => void>();
  private factory: (() => SoundOutput) | undefined;
  private output: SoundOutput | undefined;
  private storage: PreferenceStorage | undefined;
  private epoch = 0;
  private request = 0;
  private lastAt = -Infinity;
  private lastPriority = 0;
  private clock: () => number;
  private random: () => number;
  private remaining: SoundCue[] = [];
  private previousInteraction: SoundCue | undefined;

  constructor(clock: () => number = () => performance.now(), random: () => number = Math.random) { this.clock = clock; this.random = random; }

  getSnapshot = (): SoundSnapshot => this.state;
  getServerSnapshot = (): SoundSnapshot => this.initialState;
  subscribe = (notify: () => void): (() => void) => { this.listeners.add(notify); return () => this.listeners.delete(notify); };

  private publish(patch: Partial<SoundSnapshot>): void {
    const next = { ...this.state, ...patch };
    if (next.available === this.state.available && next.enabled === this.state.enabled && next.volume === this.state.volume && next.status === this.state.status) return;
    this.state = Object.freeze(next);
    this.listeners.forEach(notify => notify());
  }

  private persist(): void {
    try { this.storage?.setItem(soundPreferenceKey, JSON.stringify({ enabled: this.state.enabled, volume: this.state.volume })); }
    catch { /* A blocked preference store must never prevent entry or navigation. */ }
  }

  attach(factory?: () => SoundOutput, storage?: PreferenceStorage): () => void {
    this.detach();
    this.factory = factory;
    this.storage = storage;
    let saved: { enabled?: unknown; volume?: unknown } = {};
    try {
      const value: unknown = JSON.parse(storage?.getItem(soundPreferenceKey) || '{}');
      if (value && typeof value === 'object') saved = value as typeof saved;
    } catch { /* Use the quiet defaults for malformed or unavailable preferences. */ }
    this.publish({ available: Boolean(factory), status: factory ? 'ready' : 'unavailable', enabled: typeof saved.enabled === 'boolean' ? saved.enabled : this.state.enabled, volume: typeof saved.volume === 'number' ? clampVolume(saved.volume, initialEffectsVolume) : this.state.volume });
    return () => this.detach();
  }

  detach(): void {
    this.stop();
    this.output?.dispose();
    this.output = undefined;
    this.factory = undefined;
    this.storage = undefined;
    this.publish({ available: false, status: 'unavailable' });
  }

  stop(): void {
    this.epoch++;
    this.lastAt = -Infinity;
    this.output?.stop();
  }

  setEnabled(enabled: boolean): void {
    if (!enabled) this.stop();
    this.publish({ enabled, volume: enabled && this.state.volume === 0 ? initialEffectsVolume : this.state.volume });
    this.persist();
  }

  setVolume(volume: number): void {
    this.stop();
    this.publish({ volume: clampVolume(volume, initialEffectsVolume) });
    this.persist();
  }

  /** Automatic site-wide variation: draw every cue before refilling, with no adjacent repeats. */
  playInteraction = (): Promise<boolean> => {
    if (!this.factory || !this.state.enabled || this.state.volume === 0 || this.clock() - this.lastAt < 180) return Promise.resolve(false);
    if (!this.remaining.length) this.remaining = soundCollection.map(sound => sound.cue);
    const candidates = this.remaining.filter(cue => cue !== this.previousInteraction);
    const sample = clampVolume(this.random(), 0);
    const cue = candidates[Math.min(candidates.length - 1, Math.floor(sample * candidates.length))];
    this.remaining.splice(this.remaining.indexOf(cue), 1);
    this.previousInteraction = cue;
    // play() is called synchronously so browser activation is preserved.
    return this.play(cue);
  };

  /** Call directly from the activation handler so Web Audio can resume in that gesture. */
  async play(cue: SoundCue): Promise<boolean> {
    if (!this.factory || !this.state.enabled || this.state.volume === 0) return false;
    const now = this.clock();
    const sound = soundCollection.find(sound => sound.cue === cue);
    if (!sound) return false;
    const { priority, gap } = sound;
    if (now - this.lastAt < gap && priority <= this.lastPriority) return false;
    this.lastAt = now;
    this.lastPriority = priority;
    const epoch = this.epoch;
    const request = ++this.request;
    try {
      const output = this.output ??= this.factory();
      // No await before output.play(): context creation/resume stays inside the click.
      const played = await output.play(cue, this.state.volume);
      if (epoch !== this.epoch || output !== this.output) return false;
      if (request === this.request) this.publish({ status: played ? 'ready' : 'blocked' });
      return played;
    } catch {
      if (epoch === this.epoch && request === this.request) this.publish({ status: 'blocked' });
      return false;
    }
  }
}
