import { backdropForPath } from './realm-background.ts';

export const ambienceKey = 'adonissimo-ambience';
let memoryEnabled: boolean | undefined;
const listeners = new Set<() => void>();

export function ambienceSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  if (memoryEnabled !== undefined) return memoryEnabled;
  try { return localStorage.getItem(ambienceKey) !== 'paused'; }
  catch { return true; }
}

export function ambienceServerSnapshot(): boolean { return false; }

export function setAmbienceEnabled(enabled: boolean): void {
  memoryEnabled = enabled;
  try { localStorage.setItem(ambienceKey, enabled ? 'on' : 'paused'); } catch { /* Optional preference. */ }
  listeners.forEach(notify => notify());
}

export function subscribeAmbience(notify: () => void): () => void {
  listeners.add(notify);
  const stored = (event: StorageEvent) => {
    if (event.key === ambienceKey || event.key === null) { memoryEnabled = undefined; notify(); }
  };
  window.addEventListener('storage', stored);
  return () => { listeners.delete(notify); window.removeEventListener('storage', stored); };
}

export function visibleSnapshot(): boolean { return typeof document !== 'undefined' && document.visibilityState !== 'hidden'; }
export function subscribeVisibility(notify: () => void): () => void {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
}

export function atmosphereForPath(pathname: string | null) {
  const backdrop = backdropForPath(pathname);
  return { environment: backdrop?.scene ?? 'neutral', quiet: backdrop?.quiet ?? true };
}

// Fixed values keep SSR and hydration identical. Negative delays place particles
// in flight immediately instead of making the visitor wait for the first leaf.
export const ambientParticles = Object.freeze(Array.from({ length: 32 }, (_, index) => {
  const duration = 12 + (index * 7 % 13);
  return Object.freeze({
    left: 4 + (index * 37 % 92),
    duration,
    delay: -(index * 1.7 % duration),
    drift: (index % 2 ? -1 : 1) * (28 + index * 11 % 65),
    turn: (index % 2 ? -1 : 1) * (180 + index * 23 % 280),
    size: 7 + index * 5 % 9,
    kind: index % 3 === 0 ? 'mote' : 'leaf'
  });
}));
