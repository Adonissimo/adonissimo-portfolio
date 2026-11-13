import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampProgress, paperPoint, threeBudget } from '../lib/three-motion.ts';

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
