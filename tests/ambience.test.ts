import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';

type Ambience = typeof import('../lib/ambience.ts');
let sequence = 0;
const originals = new Map<string, PropertyDescriptor | undefined>();
const cleanups: Array<() => void> = [];
function fake(name: string, value: unknown) {
  if (!originals.has(name)) originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
}
function browser(blocked = false) {
  const events = new EventTarget();
  const values = new Map<string, string>();
  fake('window', { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
  fake('document', { visibilityState: 'visible', addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) });
  fake('localStorage', {
    getItem(key: string) { if (blocked) throw Error('Storage denied'); return values.get(key) ?? null; },
    setItem(key: string, value: string) { if (blocked) throw Error('Storage denied'); values.set(key, value); }
  });
  return { values, events };
}
async function fresh() { return await import(new URL(`../lib/ambience.ts?test=${sequence++}`, import.meta.url).href) as Ambience; }
afterEach(() => {
  cleanups.splice(0).forEach(clean => clean());
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  originals.clear();
});

test('ambient state is safe during SSR and uses the page environment', async () => {
  const ambience = await fresh();
  assert.equal(ambience.ambienceServerSnapshot(), false);
  assert.equal(ambience.ambienceSnapshot(), false);
  assert.equal(ambience.visibleSnapshot(), false);
  for (const [path, environment] of [['/', 'sky'], ['/projects/a-quest', 'zonai'], ['/about', 'fields'], ['/contact', 'riverside'], ['/blog/note', 'depths']]) {
    assert.equal(ambience.atmosphereForPath(path).environment, environment);
  }
  assert.equal(ambience.atmosphereForPath('/admin/users').quiet, true);
  assert.equal(ambience.atmosphereForPath('/privacy').environment, 'neutral');
});

test('blocked storage leaves ambience active by default and pause works in memory', async () => {
  browser(true);
  const ambience = await fresh();
  assert.equal(ambience.ambienceSnapshot(), true);
  let changes = 0;
  cleanups.push(ambience.subscribeAmbience(() => changes++));
  ambience.setAmbienceEnabled(false);
  assert.equal(ambience.ambienceSnapshot(), false);
  ambience.setAmbienceEnabled(true);
  assert.equal(ambience.ambienceSnapshot(), true);
  assert.equal(changes, 2);
});

test('ambient pause persists without changing the independent music/effect preferences', async () => {
  const { values } = browser();
  values.set('adonissimo-music', 'unchanged');
  values.set('adonissimo-sound-effects', 'unchanged');
  const ambience = await fresh();
  ambience.setAmbienceEnabled(false);
  const restored = await fresh();
  assert.equal(restored.ambienceSnapshot(), false);
  assert.equal(values.get('adonissimo-music'), 'unchanged');
  assert.equal(values.get('adonissimo-sound-effects'), 'unchanged');
});

test('external preference and document visibility changes notify subscribed ambient consumers', async () => {
  const { values, events } = browser();
  const ambience = await fresh();
  let changes = 0;
  cleanups.push(ambience.subscribeAmbience(() => changes++));
  cleanups.push(ambience.subscribeVisibility(() => changes++));
  ambience.setAmbienceEnabled(true);
  values.set(ambience.ambienceKey, 'paused');
  const event = new Event('storage');
  Object.defineProperty(event, 'key', { value: ambience.ambienceKey });
  window.dispatchEvent(event);
  assert.equal(ambience.ambienceSnapshot(), false);
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  events.dispatchEvent(new Event('visibilitychange'));
  assert.equal(ambience.visibleSnapshot(), false);
  assert.equal(changes, 3);
});

test('the ambient field is deterministic, finite and already in flight when enabled', async () => {
  const ambience = await fresh();
  const repeated = await fresh();
  assert.equal(ambience.ambientParticles.length, 32);
  assert.deepEqual(ambience.ambientParticles, repeated.ambientParticles);
  assert(Object.isFrozen(ambience.ambientParticles));
  for (const particle of ambience.ambientParticles) {
    assert(Object.values(particle).every(value => typeof value !== 'number' || Number.isFinite(value)));
    assert(particle.left >= 0 && particle.left <= 100);
    assert(particle.duration >= 12 && particle.duration <= 24);
    assert(particle.delay <= 0 && particle.delay > -particle.duration);
    assert(particle.size >= 7 && particle.size <= 15);
  }
});
