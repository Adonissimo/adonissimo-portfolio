'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { finishNavigation, introSeenSnapshot, motionModeSnapshot, serverMotionSnapshot, subscribeMotion } from '@/lib/motion';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';

export function CinematicEffects() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);

  useEffect(() => {
    const routeChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    const sign = document.documentElement.dataset.routeDirection === 'backward' ? -1 : 1;
    finishNavigation();
    if (mode !== 'full') return;
    const running = new Set<Animation>();
    const decorations = new Set<HTMLElement>();
    const scrollTargets = new Set<Element>();
    const ease = 'cubic-bezier(.16,1,.3,1)';
    function play(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
      if (document.visibilityState === 'hidden' || typeof element.animate !== 'function') return;
      const animation = element.animate(frames, { ...options, duration: typeof options.duration === 'number' && compact ? options.duration * .75 : options.duration });
      running.add(animation);
      void animation.finished.catch(() => undefined).finally(() => running.delete(animation));
    }
    function enterPage() {
      const main = document.querySelector<HTMLElement>('main#main');
      if (!main || document.visibilityState === 'hidden') return;
      play(main, compact ? [
        { opacity: .55, transform: `translateY(12px)` }, { opacity: 1, transform: 'none' }
      ] : [
        { opacity: .55, transform: `perspective(1600px) rotateY(${sign * 3}deg) translateX(${sign * 22}px)`, clipPath: sign > 0 ? 'inset(0 0 0 3%)' : 'inset(0 3% 0 0)' },
        { opacity: 1, transform: 'none', clipPath: 'inset(0)' }
      ], { duration: 620, easing: ease });
      const text = main.querySelectorAll<HTMLElement>('h1, .hero-copy > p, .chapter-heading-copy > p, :scope > p, .hero-actions');
      Array.from(text).slice(0, 5).forEach((part, index) => play(part, [
        { opacity: .35, transform: `translate(${sign * 18}px, 12px)`, clipPath: 'inset(0 0 18% 0)' },
        { opacity: 1, transform: 'none', clipPath: 'inset(0)' }
      ], { duration: 560, delay: Math.min(index * 35, 120), easing: ease }));
      main.querySelectorAll<HTMLElement>('.hero-art, .chapter-illustration, .cms-cover, .reading-vista').forEach(picture => play(picture, [
        { opacity: .3, transform: `translateX(${sign * 28}px) scale(.94)` },
        { opacity: 1, transform: 'none' }
      ], { duration: 840, delay: 65, easing: ease }));
      const backdrop = document.querySelector<HTMLElement>('.world-atlas');
      if (backdrop) play(backdrop, [{ transform: `scale(1.025) translateX(${sign * 6}px)` }, { transform: 'none' }], { duration: 960, easing: ease });
    }
    function leavePage(event: Event) {
      if (document.visibilityState === 'hidden') return;
      stopDecorations();
      const direction = (event as CustomEvent<string>).detail === 'backward' ? -1 : 1;
      const main = document.querySelector<HTMLElement>('main#main');
      if (main) play(main, compact ? [
        { opacity: 1, transform: 'none' }, { opacity: .5, transform: 'translateY(-8px)' }
      ] : [
        { opacity: 1, transform: 'none' },
        { opacity: .4, transform: `perspective(1600px) rotateY(${direction * -3}deg) translateX(${direction * -18}px)` }
      ], { duration: 160, easing: 'ease-in' });
    }
    function arrival() {
      enterPage();
      // Initial intersections behind the welcome must not consume the reveal.
      scrollTargets.forEach(target => {
        if (!revealed.has(target)) { observer?.unobserve(target); observer?.observe(target); }
      });
      const copy = document.querySelector<HTMLElement>('.hero-copy');
      const scene = document.querySelector<HTMLElement>('.hero-landscape');
      if (copy) play(copy, [{ opacity: .4, transform: 'translateY(17px)', filter: compact ? 'none' : 'blur(5px)' }, { opacity: 1, transform: 'translateY(0)', filter: compact ? 'none' : 'blur(0)' }], { duration: 900, easing: ease });
      if (scene) play(scene, [{ opacity: .35, transform: 'scale(1.065)', filter: compact ? 'none' : 'blur(3px)' }, { opacity: 1, transform: 'scale(1)', filter: compact ? 'none' : 'blur(0)' }], { duration: 1200, easing: ease });
      scene?.querySelectorAll<SVGElement>('.seal-track').forEach(track => {
        if (document.visibilityState === 'hidden' || typeof track.animate !== 'function') return;
        const animation = track.animate([{ strokeDashoffset: 1, opacity: .2 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 1100, easing: ease });
        running.add(animation);
        void animation.finished.catch(() => undefined).finally(() => running.delete(animation));
      });
    }
    function flare(event: MouseEvent) {
      if (document.visibilityState === 'hidden' || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>('a,button');
      if (!control || control.matches(':disabled') || control.closest('.cinematic-intro')) return;
      const box = control.getBoundingClientRect();
      const circle = document.createElement('span');
      circle.className = 'click-flare';
      circle.setAttribute('aria-hidden', 'true');
      circle.style.left = `${event.detail ? event.clientX - box.left : box.width / 2}px`;
      circle.style.top = `${event.detail ? event.clientY - box.top : box.height / 2}px`;
      control.append(circle);
      decorations.add(circle);
      if (typeof circle.animate === 'function') {
        const animation = circle.animate([{ transform: 'translate(-50%,-50%) scale(.25)', opacity: .7 }, { transform: 'translate(-50%,-50%) scale(9)', opacity: 0 }], { duration: 650, easing: ease });
        running.add(animation);
        void animation.finished.catch(() => undefined).finally(() => { running.delete(animation); decorations.delete(circle); circle.remove(); });
      } else { decorations.delete(circle); circle.remove(); }
    }
    const revealed = new WeakSet<Element>();
    const watched = new WeakSet<Element>();
    let watchedCount = 0;
    let observer: IntersectionObserver | undefined;
    let changes: MutationObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (pathname === '/' && !introSeenSnapshot()) return;
        entries.forEach(entry => {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);
          observer?.unobserve(entry.target);
          const target = entry.target as HTMLElement;
          if (target.classList.contains('adventurer-sheet')) {
            play(target, [{ opacity: .5, transform: 'translateY(20px) rotate(-5deg)' }, { opacity: 1, transform: 'translateY(0) rotate(-2deg)' }], { duration: 850, easing: ease });
          } else if (target.classList.contains('inventory-list')) {
            target.querySelectorAll<HTMLElement>('.inventory-item').forEach((item, i) => play(item, [{ opacity: .4, transform: 'translateX(14px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 540, delay: Math.min(i * 45, 180), easing: ease }));
          } else {
            play(target, [{ opacity: .4, clipPath: 'inset(4% 0 0 0)', transform: 'translateY(14px)' }, { opacity: 1, clipPath: 'inset(0)', transform: 'translateY(0)' }], { duration: 700, easing: ease });
          }
        });
      }, { threshold: .12 });
      const observeContent = () => {
        const targets = document.querySelectorAll('main > section:not(.hero), .quest-entry, .browse-entry, .inventory-list, .adventurer-sheet, .contact-frame, .chapter-illustration, .about-copy, .prose > h2, .prose > p, .prose > pre');
        targets.forEach(element => {
          if (watched.has(element) || watchedCount >= 64) return;
          watched.add(element);
          watchedCount++;
          scrollTargets.add(element);
          observer?.observe(element);
        });
      };
      observeContent();
      const main = document.querySelector('main#main');
      if (main && 'MutationObserver' in window) {
        changes = new MutationObserver(observeContent);
        changes.observe(main, { childList: true, subtree: true });
      }
    }
    document.addEventListener('click', flare);
    window.addEventListener('adonissimo-arrival', arrival);
    window.addEventListener('adonissimo-route-departure', leavePage);
    if (routeChanged || pathname !== '/') enterPage();
    function stopDecorations() {
      running.forEach(animation => animation.cancel());
      running.clear();
      decorations.forEach(element => element.remove());
      decorations.clear();
    }
    function visibilityChanged() { if (document.visibilityState === 'hidden') stopDecorations(); }
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      observer?.disconnect();
      changes?.disconnect();
      document.removeEventListener('click', flare);
      window.removeEventListener('adonissimo-arrival', arrival);
      window.removeEventListener('adonissimo-route-departure', leavePage);
      document.removeEventListener('visibilitychange', visibilityChanged);
      stopDecorations();
    };
  }, [pathname, mode, compact]);

  return null;
}
