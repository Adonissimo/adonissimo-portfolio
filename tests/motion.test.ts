import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';

type Motion = typeof import('../lib/motion.ts');
let sequence = 0;
const initial = new Map<string, PropertyDescriptor | undefined>();
const cleanups: Array<() => void> = [];

function fakeGlobal(name: string, value: unknown) {
  if (!initial.has(name)) initial.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

async function fresh(): Promise<Motion> {
  const library = await import(new URL(`../lib/motion.ts?test=${sequence++}`, import.meta.url).href) as Motion;
  cleanups.push(library.finishNavigation);
  return library;
}

function browser({ reduced = false, blockedStorage = false, hash = '' } = {}) {
  const events = new EventTarget();
  const data: Record<string, string> = {};
  const makeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem(key: string) { if (blockedStorage) throw new Error('Storage denied'); return values.get(key) ?? null; },
      setItem(key: string, value: string) { if (blockedStorage) throw new Error('Storage denied'); values.set(key, value); },
      removeItem(key: string) { if (blockedStorage) throw new Error('Storage denied'); values.delete(key); }
    };
  };
  const media = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const page: { documentElement: { dataset: Record<string, string> }; visibilityState: string; startViewTransition?: (update: () => void) => never } = { documentElement: { dataset: data }, visibilityState: 'visible' };
  fakeGlobal('window', { location: { hash }, matchMedia: () => media, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
  fakeGlobal('document', page);
  fakeGlobal('localStorage', makeStorage());
  fakeGlobal('sessionStorage', makeStorage());
  return { data, media, page };
}

afterEach(() => {
  cleanups.splice(0).forEach(clean => clean());
  for (const [name, descriptor] of initial) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  initial.clear();
});

test('server rendering has no cinematic gate or browser requirement', async () => {
  const motion = await fresh();
  assert.equal(motion.motionModeSnapshot(), 'system-reduced');
  assert.equal(motion.serverMotionSnapshot(), 'system-reduced');
  assert.equal(motion.serverIntroSnapshot(), true);
  assert.equal(motion.introSeenSnapshot(), true);
  let committed = 0;
  motion.changeView(() => committed++, 'theme');
  assert.equal(committed, 1);
});

test('the requested full-motion default is not silently disabled by the OS preference', async () => {
  const environment = browser({ reduced: true });
  const motion = await fresh();
  motion.setMotionEnabled(true);
  assert.equal(motion.motionModeSnapshot(), 'full');
  assert.equal(environment.data.motion, 'on');
  let navigated = 0;
  motion.beginNavigation(() => navigated++);
  assert.equal(navigated, 0);
  assert.equal(environment.data.navigating, 'true');
  motion.finishNavigation();
  motion.setMotionEnabled(false);
  motion.beginNavigation(() => navigated++);
  assert.equal(navigated, 1, 'An explicit local off action still keeps navigation immediate.');
  assert.equal(environment.data.navigating, undefined);
});

test('bootstrap and hydrated snapshots both keep full motion when preference storage is blocked', async () => {
  const environment = browser({ reduced: true, blockedStorage: true });
  const motion = await fresh();
  runInNewContext(motion.motionBootstrap, { document, localStorage, window });
  assert.equal(environment.data.motion, 'on');
  assert.equal(motion.motionModeSnapshot(), 'full');
  motion.syncMotionAttribute();
  assert.equal(environment.data.motion, 'on');
});

test('blocked storage still permits skip, replay and a remembered in-memory preference', async () => {
  const environment = browser({ blockedStorage: true });
  const motion = await fresh();
  assert.equal(motion.introSeenSnapshot(), false);
  motion.markIntroSeen(true);
  assert.equal(motion.introSeenSnapshot(), true);
  motion.markIntroSeen(false);
  assert.equal(motion.introSeenSnapshot(), false);
  motion.setMotionEnabled(false);
  assert.equal(motion.introSeenSnapshot(), false, 'Reducing motion must not dismiss the welcome');
  assert.equal(motion.motionModeSnapshot(), 'user-reduced');
  assert.equal(environment.data.motion, 'off');
});

test('section deep links skip the automatic prologue', async () => {
  browser({ hash: '#projects' });
  const motion = await fresh();
  assert.equal(motion.introSeenSnapshot(), true);
  motion.markIntroSeen(false);
  assert.equal(motion.introSeenSnapshot(), false, 'Explicit replay still works');
});

test('rapid route requests cancel the stale intent and keep the latest destination', async () => {
  const environment = browser();
  const motion = await fresh();
  const destinations: string[] = [];
  motion.beginNavigation(() => destinations.push('stale'));
  motion.beginNavigation(() => destinations.push('latest'));
  assert.equal(environment.data.navigating, 'true');
  await new Promise(resolve => setTimeout(resolve, motion.routeExitDuration + 50));
  assert.deepEqual(destinations, ['latest']);
  motion.finishNavigation();
  assert.equal(environment.data.navigating, undefined);
});

test('an unavailable View Transition API still commits exactly one update', async () => {
  browser();
  const motion = await fresh();
  let changes = 0;
  motion.changeView(() => changes++, 'journal');
  assert.equal(changes, 1);
});

test('a failing transition after its callback does not apply the update twice', async () => {
  const environment = browser();
  environment.page.startViewTransition = update => { update(); throw new Error('Transition unavailable'); };
  const motion = await fresh();
  let changes = 0;
  motion.changeView(() => changes++, 'theme');
  assert.equal(changes, 1);
  assert.equal(environment.data.viewChange, undefined);
});

test('background documents update state without starting a visual transition', async () => {
  const environment = browser();
  environment.page.visibilityState = 'hidden';
  const motion = await fresh();
  let changes = 0;
  motion.changeView(() => changes++, 'theme');
  assert.equal(changes, 1);
  assert.equal(environment.data.viewChange, undefined);
});

test('storybook navigation carries its direction and leaves reduced-motion navigation immediate', async () => {
  browser();
  const motion = await fresh();
  const directions: string[] = [];
  window.addEventListener('adonissimo-page-turn', event => directions.push((event as CustomEvent<string>).detail));
  motion.turnStoryPage('forward');
  motion.beginNavigation(() => undefined, 'backward');
  assert.deepEqual(directions, ['forward', 'backward']);
  motion.finishNavigation();
  motion.setMotionEnabled(false);
  let navigated = false;
  motion.beginNavigation(() => { navigated = true; });
  assert.equal(navigated, true);
  assert.deepEqual(directions, ['forward', 'backward'], 'Reduced motion must not start a page curl');
});

test('a hidden document never starts a decorative page turn', async () => {
  const environment = browser();
  environment.page.visibilityState = 'hidden';
  const motion = await fresh();
  let turns = 0;
  window.addEventListener('adonissimo-page-turn', () => turns++);
  motion.turnStoryPage();
  assert.equal(turns, 0);
});

test('chapter and parent/detail navigation carry predictable directions', async () => {
  const motion = await fresh();
  assert.equal(motion.navigationDirection('/projects', '/projects/a-quest'), 'forward');
  assert.equal(motion.navigationDirection('/projects/a-quest', '/projects/'), 'backward');
  assert.equal(motion.navigationDirection('/contact', '/about'), 'backward');
  assert.equal(motion.navigationDirection('/about', '/contact'), 'forward');
  assert.equal(motion.navigationDirection('/blog/a-note', '/'), 'backward');
  assert.equal(motion.navigationDirection('/projects-old', '/projects/new'), 'forward');
});

test('route departure precedes the turn and its transient direction is cleaned up', async () => {
  const environment = browser();
  const motion = await fresh();
  const cues: string[] = [];
  window.addEventListener('adonissimo-route-departure', event => cues.push(`leave:${(event as CustomEvent<string>).detail}`));
  window.addEventListener('adonissimo-page-turn', event => cues.push(`turn:${(event as CustomEvent<string>).detail}`));
  let navigated = false;
  motion.beginNavigation(() => { navigated = true; }, 'backward');
  assert.deepEqual(cues, ['leave:backward', 'turn:backward']);
  assert.equal(environment.data.routeDirection, 'backward');
  motion.finishNavigation();
  await new Promise(resolve => setTimeout(resolve, motion.routeExitDuration + 20));
  assert.equal(navigated, false, 'Cancelling a stale transition must also cancel its delayed push.');
  assert.equal(environment.data.routeDirection, undefined);
});

test('background navigation commits immediately without a motion delay or stale direction', async () => {
  const environment = browser();
  environment.page.visibilityState = 'hidden';
  const motion = await fresh();
  let navigated = 0;
  motion.beginNavigation(() => navigated++);
  assert.equal(navigated, 1);
  assert.equal(environment.data.navigating, undefined);
  assert.equal(environment.data.routeDirection, undefined);
});

test('the retired visible motion toggle cannot disable the new full-motion default', async () => {
  browser();
  localStorage.setItem('adonissimo-motion', 'off');
  const motion = await fresh();
  assert.equal(motion.motionModeSnapshot(), 'full');
  assert.equal(localStorage.getItem('adonissimo-motion'), 'off', 'Unrelated historical preference data is not deleted.');
});
