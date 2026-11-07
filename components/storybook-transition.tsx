'use client';

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { finishNavigation, motionModeSnapshot, navigationDirection, pageTurnDuration, serverMotionSnapshot, subscribeMotion, turnStoryPage, type PageTurnDirection } from '@/lib/motion';
import { Triforce } from './zelda-art';
import { AncientSeal } from './realm-ornament';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects } from '@/lib/device';
import { paperBendFrames, paperTurnProfile } from '@/lib/paper-motion';

/** Nested strips share their edges; small rotations accumulate into a curved page. */
function PaperRib({ index, count }: { index: number; count: number }) {
  return <div className="paper-rib" data-rib={index} data-last={index === count - 1}>
    <div className="paper-face paper-front">{index === Math.floor(count / 2) && <Triforce/>}</div>
    <div className="paper-face paper-back">{index === Math.floor(count / 2) && <Triforce/>}</div>
    {index + 1 < count && <PaperRib index={index + 1} count={count}/>}
  </div>;
}

/** A decorative leaf; navigation and scrolling never depend on the animation finishing. */
export function StorybookTransition() {
  const stage = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const mode = useSyncExternalStore(subscribeMotion, motionModeSnapshot, serverMotionSnapshot);
  const compact = useSyncExternalStore(subscribeCompactEffects, compactEffectsSnapshot, serverCompactSnapshot);

  useEffect(() => { lastPath.current = pathname; }, [pathname]);

  useEffect(() => {
    const element = stage.current;
    if (!element || mode !== 'full') return;
    const leaf = element.querySelector<HTMLElement>('.story-leaf');
    const shade = element.querySelector<HTMLElement>('.story-shade');
    if (!leaf || !shade || typeof leaf.animate !== 'function') return;
    const profile = paperTurnProfile(compact);
    let animations: Animation[] = [];
    let sequence = 0;
    const turn = (event: Event) => {
      if (document.visibilityState === 'hidden') return;
      const direction = (event as CustomEvent<PageTurnDirection>).detail;
      const current = ++sequence;
      animations.forEach(animation => animation.cancel());
      element.dataset.direction = direction === 'backward' ? 'backward' : 'forward';
      element.dataset.active = 'true';
      const sign = direction === 'backward' ? 1 : -1;
      const revealOnly = event.type === 'adonissimo-arrival';
      const duration = compact ? profile.duration : pageTurnDuration;
      const ribs = leaf.querySelectorAll<HTMLElement>('.paper-rib');
      const curved = !revealOnly && ribs.length > 1 && typeof CSS !== 'undefined' && CSS.supports('transform-style', 'preserve-3d');
      element.dataset.curved = curved ? 'true' : 'false';
      const page = leaf.animate(revealOnly ? [{ opacity: 0 }, { opacity: 0 }] : [
        { transform: 'rotateY(0deg)', opacity: 0, offset: 0 },
        { transform: `rotateY(${sign * 10}deg)`, opacity: 1, offset: 0.12 },
        { transform: `rotateY(${sign * 95}deg)`, opacity: 1, offset: 0.52 },
        { transform: `rotateY(${sign * 174}deg)`, opacity: 0, offset: 1 }
      ], { duration, easing: 'cubic-bezier(.4,.05,.2,1)' });
      const shadow = shade.animate([{ opacity: 0 }, { opacity: 0.28, offset: 0.4 }, { opacity: 0 }], { duration, easing: 'ease-out' });
      animations = [page, shadow];
      if (curved) {
        ribs.forEach((rib, index) => {
          if (typeof rib.animate !== 'function') return;
          animations.push(rib.animate(paperBendFrames(index, ribs.length, direction === 'backward'), { duration, easing: 'cubic-bezier(.4,.05,.2,1)' }));
        });
        const cast = element.querySelector<HTMLElement>('.story-cast-shadow');
        if (cast && typeof cast.animate === 'function') animations.push(cast.animate([
          { opacity: 0, transform: `translateX(${sign * -28}%) scaleX(.3)` },
          { opacity: .24, transform: `translateX(${sign * 8}%) scaleX(1)`, offset: .46 },
          { opacity: 0, transform: `translateX(${sign * 32}%) scaleX(.25)` }
        ], { duration, easing: 'cubic-bezier(.4,.05,.2,1)' }));
      }
      const seal = element.querySelector<SVGElement>('.route-magic > .ancient-seal');
      if (seal && typeof seal.animate === 'function') animations.push(seal.animate([
        { opacity: 0, transform: 'scale(.7) rotate(-18deg)' },
        { opacity: .55, transform: 'scale(1) rotate(0deg)', offset: .42 },
        { opacity: 0, transform: 'scale(1.18) rotate(12deg)' }
      ], { duration, easing: 'cubic-bezier(.16,1,.3,1)' }));
      const sparks = element.querySelectorAll<HTMLElement>('.story-spark');
      sparks.forEach((spark, index) => {
        if (compact && index >= 6) return;
        if (typeof spark.animate !== 'function') return;
        const angle = index * Math.PI * 2 / (compact ? 6 : 12);
        const distance = compact ? (index % 2 ? 65 : 100) : (index % 2 ? 120 : 170);
        animations.push(spark.animate([
          { opacity: 0, transform: 'translate(0, 0) rotate(45deg) scale(.2)' },
          { opacity: .9, offset: .22 },
          { opacity: 0, transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance * .65}px) rotate(100deg) scale(.4)` }
        ], { duration: compact ? 400 : 540, delay: 45 + index * 9, easing: 'cubic-bezier(.16,1,.3,1)' }));
      });
      animations.slice(2).forEach(animation => { void animation.finished.catch(() => undefined); });
      void page.finished.catch(() => undefined).finally(() => {
        if (sequence === current) { delete element.dataset.active; delete element.dataset.curved; animations = []; }
      });
      void shadow.finished.catch(() => undefined);
    };
    const history = () => {
      finishNavigation();
      if (document.visibilityState === 'hidden') return;
      const direction = navigationDirection(lastPath.current || '/', window.location.pathname);
      document.documentElement.dataset.routeDirection = direction;
      turnStoryPage(direction);
    };
    const section = (event: MouseEvent) => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.hasAttribute('download') || anchor.closest('.skip-link') || (anchor.target && anchor.target !== '_self')) return;
      const target = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (target.origin !== current.origin || target.pathname !== current.pathname || target.search !== current.search || !target.hash || target.hash === current.hash) return;
      let destination: HTMLElement | null;
      try { destination = document.getElementById(decodeURIComponent(target.hash.slice(1))); } catch { return; }
      if (destination) turnStoryPage(destination.getBoundingClientRect().top < 0 ? 'backward' : 'forward');
    };
    const hidden = () => {
      if (document.visibilityState !== 'hidden') return;
      sequence++;
      animations.forEach(animation => animation.cancel());
      animations = [];
      delete element.dataset.active;
      delete element.dataset.curved;
    };
    window.addEventListener('adonissimo-page-turn', turn);
    window.addEventListener('adonissimo-arrival', turn);
    window.addEventListener('popstate', history);
    document.addEventListener('click', section, true);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      sequence++;
      animations.forEach(animation => animation.cancel());
      delete element.dataset.active;
      delete element.dataset.curved;
      window.removeEventListener('adonissimo-page-turn', turn);
      window.removeEventListener('adonissimo-arrival', turn);
      window.removeEventListener('popstate', history);
      document.removeEventListener('click', section, true);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [mode, compact]);

  return <div ref={stage} className="story-turn" aria-hidden="true"><div className="story-shade"/><div className="story-leaf"><div className="story-leaf-face story-leaf-front"><AncientSeal className="story-seal"/><Triforce/><span>A Hyrule Field Journal</span><i/></div><div className="story-leaf-face story-leaf-back"><AncientSeal className="story-seal"/><Triforce/><span>The adventure continues</span><i/></div><div className="story-paper" style={{ '--paper-strips': paperTurnProfile(compact).strips } as CSSProperties}><PaperRib index={0} count={paperTurnProfile(compact).strips}/></div></div><div className="route-magic"><AncientSeal/>{Array.from({ length: compact ? 6 : 12 }, (_, index) => <i key={index} className="story-spark"/>)}</div><div className="story-cast-shadow"/></div>;
}
