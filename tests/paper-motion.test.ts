import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paperBendFrames, paperTurnProfile } from '../lib/paper-motion.ts';

const angle = (frame: { transform: string }) => Number(frame.transform.match(/rotateY\((-?[\d.]+)deg\)/)?.[1]);

test('page turning has bounded desktop/phone budgets and a slightly slower duration', () => {
  assert.deepEqual(paperTurnProfile(false), { duration: 940, strips: 8 });
  assert.deepEqual(paperTurnProfile(true), { duration: 720, strips: 5 });
  assert(Object.isFrozen(paperTurnProfile(false)));
  assert(Object.isFrozen(paperTurnProfile(true)));
});

test('the curved paper keeps its spine fixed and increases the bend toward the free edge', () => {
  for (const small of [false, true]) {
    const { strips } = paperTurnProfile(small);
    let previous = 0, total = 0;
    for (let index = 0; index < strips; index++) {
      const frames = paperBendFrames(index, strips, false);
      assert.equal(angle(frames[0]), 0);
      assert.equal(angle(frames.at(-1)!), 0);
      const peak = angle(frames[2]);
      assert(peak >= previous && peak < 20);
      assert(index === 0 ? peak === 0 : peak > 0);
      previous = peak; total += peak;
    }
    assert(total > 50 && total < 70, 'Both device budgets should describe a comparable continuous curl.');
  }
});

test('reverse page turns mirror the curve without changing its timing or shape', () => {
  for (let index = 1; index < 8; index++) {
    const forward = paperBendFrames(index, 8, false);
    const backward = paperBendFrames(index, 8, true);
    forward.forEach((frame, i) => {
      assert.equal(frame.offset, backward[i].offset);
      assert.equal(Math.abs(angle(frame)), Math.abs(angle(backward[i])));
      assert(angle(frame) >= 0 && angle(backward[i]) <= 0);
    });
  }
});

test('malformed curve inputs remain finite and bounded', () => {
  for (const [index, count] of [[NaN, Infinity], [Infinity, NaN], [-5, -3], [99, 999], [2, 1]]) {
    const frames = paperBendFrames(index, count, false);
    assert(frames.every(frame => Number.isFinite(angle(frame)) && Math.abs(angle(frame)) <= 76));
  }
});
