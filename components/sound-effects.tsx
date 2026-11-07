'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { PreferenceStorage } from '@/lib/audio-player';
import { interactionCue, navigationCue, SoundEffectsPlayer } from '@/lib/sound-effects';
import { StorySoundSynth } from '@/lib/story-sound-synth';
import { Icon } from './icons';

const SoundContext = createContext<SoundEffectsPlayer | null>(null);

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  const [player] = useState(() => new SoundEffectsPlayer());
  useEffect(() => {
    let storage: PreferenceStorage | undefined;
    try { storage = window.localStorage; } catch { /* Optional preference. */ }
    const detach = player.attach(typeof window.AudioContext === 'function' ? () => new StorySoundSynth() : undefined, storage);
    const activate = (event: MouseEvent) => {
      if (!event.isTrusted || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || document.visibilityState === 'hidden') return;
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>('button,a,summary');
      if (!control || control.closest('[data-sfx="none"],.cinematic-intro,.music-dock,.skip-link') || control.hasAttribute('download')) return;
      const cue = interactionCue({
        explicit: control.dataset.sfx,
        disabled: control.matches(':disabled,[aria-disabled="true"],[inert]') || Boolean(control.closest('[inert]')),
        selected: Boolean(control.closest('.journal-filters')) && control.getAttribute('aria-pressed') === 'true',
        href: control instanceof HTMLAnchorElement ? control.href : undefined,
        currentUrl: window.location.href
      });
      if (cue) {
        const routeCue = control instanceof HTMLAnchorElement ? navigationCue(control.href, window.location.href) : null;
        if (routeCue) void player.play(routeCue);
        else void player.playInteraction();
      }
    };
    const change = (event: Event) => {
      if (!event.isTrusted || document.visibilityState === 'hidden' || !(event.target instanceof Element)) return;
      const control = event.target;
      if (!control.matches('select,input[type="checkbox"],input[type="radio"]') || control.matches(':disabled,[aria-disabled="true"]') || control.closest('[data-sfx="none"],.cinematic-intro,.music-dock,[inert]')) return;
      void player.playInteraction();
    };
    const hidden = () => { if (document.visibilityState === 'hidden') player.stop(); };
    // Capture preserves the pre-click state of toggles/filters and includes keyboard clicks.
    document.addEventListener('click', activate, true);
    document.addEventListener('change', change, true);
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('click', activate, true); document.removeEventListener('change', change, true); document.removeEventListener('visibilitychange', hidden); detach(); };
  }, [player]);
  return <SoundContext.Provider value={player}>{children}</SoundContext.Provider>;
}

export function useSoundEffects() {
  const player = useContext(SoundContext);
  if (!player) throw new Error('Sound controls require SoundEffectsProvider.');
  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getServerSnapshot);
  return { player, state };
}

export function SoundEffectsControls() {
  const { player, state } = useSoundEffects();
  const percent = Math.round(state.volume * 100);
  return <div className="sound-effects-controls" data-sfx="none">
    <button type="button" className="sound-effects-toggle" disabled={!state.available} aria-pressed={state.enabled && state.available} aria-label={state.enabled ? 'Mute sound effects' : 'Enable sound effects'} onClick={() => {
      const enabled = !state.enabled;
      player.setEnabled(enabled);
      if (enabled) void player.play('toggle-on');
    }}><Icon name="book"/><span>Sound effects</span><strong>{state.available ? state.enabled ? 'On' : 'Off' : 'Unavailable'}</strong></button>
    <label className="sr-only" htmlFor="effects-volume">Sound effects volume</label>
    <input id="effects-volume" type="range" min="0" max="100" step="1" value={percent} disabled={!state.enabled || !state.available} onChange={event => player.setVolume(Number(event.target.value) / 100)} aria-valuetext={`${percent} percent`}/>
    <output htmlFor="effects-volume">{percent}%</output>
    {state.status === 'blocked' && <p className="sound-effects-status" role="status">Sound effects were blocked. Toggle them off and on to retry.</p>}
  </div>;
}
