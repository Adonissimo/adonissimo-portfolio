'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BackgroundAudioPlayer, type PreferenceStorage } from '@/lib/audio-player';
import type { MusicTrack } from '@/lib/music';
import { Icon } from './icons';
import { SoundEffectsControls } from './sound-effects';
import { connectMusicSession } from '@/lib/music-session';
import { AmbienceControls } from './ambient-world';

const MusicContext = createContext<{ player: BackgroundAudioPlayer; title: string } | null>(null);

export function MusicProvider({ track, children }: { track: MusicTrack; children: ReactNode }) {
  const [player] = useState(() => new BackgroundAudioPlayer(track));
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!audio.current) return;
    let storage: PreferenceStorage | undefined;
    try { storage = window.localStorage; } catch { /* Optional preferences. */ }
    const detach = player.attach(audio.current, storage);
    let session: MediaSession | undefined;
    let metadata: MediaMetadata | undefined;
    try { session = navigator.mediaSession; } catch { /* Optional media keys/OS controls. */ }
    try { if (typeof MediaMetadata === 'function') metadata = new MediaMetadata({ title: track.title }); } catch { /* Metadata is optional. */ }
    const disconnect = connectMusicSession(player, document, session, metadata);
    return () => { disconnect(); detach(); };
  }, [player, track.title]);
  return <MusicContext.Provider value={{ player, title: track.title }}><audio ref={audio} loop preload="none" playsInline aria-hidden="true" hidden/>{children}</MusicContext.Provider>;
}

export function useBackgroundMusic() {
  const context = useContext(MusicContext);
  if (!context) throw new Error('Music controls require MusicProvider.');
  const state = useSyncExternalStore(context.player.subscribe, context.player.getSnapshot, context.player.getServerSnapshot);
  return { ...context, state };
}

export function BackgroundMusicControls() {
  const { player, state, title } = useBackgroundMusic();
  const [minimized, setMinimized] = useState(true);
  const controlsId = useId();
  const dock = useRef<HTMLElement>(null);
  useEffect(() => {
    const typing = (event: FocusEvent) => {
      if (!window.matchMedia('(max-width: 760px), (pointer: coarse)').matches || !(event.target instanceof Element) || event.target.closest('.music-dock')) return;
      if (event.target.matches('textarea, [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="submit"]):not([type="button"])')) setMinimized(true);
    };
    document.addEventListener('focusin', typing);
    return () => document.removeEventListener('focusin', typing);
  }, []);
  useEffect(() => {
    const element = dock.current;
    if (!element) return;
    const reserve = () => {
      const bottom = Number.parseFloat(getComputedStyle(element).bottom) || 16;
      document.documentElement.style.setProperty('--sound-dock-space', `${Math.ceil(element.getBoundingClientRect().height + bottom + 16)}px`);
    };
    reserve();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(reserve) : undefined;
    observer?.observe(element);
    window.addEventListener('resize', reserve);
    return () => { observer?.disconnect(); window.removeEventListener('resize', reserve); document.documentElement.style.removeProperty('--sound-dock-space'); };
  }, [minimized]);
  const playing = state.status === 'playing' || state.status === 'loading';
  const silent = state.muted || state.volume === 0;
  const toggleLabel = minimized ? 'Expand music and sound controls' : 'Minimize music and sound controls';
  return <aside ref={dock} className="music-dock js-only" aria-label="Music and sound effects" data-sfx="none" data-minimized={minimized} onKeyDown={event => { if (event.key === 'Escape' && !minimized) { setMinimized(true); dock.current?.querySelector<HTMLButtonElement>('.music-dock-toggle')?.focus(); } }}>
    <button type="button" className="music-control music-dock-toggle" onClick={() => setMinimized(current => !current)} aria-label={toggleLabel} title={toggleLabel} aria-expanded={!minimized} aria-controls={controlsId}>
      <Icon name={minimized ? 'music' : 'minimize'}/>
    </button>
    <div id={controlsId} className="music-dock-panel" hidden={minimized} data-music-available={state.available}>
      {state.available && <>
        <div className="music-track"><Icon name="music"/><div><small>BACKGROUND MUSIC</small><strong>{title}</strong></div></div>
        <div className="music-actions">
          <button type="button" className="music-control" onClick={() => { if (playing) player.pause(); else void player.play(); }} aria-label={playing ? 'Pause music' : 'Play music'} title={playing ? 'Pause music' : 'Play music'}><Icon name={playing ? 'pause' : 'play'}/></button>
          <button type="button" className="music-control" onClick={() => player.setMuted(!silent)} aria-label={silent ? 'Unmute music' : 'Mute music'} aria-pressed={silent} title={silent ? 'Unmute music' : 'Mute music'}><Icon name={silent ? 'muted' : 'volume'}/></button>
        </div>
        <div className="music-volume"><label htmlFor="music-volume">Volume</label><input id="music-volume" type="range" min="0" max="100" step="1" value={Math.round(state.volume * 100)} onChange={event => player.setVolume(Number(event.target.value) / 100)} aria-valuetext={`${Math.round(state.volume * 100)} percent`}/><output htmlFor="music-volume">{Math.round(state.volume * 100)}%</output></div>
        <p className="music-status" role="status" aria-live="polite">{state.error || (state.status === 'loading' ? 'Starting music…' : state.status === 'playing' ? silent ? 'Playing · muted' : 'Playing' : 'Music paused')}</p>
      </>}
      <SoundEffectsControls/>
      <AmbienceControls/>
    </div>
  </aside>;
}
