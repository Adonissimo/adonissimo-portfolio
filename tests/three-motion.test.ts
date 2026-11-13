import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampProgress, createFrameClock, damp, paperPoint, smoothProgress, threeBudget } from '../lib/three-motion.ts';

test('paper spine stays fixed and backward turns mirror the sheet', () => {
  for (const progress of [0, .1, .5, .9, 1]) {
    const spine = paperPoint(0, .5, progress, false);
    assert.equal(Math.abs(spine.x), 0); assert.equal(spine.y, 0); assert.equal(spine.z, 0);
    const forward = paperPoint(.8, .3, progress, false), backward = paperPoint(.8, .3, progress, true);
    assert.equal(forward.x, -backward.x); assert.equal(forward.y, backward.y); assert.equal(forward.z, backward.z);
  }
});

test('paper starts flat, curls continuously, and finishes on the opposite side', () => {
  assert.equal(paperPoint(1, 1, 0, false).x, 1);
  assert.equal(paperPoint(1, 1, 1, false).x, -1);
  assert.ok(paperPoint(.5, .5, .5, false).z > 0);
  for (let i = 0; i <= 100; i++) {
    const point = paperPoint(i / 100, .5, .5, false);
    assert.ok(Object.values(point).every(Number.isFinite));
    if (i) { const previous = paperPoint((i - 1) / 100, .5, .5, false); assert.ok(Math.hypot(point.x - previous.x, point.z - previous.z) < .03); }
  }
});

test('render budgets are bounded and compact devices receive less GPU work', () => {
  assert.equal(clampProgress(NaN), 0); assert.equal(clampProgress(-1), 0); assert.equal(clampProgress(2), 1);
  const compact = threeBudget(true), desktop = threeBudget(false);
  assert.ok(compact.pixels < desktop.pixels); assert.ok(compact.fps < desktop.fps); assert.ok(compact.segments < desktop.segments);
  assert.ok(desktop.pixels <= 1_200_000); assert.ok(desktop.islands <= 9);
});

test('the curved sheet keeps its width instead of stretching through the turn', () => {
  for (const progress of [.2, .5, .8]) {
    let length = 0;
    for (let i = 1; i <= 200; i++) {
      const a = paperPoint((i - 1) / 200, .5, progress, false), b = paperPoint(i / 200, .5, progress, false);
      length += Math.hypot(b.x - a.x, b.z - a.z);
    }
    assert.ok(Math.abs(length - 1) < .00001);
  }
});

test('frame caps preserve fractional cadence across common display refresh rates', () => {
  for (const refresh of [30, 60, 90, 120, 144]) for (const fps of [30, 60]) {
    const clock = createFrameClock(fps); let paints = 0;
    for (let frame = 0; frame <= refresh * 3; frame++) if (clock.step(frame * 1000 / refresh).paint) paints++;
    assert.ok(Math.abs(paints - (Math.min(fps, refresh) * 3 + 1)) <= 1, `${refresh}Hz at ${fps}fps produced ${paints} paints`);
  }
});

test('animation clocks catch up after a visible hitch but exclude paused time', () => {
  const clock = createFrameClock(60); clock.step(0);
  assert.equal(clock.step(500).seconds, .5);
  clock.pause(); assert.equal(clock.step(10_000).seconds, .5);
  assert.ok(Math.abs(clock.step(10_200).seconds - .7) < .000001);
});

test('pointer damping takes the same time on 30Hz and high-refresh displays', () => {
  const samples = [30, 60, 144].map(fps => {
    let position = 0;
    for (let frame = 0; frame < fps; frame++) position = damp(position, 1, 1 / fps);
    return position;
  });
  assert.ok(Math.abs(samples[0] - samples[2]) < 1e-12);
  assert.equal(smoothProgress(0), 0); assert.equal(smoothProgress(1), 1);
  assert.ok(smoothProgress(.001) / .001 < .001);
  assert.ok((1 - smoothProgress(.999)) / .001 < .001);
});
