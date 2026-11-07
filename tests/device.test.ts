import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compactEffectsSnapshot, serverCompactSnapshot, subscribeCompactEffects, compactEffectsQuery } from '../lib/device.ts';
import { claimFairyHost, fairyHostSnapshot, fairyWingDuration, serverFairyHostSnapshot, subscribeFairyHost } from '../lib/fairy.ts';

test('effect budgets start small during SSR, respond to device changes and unsubscribe', () => {
  assert.equal(serverCompactSnapshot(), true);
  assert.equal(compactEffectsSnapshot(), true);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const events = new EventTarget();
  const media = { matches: true, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia(query: string) { assert.equal(query, compactEffectsQuery); return media; } } });
  try {
    assert.equal(compactEffectsSnapshot(), true);
    let changes = 0;
    const stop = subscribeCompactEffects(() => changes++);
    media.matches = false;
    events.dispatchEvent(new Event('change'));
    assert.equal(changes, 1);
    assert.equal(compactEffectsSnapshot(), false);
    stop();
    media.matches = true;
    events.dispatchEvent(new Event('change'));
    assert.equal(changes, 1);
    assert.equal(compactEffectsSnapshot(), true);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('the fairy keeps a slow idle beat and responds monotonically to cursor speed', () => {
  const still = fairyWingDuration(0, 16);
  const slow = fairyWingDuration(2, 16);
  const fast = fairyWingDuration(40, 16);
  assert.equal(still, 750);
  assert(slow < still && fast < slow);
  assert.equal(fairyWingDuration(20, 8), fairyWingDuration(40, 16));
  assert.equal(fairyWingDuration(100000, .01), 90);
  for (const [distance, elapsed] of [[NaN, 16], [Infinity, 16], [-1, 16], [3, 0], [3, Infinity]]) {
    assert.equal(fairyWingDuration(distance, elapsed), 750);
  }
});

test('the fairy enters the modal host, retains a stable server snapshot and returns on cleanup', () => {
  const host = { isConnected: true } as HTMLElement;
  let changes = 0;
  const stop = subscribeFairyHost(() => changes++);
  const release = claimFairyHost(host);
  try {
    assert.equal(fairyHostSnapshot(), host);
    assert.equal(serverFairyHostSnapshot(), null);
    assert.equal(changes, 1);
  } finally { release(); stop(); }
  assert.equal(fairyHostSnapshot(), null);
  assert.equal(changes, 2);
  release();
  assert.equal(changes, 2, 'Repeated cleanup must not publish another host change.');
});

test('a stale modal cleanup cannot remove the current fairy owner', () => {
  const host = { isConnected: true } as HTMLElement;
  const releaseOld = claimFairyHost(host);
  const releaseNew = claimFairyHost(host);
  try {
    releaseOld();
    assert.equal(fairyHostSnapshot(), host);
  } finally { releaseOld(); releaseNew(); }
  assert.equal(fairyHostSnapshot(), null);
});

test('a removed underlying modal is never restored as the fairy host', () => {
  const parent = { isConnected: true };
  const child = { isConnected: true };
  const releaseParent = claimFairyHost(parent as HTMLElement);
  const releaseChild = claimFairyHost(child as HTMLElement);
  try {
    parent.isConnected = false;
    releaseChild();
    assert.equal(fairyHostSnapshot(), null);
  } finally { releaseChild(); releaseParent(); }
});
