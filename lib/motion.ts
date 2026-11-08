import { paperTurnProfile } from './paper-motion.ts';

export type MotionMode = 'full' | 'user-reduced' | 'system-reduced';
// The retired footer toggle must not leave this full-motion edition disabled.
export const motionKey = 'adonissimo-motion-v3';
export const welcomeExitDuration = 1000;
export const routeExitDuration = 130;
export const pageTurnDuration = paperTurnProfile(false).duration;
export type PageTurnDirection = 'forward' | 'backward';

let memoryMotion: 'on' | 'off' | undefined;
let memoryIntro: boolean | undefined;
let routeTimer: ReturnType<typeof setTimeout> | undefined;
let routeFallback: ReturnType<typeof setTimeout> | undefined;

export function motionModeSnapshot(): MotionMode {
  if (typeof window === 'undefined') return 'system-reduced';
  // The portfolio owner explicitly chose full motion. Only an explicit local
  // off preference disables it; an OS setting must not silently override it.
  let preference = memoryMotion;
  if (!preference) {
    try { preference = localStorage.getItem(motionKey) === 'off' ? 'off' : 'on'; }
    catch { preference = 'on'; }
  }
  return preference === 'off' ? 'user-reduced' : 'full';
}

export function serverMotionSnapshot(): MotionMode {
  return 'system-reduced';
}

export function syncMotionAttribute(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.motion = motionModeSnapshot() === 'full' ? 'on' : 'off';
}

export function subscribeMotion(notify: () => void): () => void {
  const update = () => { syncMotionAttribute(); notify(); };
  const stored = (event: StorageEvent) => {
    if (event.key === motionKey || event.key === null) {
      memoryMotion = undefined;
      update();
    }
  };
  window.addEventListener('adonissimo-motion-change', update);
  window.addEventListener('storage', stored);
  syncMotionAttribute();
  return () => {
    window.removeEventListener('adonissimo-motion-change', update);
    window.removeEventListener('storage', stored);
  };
}

export function setMotionEnabled(enabled: boolean): void {
  memoryMotion = enabled ? 'on' : 'off';
  try { localStorage.setItem(motionKey, memoryMotion); } catch { /* Preference is optional. */ }
  if (!enabled) currentView?.skipTransition();
  syncMotionAttribute();
  window.dispatchEvent(new Event('adonissimo-motion-change'));
}

export function introSeenSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  if (memoryIntro !== undefined) return memoryIntro;
  // Deep links should land directly on their requested section.
  if (window.location.hash && window.location.hash !== '#home') return true;
  return false;
}

export function serverIntroSnapshot(): boolean {
  return true;
}

export function markIntroSeen(seen: boolean): void {
  memoryIntro = seen;
  // Entry lasts for this document only: a fresh home load shows the welcome again.
  window.dispatchEvent(new Event('adonissimo-intro-change'));
}

export function subscribeIntro(notify: () => void): () => void {
  window.addEventListener('adonissimo-intro-change', notify);
  return () => window.removeEventListener('adonissimo-intro-change', notify);
}

export function finishNavigation(): void {
  clearTimeout(routeTimer);
  clearTimeout(routeFallback);
  routeTimer = undefined;
  routeFallback = undefined;
  if (typeof document !== 'undefined') {
    delete document.documentElement.dataset.navigating;
    delete document.documentElement.dataset.routeDirection;
  }
}

/** Parent/detail links and the main chapters turn in a consistent direction. */
export function navigationDirection(from: string, to: string): PageTurnDirection {
  const clean = (path: string) => path.replace(/\/+$/, '') || '/';
  const current = clean(from);
  const target = clean(to);
  if (target === '/' || (target !== current && current.startsWith(`${target}/`))) return 'backward';
  if (target.startsWith(`${current}/`)) return 'forward';
  const chapters = ['/', '/projects', '/blog', '/about', '/contact', '/login', '/admin'];
  const chapter = (path: string) => chapters.findIndex(item => path === item || (item !== '/' && path.startsWith(`${item}/`)));
  const before = chapter(current);
  const after = chapter(target);
  return before >= 0 && after >= 0 && after < before ? 'backward' : 'forward';
}

export function turnStoryPage(direction: PageTurnDirection = 'forward'): void {
  if (typeof document === 'undefined' || motionModeSnapshot() !== 'full' || document.visibilityState === 'hidden') return;
  window.dispatchEvent(new CustomEvent<PageTurnDirection>('adonissimo-page-turn', { detail: direction }));
}

export function beginNavigation(navigate: () => void, direction: PageTurnDirection = 'forward'): void {
  finishNavigation();
  if (motionModeSnapshot() !== 'full' || document.visibilityState === 'hidden') { navigate(); return; }
  document.documentElement.dataset.navigating = 'true';
  document.documentElement.dataset.routeDirection = direction;
  window.dispatchEvent(new CustomEvent<PageTurnDirection>('adonissimo-route-departure', { detail: direction }));
  turnStoryPage(direction);
  routeTimer = setTimeout(() => {
    routeTimer = undefined;
    try { navigate(); } finally {
      // Decoration cannot leave a permanent screen cover on a slow/failed route.
      routeFallback = setTimeout(finishNavigation, 1200);
    }
  }, routeExitDuration);
}

type NativeTransition = {
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};
let currentView: NativeTransition | undefined;

// Progressive enhancement: state changes still commit when the API is unavailable.
export function changeView(update: () => void, kind: 'theme' | 'journal'): void {
  if (motionModeSnapshot() !== 'full' || typeof document === 'undefined') { update(); return; }
  const host = document as unknown as { startViewTransition?: (callback: () => void) => NativeTransition };
  if (!host.startViewTransition || document.visibilityState === 'hidden') { update(); return; }
  currentView?.skipTransition();
  let committed = false;
  const apply = () => { if (!committed) { committed = true; update(); } };
  document.documentElement.dataset.viewChange = kind;
  try {
    const transition = host.startViewTransition.call(document, apply);
    currentView = transition;
    void transition.updateCallbackDone.catch(apply);
    void transition.finished.catch(() => undefined).finally(() => {
      if (currentView === transition) {
        currentView = undefined;
        delete document.documentElement.dataset.viewChange;
      }
    });
  } catch { apply(); delete document.documentElement.dataset.viewChange; }
}

export const motionBootstrap = `(function(){var root=document.documentElement;root.dataset.motion='on';try{if(localStorage.getItem('${motionKey}')==='off')root.dataset.motion='off'}catch(e){}})();`;
