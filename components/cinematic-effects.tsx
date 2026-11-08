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
    const perElement = new WeakMap<Element, Animation>();
    const decorations = new Set<HTMLElement>();
    const scrollTargets = new Set<Element>();
    const ease = 'cubic-bezier(.22,.61,.36,1)';
    function play(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
      if (document.visibilityState === 'hidden' || typeof element.animate !== 'function') return;
      perElement.get(element)?.cancel();
      const animation = element.animate(frames, { ...options, duration: typeof options.duration === 'number' && compact ? options.duration * .85 : options.duration });
      perElement.set(element, animation);
      running.add(animation);
      void animation.finished.catch(() => undefined).finally(() => {
        running.delete(animation);
        if (perElement.get(element) === animation) perElement.delete(element);
      });
    }
    function enterPage() {
      const main = document.querySelector<HTMLElement>('main#main');
      if (!main || document.visibilityState === 'hidden') return;
      play(main, compact ? [
        { transform: 'translateY(10px)' }, { transform: 'none' }
      ] : [
        { transform: `perspective(1600px) rotateY(${sign * 1.2}deg) translateX(${sign * 14}px)` },
        { transform: 'none' }
      ], { duration: 760, easing: ease });
      const text = main.querySelectorAll<HTMLElement>('h1, .hero-copy > p, .chapter-heading-copy > p, :scope > p, .hero-actions');
      Array.from(text).slice(0, 5).forEach((part, index) => play(part, [
        { opacity: .7, transform: `translate(${sign * 10}px, 8px)` },
        { opacity: 1, transform: 'none' }
      ], { duration: 720, delay: Math.min(index * 28, 112), easing: ease }));
      main.querySelectorAll<HTMLElement>('.hero-art, .chapter-illustration, .cms-cover, .reading-vista').forEach(picture => play(picture, [
        { opacity: .75, transform: `translateX(${sign * 16}px) scale(1.025)` },
        { opacity: 1, transform: 'none' }
      ], { duration: 1000, delay: 40, easing: ease }));
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
      const scene = document.querySelector<HTMLElement>('.hero-landscape');
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
            play(target, [{ opacity: .7, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, easing: ease });
          }
        });
      }, { threshold: .12 });
      const observeContent = () => {
        const targets = document.querySelectorAll('main > section:not(.hero), .quest-entry, .browse-entry, .inventory-list, .adventurer-sheet, .contact-frame, .chapter-illustration, .about-copy, .prose > h2, .prose > p, .prose > pre');
        targets.forEach(element => {
          if (watched.has(element) || watchedCount >= 64) return;
          const parent = element.parentElement?.closest('main > section:not(.hero), .quest-entry, .browse-entry, .contact-frame, .about-copy');
          if (parent && watched.has(parent)) return;
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
