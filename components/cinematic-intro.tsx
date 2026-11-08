'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { profile } from '@/lib/content';
import { introSeenSnapshot, markIntroSeen, motionModeSnapshot, serverIntroSnapshot, serverMotionSnapshot, subscribeIntro, subscribeMotion, welcomeExitDuration, type MotionMode } from '@/lib/motion';
import { Icon } from './icons';
import { useBackgroundMusic } from './background-music';
import { useSoundEffects } from './sound-effects';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';
import { ambienceServerSnapshot, subscribeVisibility, visibleSnapshot } from '@/lib/ambience';
import { AncientSeal } from './realm-ornament';
import { BackgroundAudioPlayer } from '@/lib/audio-player';
import { openingForestTrack } from '@/lib/music';
import { claimFairyHost } from '@/lib/fairy';
import { OpeningMurals } from './opening-murals';
import { OpeningCutscene } from './opening-cutscene';
import { OpeningSequence, prologueDuration, titleRevealDuration, entrySceneDuration, imageWarmupLimit } from '@/lib/opening-sequence';

export function CinematicIntro() {
  const pathname = usePathname();
  const entered = useSyncExternalStore(subscribeIntro, introSeenSnapshot, serverIntroSnapshot);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  if (pathname !== '/' || entered) return null;
  // Reduced motion changes the presentation, not the availability of the welcome screen.
  return <WelcomeDialog mode={mode}/>;
}

