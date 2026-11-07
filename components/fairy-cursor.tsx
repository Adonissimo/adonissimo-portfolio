'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ambienceServerSnapshot, ambienceSnapshot, subscribeAmbience, subscribeVisibility, visibleSnapshot } from '@/lib/ambience';
import { motionModeSnapshot, serverMotionSnapshot, subscribeMotion } from '@/lib/motion';
import { fairyHostSnapshot, fairyWingDuration, serverFairyHostSnapshot, subscribeFairyHost } from '@/lib/fairy';

function finePointerSnapshot() { return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
function subscribePointer(notify: () => void) {
  const media = window.matchMedia('(hover: hover) and (pointer: fine)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

/** A pointer-aligned sprite; wing movement and a bounded trail never intercept input. */
export function FairyCursor() {
  const trail = useRef<HTMLDivElement>(null);
  const companion = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(subscribeAmbience, ambienceSnapshot, ambienceServerSnapshot);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, ambienceServerSnapshot);
  const fine = useSyncExternalStore(subscribePointer, finePointerSnapshot, ambienceServerSnapshot);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const host = useSyncExternalStore(subscribeFairyHost, fairyHostSnapshot, serverFairyHostSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    const dots = trail.current?.querySelectorAll<HTMLElement>('.fairy-spark');
    if (!enabled || !visible || !fine || mode !== 'full' || !dots?.length) return;
    const running = new Map<HTMLElement, Animation>();
    let next = 0;
    let lastAt = -Infinity;
    let lastX = -100;
    let lastY = -100;
    let wingAt = -Infinity;
    let wingX = 0;
    let wingY = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const fairy = companion.current;
    const clear = () => {
      delete root.dataset.fairyCursor;
      delete root.dataset.fairyAnimated;
      if (idle !== undefined) { clearTimeout(idle); idle = undefined; }
      wingAt = -Infinity;
      if (fairy) { fairy.style.visibility = 'hidden'; fairy.style.setProperty('--wing-beat', '750ms'); }
      running.forEach(animation => animation.cancel());
      running.clear();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      if (document.visibilityState === 'hidden') return;
      if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),button:disabled,[aria-disabled="true"]')) { clear(); return; }
      // Unknown modals retain a visible fallback. The opening owns a portal host.
      if (event.target instanceof Element) {
        const modal = event.target.closest('dialog[open]');
        if (modal && modal !== host) { clear(); root.dataset.fairyCursor = 'on'; return; }
      }
      root.dataset.fairyCursor = 'on';
      // Unsupported animation browsers keep the native SVG cursor as a fallback.
      if (fairy && typeof fairy.animate === 'function') {
        root.dataset.fairyAnimated = 'true';
        fairy.style.transform = `translate3d(${event.clientX - 16}px, ${event.clientY - 16}px, 0)`;
        fairy.style.visibility = 'visible';
        fairy.style.setProperty('--wing-beat', `${fairyWingDuration(Math.hypot(event.clientX - wingX, event.clientY - wingY), event.timeStamp - wingAt)}ms`);
        wingAt = event.timeStamp;
        wingX = event.clientX;
        wingY = event.clientY;
        if (idle !== undefined) clearTimeout(idle);
        idle = setTimeout(() => { fairy.style.setProperty('--wing-beat', '750ms'); idle = undefined; }, 120);
      }
      if (event.timeStamp - lastAt < 24 || Math.hypot(event.clientX - lastX, event.clientY - lastY) < 4) return;
      lastAt = event.timeStamp;
      lastX = event.clientX;
      lastY = event.clientY;
      const dot = dots[next % dots.length];
      const drift = next++ % 2 ? -8 : 8;
      running.get(dot)?.cancel();
      dot.style.left = `${event.clientX - 5}px`;
      dot.style.top = `${event.clientY - 5}px`;
      if (typeof dot.animate !== 'function') return;
      const animation = dot.animate([
        { opacity: .9, transform: 'translate(0, 0) scale(1)' },
        { opacity: .4, transform: `translate(${drift * .3}px, 7px) scale(.65)`, offset: .4 },
        { opacity: 0, transform: `translate(${drift}px, 21px) scale(.15)` }
      ], { duration: 680, easing: 'ease-out' });
      running.set(dot, animation);
      void animation.finished.catch(() => undefined).finally(() => {
        if (running.get(dot) === animation) { running.delete(dot); animation.cancel(); }
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', clear);
    document.documentElement.addEventListener('pointerleave', clear);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', clear);
      document.documentElement.removeEventListener('pointerleave', clear);
      clear();
    };
  }, [enabled, visible, fine, mode, host]);

  if (!fine) return null;
  const content = <div ref={trail} className="fairy-trail" aria-hidden="true">
    <div ref={companion} className="fairy-companion"><svg width="32" height="32" viewBox="0 0 32 32" focusable="false">
      <g fill="#dcfff0" stroke="#87bba7" strokeWidth=".65">
        <g className="fairy-wing fairy-wing-left"><path d="M14 15C7 15 2 9 3 4c6 0 11 4 12 10Z"/><path d="M14 18c-5 0-8 4-7 8 4 0 7-3 8-7Z"/></g>
        <g className="fairy-wing fairy-wing-right"><path d="M18 15c7 0 12-6 11-11-6 0-11 4-12 10Z"/><path d="M18 18c5 0 8 4 7 8-4 0-7-3-8-7Z"/></g>
      </g>
      <circle cx="16" cy="16" r="4.2" fill="#fffbea" stroke="#bc9b54" strokeWidth=".8"/><circle cx="15" cy="15" r="1.4" fill="#fff"/>
    </svg></div>
    {Array.from({ length: 28 }, (_, index) => <i key={index} className="fairy-spark"/>)}
  </div>;
  return host ? createPortal(content, host) : content;
}
