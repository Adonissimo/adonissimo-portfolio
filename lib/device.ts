/** A smaller effect budget for narrow screens and touch-first devices. */
export const compactEffectsQuery = '(max-width: 760px), (pointer: coarse)';

export function compactEffectsSnapshot(): boolean {
  return typeof window === 'undefined' || window.matchMedia(compactEffectsQuery).matches;
}

// Start with the small budget on the server, then reconcile after hydration.
export function serverCompactSnapshot(): boolean { return true; }

export function subscribeCompactEffects(notify: () => void): () => void {
  const media = window.matchMedia(compactEffectsQuery);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}
