import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OpeningSequence, entrySceneDuration, prologueDuration, titleRevealDuration } from '../lib/opening-sequence.ts';
import { welcomeExitDuration } from '../lib/motion.ts';

function filmClock() {
  let now = 0, next = 0;
  const queued = new Map<number, { at: number; callback: () => void }>();
  const cancelled: Array<() => void> = [];
  return {
    clock: {
      now: () => now,
      schedule(callback: () => void, delay: number) {
        const id = ++next; queued.set(id, { at: now + delay, callback });
        return id as unknown as ReturnType<typeof setTimeout>;
      },
      cancel(timer: ReturnType<typeof setTimeout>) {
        const id = timer as unknown as number, task = queued.get(id);
        if (task) cancelled.push(task.callback);
        queued.delete(id);
      }
    },
    advance(ms: number) {
      const until = now + ms;
      while (true) {
        const task = [...queued].sort((a, b) => a[1].at - b[1].at)[0];
        if (!task || task[1].at > until) break;
        now = task[1].at; queued.delete(task[0]); task[1].callback();
      }
      now = until;
    },
    lateCallbacks: () => cancelled.forEach(callback => callback()),
    pending: () => queued.size
  };
}

test('the first cutscene ends at the title and waits for a deliberate Enter', () => {
  const time = filmClock(), film = new OpeningSequence(true, time.clock);
  const phases: string[] = [];
  film.subscribe(() => phases.push(film.getSnapshot()));
  assert.equal(time.pending(), 0, 'Construction performs no timer work during rendering.');
  film.enter();
  assert.equal(film.getSnapshot(), 'prologue');
  film.setActive(true);
  time.advance(prologueDuration - 1);
  assert.equal(film.getSnapshot(), 'prologue');
  time.advance(1);
  assert.equal(film.getSnapshot(), 'title');
  time.advance(titleRevealDuration);
  assert.equal(film.getSnapshot(), 'welcome');
  time.advance(60000);
  assert.equal(film.getSnapshot(), 'welcome');
  assert.deepEqual(phases, ['title', 'welcome']);
  assert.equal(time.pending(), 0);
});

test('Enter plays a second cutscene, then one Triforce arrival and completes once', () => {
  const time = filmClock(), film = new OpeningSequence(true, time.clock);
  film.setActive(true); film.skip();
  const phases: string[] = [];
  film.subscribe(() => phases.push(film.getSnapshot()));
  film.enter(); film.enter();
  assert.equal(time.pending(), 1);
  time.advance(entrySceneDuration);
  assert.equal(film.getSnapshot(), 'arrival');
  time.advance(welcomeExitDuration);
  film.enter(); film.skip(); time.advance(60000);
  assert.deepEqual(phases, ['entry', 'arrival', 'complete']);
  assert.equal(time.pending(), 0);
});

test('hidden tabs pause the remaining film time and ignore stale callbacks', () => {
  const time = filmClock(), film = new OpeningSequence(true, time.clock);
  film.setActive(true); time.advance(1200); film.setActive(false);
  time.advance(30000); time.lateCallbacks();
  assert.equal(film.getSnapshot(), 'prologue');
  film.setActive(true); time.advance(prologueDuration - 1201);
  assert.equal(film.getSnapshot(), 'prologue');
  time.advance(1);
  assert.equal(film.getSnapshot(), 'title');
  time.advance(titleRevealDuration);
  assert.equal(film.getSnapshot(), 'welcome');
  film.enter(); time.advance(500); film.setActive(false); time.advance(50000);
  film.setActive(true); time.advance(entrySceneDuration - 500);
  assert.equal(film.getSnapshot(), 'arrival');
});

test('skip works in every phase and a cancelled cutscene cannot later dismiss the title', () => {
  for (const target of ['prologue', 'title', 'welcome', 'entry', 'arrival'] as const) {
    const time = filmClock(), film = new OpeningSequence(true, time.clock);
    film.setActive(true);
    if (target === 'title') time.advance(prologueDuration);
    else if (target !== 'prologue') film.skip();
    if (target === 'entry' || target === 'arrival') film.enter();
    if (target === 'arrival') time.advance(entrySceneDuration);
    film.skip(); time.lateCallbacks(); time.advance(60000);
    assert.equal(film.getSnapshot(), target === 'prologue' || target === 'title' ? 'welcome' : 'complete');
    assert.equal(time.pending(), 0);
  }
});

test('manual motion off preserves the welcome and allows immediate entry without replaying', () => {
  const time = filmClock(), film = new OpeningSequence(false, time.clock);
  film.setActive(true);
  assert.equal(film.getSnapshot(), 'welcome');
  assert.equal(time.pending(), 0);
  film.enter(); assert.equal(film.getSnapshot(), 'complete');
  const active = new OpeningSequence(true, time.clock);
  active.setActive(true); active.setFullMotion(false);
  assert.equal(active.getSnapshot(), 'welcome');
  active.setFullMotion(true); active.enter(); active.setFullMotion(false);
  assert.equal(active.getSnapshot(), 'complete');
  time.lateCallbacks(); assert.equal(active.getSnapshot(), 'complete');
});

test('effect cleanup and resubscription do not restart the prologue or keep orphaned timers', () => {
  const time = filmClock(), film = new OpeningSequence(true, time.clock);
  let notifications = 0;
  const unsubscribe = film.subscribe(() => notifications++);
  film.setActive(true); time.advance(800); film.setActive(false); unsubscribe();
  assert.equal(time.pending(), 0);
  film.setActive(true); time.advance(prologueDuration - 800);
  assert.equal(film.getSnapshot(), 'title');
  time.advance(titleRevealDuration);
  assert.equal(notifications, 0);
});

test('Enter can interrupt the title dissolve without a stale timer reopening the title', () => {
  const time = filmClock(), film = new OpeningSequence(true, time.clock);
  film.setActive(true); time.advance(prologueDuration + titleRevealDuration / 2);
  assert.equal(film.getSnapshot(), 'title');
  film.enter(); time.lateCallbacks(); time.advance(titleRevealDuration);
  assert.equal(film.getSnapshot(), 'entry');
  assert.equal(time.pending(), 1);
  film.skip(); assert.equal(film.getSnapshot(), 'complete');
});
