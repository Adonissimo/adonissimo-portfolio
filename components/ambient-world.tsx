'use client';

import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { ambienceServerSnapshot, ambienceSnapshot, ambientParticles, atmosphereForPath, setAmbienceEnabled, subscribeAmbience, subscribeVisibility, visibleSnapshot } from '@/lib/ambience';
import { introSeenSnapshot, motionModeSnapshot, serverIntroSnapshot, serverMotionSnapshot, subscribeIntro, subscribeMotion } from '@/lib/motion';
import { Icon } from './icons';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';

export function AmbientWorld() {
  const pathname = usePathname();
  const enabled = useSyncExternalStore(subscribeAmbience, ambienceSnapshot, ambienceServerSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, ambienceServerSnapshot);
  const entered = useSyncExternalStore(subscribeIntro, introSeenSnapshot, serverIntroSnapshot);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);
  const { environment, quiet } = atmosphereForPath(pathname);
  const active = enabled && visible && mode === 'full' && (pathname !== '/' || entered);

  useEffect(() => {
    if (!active || compact) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      document.documentElement.style.setProperty('--world-scroll', `${Math.min(12, Math.max(0, window.scrollY) * .012)}px`);
    };
    const scroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', scroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty('--world-scroll');
    };
  }, [active, compact]);

  return <div className="ambient-world" data-environment={environment} data-quiet={quiet} data-active={active} aria-hidden="true">
    {ambientParticles.slice(0, quiet ? 8 : compact ? 18 : 32).map((particle, index) => <i key={index} className={`ambient-particle ambient-${particle.kind}`} style={{
      '--left': `${particle.left}%`, '--duration': `${particle.duration}s`, '--delay': `${particle.delay}s`,
      '--drift': `${particle.drift}px`, '--turn': `${particle.turn}deg`, '--size': `${particle.size}px`
    } as CSSProperties}/>)}
  </div>;
}

/** Pauses ambient loops only; page/welcome transitions and audio stay independent. */
export function AmbienceControls() {
  const enabled = useSyncExternalStore(subscribeAmbience, ambienceSnapshot, ambienceServerSnapshot);
  return <button type="button" className="ambience-control" aria-pressed={enabled} aria-label={enabled ? 'Pause ambient effects' : 'Resume ambient effects'} onClick={() => setAmbienceEnabled(!enabled)}>
    <Icon name={enabled ? 'pause' : 'play'}/><span>Ambient effects</span><strong>{enabled ? 'On' : 'Paused'}</strong>
  </button>;
}
