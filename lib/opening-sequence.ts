import { welcomeExitDuration } from './motion.ts';

export type OpeningPhase = 'prologue' | 'title' | 'welcome' | 'entry' | 'arrival' | 'complete';
export const prologueDuration = 5600;
export const titleRevealDuration = 800;
export const entrySceneDuration = 3200;
export const imageWarmupLimit = 1200;

type OpeningClock = {
  now(): number;
  schedule(callback: () => void, delay: number): ReturnType<typeof setTimeout>;
  cancel(timer: ReturnType<typeof setTimeout>): void;
};
const browserClock: OpeningClock = {
  now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: timer => clearTimeout(timer)
};

/** Pausable film clock. Asset loading and CSS animation events never gate entry. */
export class OpeningSequence {
  private phase: OpeningPhase;
  private fullMotion: boolean;
  private active = false;
  private remaining: number;
  private started = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private listeners = new Set<() => void>();
  private readonly clock: OpeningClock;

  constructor(fullMotion = true, clock: OpeningClock = browserClock) {
    this.clock = clock;
    this.fullMotion = fullMotion;
    this.phase = fullMotion ? 'prologue' : 'welcome';
    this.remaining = fullMotion ? prologueDuration : 0;
  }

  getSnapshot = (): OpeningPhase => this.phase;
  subscribe = (notify: () => void): (() => void) => {
    this.listeners.add(notify);
    return () => this.listeners.delete(notify);
  };

  private cancel(): void {
    this.generation++;
    if (this.timer !== undefined) this.clock.cancel(this.timer);
    this.timer = undefined;
  }

  private arm(): void {
    if (!this.active || this.remaining <= 0 || this.timer !== undefined) return;
    const generation = this.generation;
    this.started = this.clock.now();
    this.timer = this.clock.schedule(() => {
      if (generation !== this.generation || !this.active) return;
      this.timer = undefined;
      this.move(this.phase === 'prologue' ? 'title' : this.phase === 'title' ? 'welcome' : this.phase === 'entry' ? 'arrival' : 'complete');
    }, this.remaining);
  }

  private move(phase: OpeningPhase): void {
    this.cancel();
    if (phase === this.phase) return;
    this.phase = phase;
    this.remaining = phase === 'prologue' ? prologueDuration : phase === 'title' ? titleRevealDuration : phase === 'entry' ? entrySceneDuration : phase === 'arrival' ? welcomeExitDuration : 0;
    this.arm();
    this.listeners.forEach(notify => notify());
  }

  setActive(active: boolean): void {
    if (active === this.active) return;
    if (this.timer !== undefined) {
      this.remaining = Math.max(1, this.remaining - Math.max(0, this.clock.now() - this.started));
      this.cancel();
    }
    this.active = active;
    this.arm();
  }

  setFullMotion(fullMotion: boolean): void {
    this.fullMotion = fullMotion;
    if (fullMotion) return;
    if (this.phase === 'prologue' || this.phase === 'title') this.move('welcome');
    else if (this.phase === 'entry' || this.phase === 'arrival') this.move('complete');
  }

  enter(): void {
    if (this.phase === 'welcome' || this.phase === 'title') this.move(this.fullMotion ? 'entry' : 'complete');
  }

  skip(): void {
    if (this.phase !== 'complete') this.move(this.phase === 'prologue' || this.phase === 'title' ? 'welcome' : 'complete');
  }
}