function WelcomeDialog({ mode }: { mode: MotionMode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const enterButton = useRef<HTMLButtonElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  const exitIntent = useRef({ committed: false, reveal: false });
  const entrySound = useRef(false);
  const [sequence] = useState(() => new OpeningSequence(mode === 'full'));
  const [filmReady, setFilmReady] = useState(false);
  const phase = useSyncExternalStore(sequence.subscribe, sequence.getSnapshot, sequence.getSnapshot);
  const leaving = phase === 'entry' || phase === 'arrival' || phase === 'complete';
  const { player, state, title } = useBackgroundMusic();
  const effects = useSoundEffects();
  const [forest] = useState(() => new BackgroundAudioPlayer(openingForestTrack));
  const forestAudio = useRef<HTMLAudioElement>(null);
  const forestState = useSyncExternalStore(forest.subscribe, forest.getSnapshot, forest.getServerSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, ambienceServerSnapshot);
  const playing = visible && (filmReady || phase !== 'prologue');

  useEffect(() => {
    if (filmReady || phase !== 'prologue') return;
    // Let image decode finish before the camera moves, with a nonblocking deadline.
    const timer = setTimeout(() => setFilmReady(true), imageWarmupLimit);
    return () => clearTimeout(timer);
  }, [filmReady, phase]);

  useEffect(() => {
    if (!forestAudio.current) return;
    // No storage argument: preview volume never overwrites the main music preference.
    const detach = forest.attach(forestAudio.current);
    if (player.getSnapshot().status === 'playing' || player.getSnapshot().status === 'loading') player.pause();
    void forest.play();
    // A blocked autoplay attempt can resume from a real gesture, with no extra button.
    const retry = (event: PointerEvent | KeyboardEvent) => {
      if (!event.isTrusted || !['prologue', 'title', 'welcome'].includes(dialog.current?.dataset.phase ?? '')) return;
      if (event instanceof KeyboardEvent && (event.key === 'Tab' || event.key === 'Escape' || event.metaKey || event.ctrlKey || event.altKey)) return;
      if (event.target instanceof Element && event.target.closest('.welcome-actions, .intro-skip')) return;
      const status = forest.getSnapshot().status;
      if (status !== 'playing' && status !== 'loading') void forest.play();
    };
    document.addEventListener('pointerdown', retry, { passive: true });
    document.addEventListener('keydown', retry);
    return () => {
      document.removeEventListener('pointerdown', retry);
      document.removeEventListener('keydown', retry);
      detach();
    };
  }, [forest, player]);
  useEffect(() => { forest.setBackgrounded(!visible); }, [forest, visible]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // Capture the stable object, not its values: Enter/Skip update its fields later.
    const intent = exitIntent.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    try { element.showModal(); }
    catch { markIntroSeen(true); return; }
    const releaseFairy = claimFairyHost(element);
    document.body.style.overflow = 'hidden';
    return () => {
      releaseFairy();
      document.body.style.overflow = overflow;
      if (element.open) element.close();
      if (intent.committed) {
        const target = opener instanceof HTMLElement && opener !== document.body && opener.isConnected && !element.contains(opener)
          ? opener : document.querySelector<HTMLElement>('#hero-title');
        target?.focus({ preventScroll: true });
        if (intent.reveal) window.dispatchEvent(new Event('adonissimo-arrival'));
      }
    };
  }, []);

  useEffect(() => {
    sequence.setActive(playing);
    return () => sequence.setActive(false);
  }, [sequence, playing]);
  useEffect(() => { sequence.setFullMotion(mode === 'full'); }, [sequence, mode]);
  useEffect(() => {
    if (phase === 'complete') {
      exitIntent.current.committed = true;
      markIntroSeen(true);
      return;
    }
    window.dispatchEvent(new Event('adonissimo-fog-refresh'));
    if (phase === 'welcome' || phase === 'title') enterButton.current?.focus({ preventScroll: true });
    else if (phase === 'entry') skipButton.current?.focus({ preventScroll: true });
  }, [phase]);
  useEffect(() => {
    if (phase === 'arrival' && entrySound.current && document.visibilityState !== 'hidden') void effects.player.play('discover');
  }, [phase, effects.player]);

  function enter(sound: 'play' | 'pause') {
    if (sequence.getSnapshot() !== 'welcome' && sequence.getSnapshot() !== 'title') return;
    const titleScene = dialog.current?.querySelector<HTMLElement>('.intro-scene');
    if (titleScene) titleScene.style.setProperty('--title-exit-opacity', getComputedStyle(titleScene).opacity);
    forest.pause();
    entrySound.current = sound === 'play';
    exitIntent.current.reveal = mode === 'full';
    if (sound === 'play') {
      void effects.player.play('open');
      if (state.available) { player.setMuted(false); void player.play(); }
    } else if (sound === 'pause') { player.pause(); effects.player.setEnabled(false); }
    sequence.enter();
  }

  function skip() {
    if (sequence.getSnapshot() !== 'prologue' && sequence.getSnapshot() !== 'title') {
      forest.pause();
      entrySound.current = false;
      effects.player.stop();
      exitIntent.current.reveal = false;
    }
    sequence.skip();
  }

  const filmPlaying = phase === 'prologue' || phase === 'title' || leaving;
  const showTitle = phase === 'title' || phase === 'welcome' || phase === 'entry';
  const phaseDescription = phase === 'prologue' ? 'Opening cutscene: a journey from Hyrule fields to the sky islands. Skip to the title at any time.' : leaving ? 'Entering the portfolio through the sky gateway. Skip to the portfolio at any time.' : 'Full-stack projects, curious ideas, and paths worth exploring. Enter to visit the portfolio.';

  return <dialog ref={dialog} className="cinematic-intro welcome-gate" data-sfx="none" data-visible={visible} data-playing={playing} data-phase={phase === 'arrival' ? 'leaving' : phase} data-film={filmPlaying ? 'true' : 'false'} style={{ '--welcome-exit-duration': `${welcomeExitDuration}ms`, '--prologue-duration': `${prologueDuration}ms`, '--title-reveal-duration': `${titleRevealDuration}ms`, '--entry-scene-duration': `${entrySceneDuration}ms` } as CSSProperties} aria-labelledby="intro-accessible-title" aria-describedby="intro-accessible-description" onCancel={event => { event.preventDefault(); skip(); }}>
    <h2 id="intro-accessible-title" className="sr-only">Welcome to {profile.brand}</h2>
    <p id="intro-accessible-description" className="sr-only" role="status">{phaseDescription}</p>
    <audio ref={forestAudio} loop preload="none" playsInline aria-hidden="true" hidden/>
    <div className="welcome-flash" aria-hidden="true"><span className="welcome-bloom"/><svg className="welcome-flash-crest" viewBox="0 0 40 36" focusable="false"><path d="m20 1 10 17.3H10ZM10 18.3 20 35.6H0Zm20 0 10 17.3H20Z"/></svg></div>
    {filmPlaying && <OpeningCutscene kind={phase === 'prologue' || phase === 'title' ? 'prologue' : 'entry'} arriving={phase === 'arrival'} compact={compact} onReady={() => setFilmReady(true)}/>}
    {showTitle && <div className="intro-scene">
      <OpeningMurals/>
      <div className="welcome-magic" aria-hidden="true"><AncientSeal className="welcome-rune"/><span className="welcome-gold-wave"/>{Array.from({ length: compact ? 12 : 24 }, (_, index) => <i className={index % 3 ? 'welcome-dust welcome-leaf' : 'welcome-dust'} key={index} style={{ '--dust-x': `${7 + index * 37 % 86}%`, '--dust-delay': `${-(index * .7)}s`, '--dust-duration': `${8 + index % 7}s` } as CSSProperties}/>)}</div>
      <div className="intro-orbit orbit-one" aria-hidden="true"/><div className="intro-orbit orbit-two" aria-hidden="true"/>
      <div className="intro-sigil" aria-hidden="true"><svg viewBox="0 0 40 36" fill="currentColor" focusable="false"><path className="crest-piece crest-top" d="m20 1 10 17.3H10Z"/><path className="crest-piece crest-left" d="M10 18.3 20 35.6H0Z"/><path className="crest-piece crest-right" d="m30 18.3 10 17.3H20Z"/></svg></div>
      <div className="intro-wordmark" aria-hidden="true"><span className="intro-legend">THE LEGEND OF</span><div className="intro-letters">{profile.brand.toUpperCase().split('').map((letter, i) => <span key={`${letter}-${i}`} style={{ animationDelay: `${240 + i * 65}ms` }}>{letter}</span>)}</div></div>
      <span className="intro-signature">LORENZ SALVADOR · FULL-STACK WEB</span>
      <div className="intro-thread" aria-hidden="true"/>
      <div className="welcome-copy"><p className="welcome-heading">Your story begins here.</p><p>Full-stack projects, curious ideas, and paths worth exploring.<br/>Open the cover. Discover the next chapter.</p><div className="welcome-actions"><button ref={enterButton} type="button" className="button welcome-enter" disabled={leaving} onClick={() => enter('play')} aria-label={state.available ? `Enter ${profile.brand} with ${title}` : `Enter ${profile.brand}`}>Enter {profile.brand} <Icon name="book"/></button>{(state.available || effects.state.available) && <button type="button" className="welcome-quiet" disabled={leaving} onClick={() => enter('pause')}>Enter silently</button>}</div><label className="welcome-sound-choice"><input type="checkbox" checked={effects.state.enabled && effects.state.available} disabled={leaving || !effects.state.available} onChange={event => effects.player.setEnabled(event.target.checked)}/>Storybook sound effects</label>{state.available && <p className="welcome-music-note"><Icon name="music"/>{title} · starts when you enter</p>}<p className="welcome-forest-note" role="status">{forestState.error ? forestState.error.includes('browser paused') ? 'Forest prelude · waiting for your first interaction' : 'Forest audio is unavailable. You can still enter.' : forestState.status === 'playing' ? 'Forest prelude · wind, birds & soft flute' : 'Forest prelude · the woods are awakening'}</p></div>
    </div>}
    <button ref={skipButton} type="button" className="intro-skip" onClick={skip}>{phase === 'prologue' || phase === 'title' ? 'Skip to title' : leaving ? 'Skip to portfolio' : 'Skip opening'} <Icon name="arrow"/><kbd>Esc</kbd></button>
  </dialog>;
}
