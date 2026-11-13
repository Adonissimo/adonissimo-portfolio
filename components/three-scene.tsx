'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { motionModeSnapshot, serverMotionSnapshot, subscribeMotion, type PageTurnDirection } from '@/lib/motion';
import { ambienceServerSnapshot, ambienceSnapshot, subscribeAmbience, subscribeVisibility, visibleSnapshot } from '@/lib/ambience';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';
import { serverThemeSnapshot, subscribeTheme, themeSnapshot } from '@/lib/theme';
import { paperTurnProfile } from '@/lib/paper-motion';
import type { ThreeSceneKind } from '@/lib/three-motion';
import type { createThreeRenderer } from '@/lib/three-renderer';
import { fairyHostSnapshot, serverFairyHostSnapshot, subscribeFairyHost } from '@/lib/fairy';

/** Lazy WebGL enhancement. Original DOM artwork and paper remain usable fallbacks. */
export function ThreeScene({ kind }: { kind: ThreeSceneKind }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painter = useRef<ReturnType<typeof createThreeRenderer> | null>(null);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);
  const ambient = useSyncExternalStore(subscribeAmbience, ambienceSnapshot, ambienceServerSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, ambienceServerSnapshot);
  const theme = useSyncExternalStore(subscribeTheme, themeSnapshot, serverThemeSnapshot);
  const welcomeHost = useSyncExternalStore(subscribeFairyHost, fairyHostSnapshot, serverFairyHostSnapshot);
  const state = useRef({ active: false, day: false });
  const active = visible && (kind !== 'hero' || (ambient && !welcomeHost));

  useEffect(() => {
    const surface = canvas.current;
    if (!surface || mode !== 'full') return;
    const container = surface.parentElement;
    let cancelled = false, failed = false, intersecting = kind !== 'hero';
    let renderer: ReturnType<typeof createThreeRenderer> | undefined;
    let resizeObserver: ResizeObserver | undefined, intersectionObserver: IntersectionObserver | undefined, phaseObserver: MutationObserver | undefined;
    const dialog = surface.closest('dialog');
    function syncActive() {
      renderer?.setActive(!failed && state.current.active && intersecting && (!dialog || dialog.dataset.playing === 'true'));
    }
    function clearReady() { if (container) delete container.dataset.threeReady; }
    function lost(event: Event) { event.preventDefault(); failed = true; clearReady(); renderer?.setActive(false); }
    function measure() { const box = surface!.getBoundingClientRect(); renderer?.resize(box.width, box.height); }
    function pointer(event: PointerEvent) {
      if (compact || event.pointerType === 'touch' || !state.current.active) return;
      const box = surface!.getBoundingClientRect();
      if (box.width && box.height) renderer?.pointer((event.clientX - box.left) / box.width * 2 - 1, -((event.clientY - box.top) / box.height * 2 - 1));
    }
    function resetPointer() { renderer?.pointer(0, 0); }
    function turn(event: Event) {
      if (!state.current.active) return;
      renderer?.turn((event as CustomEvent<PageTurnDirection>).detail === 'backward', paperTurnProfile(compact).duration);
    }
    function visibility() { if (document.visibilityState === 'hidden') renderer?.cancelTurn(); }
    // The import stays off the server and out of the initial route bundle.
    void import('@/lib/three-renderer').then(module => {
      if (cancelled) return;
      try {
        renderer = module.createThreeRenderer(surface, kind, compact);
        painter.current = renderer;
        renderer.failure(() => { failed = true; clearReady(); renderer?.setActive(false); });
        renderer.theme(state.current.day); measure();
        if (container && !failed) container.dataset.threeReady = 'true';
        if (kind === 'hero' && typeof IntersectionObserver === 'function') {
          intersectionObserver = new IntersectionObserver(entries => { intersecting = entries[0]?.isIntersecting ?? false; syncActive(); });
          intersectionObserver.observe(surface);
        } else intersecting = true;
        resizeObserver = new ResizeObserver(measure); resizeObserver.observe(surface);
        if (dialog) { phaseObserver = new MutationObserver(syncActive); phaseObserver.observe(dialog, { attributes: true, attributeFilter: ['data-playing'] }); }
        surface.addEventListener('webglcontextlost', lost);
        surface.addEventListener('three-state-change', syncActive);
        window.addEventListener('pointermove', pointer, { passive: true });
        window.addEventListener('blur', resetPointer);
        if (kind === 'paper') window.addEventListener('adonissimo-page-turn', turn);
        document.addEventListener('visibilitychange', visibility);
        syncActive();
      } catch { clearReady(); renderer?.dispose(); painter.current = null; }
    }).catch(clearReady);
    return () => {
      cancelled = true; clearReady(); resizeObserver?.disconnect(); intersectionObserver?.disconnect(); phaseObserver?.disconnect();
      surface.removeEventListener('webglcontextlost', lost); surface.removeEventListener('three-state-change', syncActive); window.removeEventListener('pointermove', pointer); window.removeEventListener('blur', resetPointer);
      window.removeEventListener('adonissimo-page-turn', turn); document.removeEventListener('visibilitychange', visibility);
      renderer?.dispose(); painter.current = null;
    };
  }, [kind, mode, compact]);

  useEffect(() => {
    state.current = { active, day: theme === 'day' };
    // Intersection and film readiness are owned by the setup effect; ask it to refresh.
    painter.current?.theme(theme === 'day');
    if (!active) { painter.current?.setActive(false); if (!visible) painter.current?.cancelTurn(); }
    canvas.current?.dispatchEvent(new Event('three-state-change'));
  }, [active, theme, visible, kind]);

  return <canvas ref={canvas} className={`three-scene three-scene-${kind}`} aria-hidden="true"/>;
}
