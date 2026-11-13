export type ThreeSceneKind = 'hero' | 'prologue' | 'entry' | 'paper';

export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function smoothProgress(value: number): number {
  const p = clampProgress(value);
  return p * p * p * (p * (p * 6 - 15) + 10);
}

export function damp(current: number, target: number, seconds: number): number {
  return current + (target - current) * (1 - Math.exp(-8 * Math.max(0, seconds)));
}

/** Preserve fractional frame cadence and visible elapsed time across refresh rates. */
export function createFrameClock(fps: number) {
  const interval = 1000 / fps;
  let previous: number | undefined, nextPaint: number | undefined, paintedSeconds = 0, seconds = 0;
  return {
    step(now: number) {
      if (previous !== undefined) seconds += Math.max(0, now - previous) / 1000;
      previous = now;
      const paint = nextPaint === undefined || now + .25 >= nextPaint;
      const delta = seconds - paintedSeconds;
      if (paint) {
        nextPaint = nextPaint === undefined ? now + interval : nextPaint + interval * Math.max(1, Math.floor((now - nextPaint) / interval) + 1);
        paintedSeconds = seconds;
      }
      return { seconds, delta, paint };
    },
    pause() { previous = undefined; nextPaint = undefined; paintedSeconds = seconds; }
  };
}

/** A continuous sheet: its spine stays fixed while its free edge curls and turns. */
export function paperPoint(u: number, v: number, progress: number, backward: boolean) {
  const p = clampProgress(progress), x = clampProgress(u), y = clampProgress(v) - .5;
  const sign = backward ? -1 : 1;
  const lift = Math.sin(p * Math.PI);
  const turn = p * Math.PI + lift * y * .16;
  const curl = lift * (.95 + y * .25);
  // Integrating the tangent preserves the sheet's width instead of stretching its free edge.
  const px = Math.abs(curl) < .00001 ? x * Math.cos(turn) : (Math.sin(turn + curl * x) - Math.sin(turn)) / curl;
  const pz = Math.abs(curl) < .00001 ? x * Math.sin(turn) : (Math.cos(turn) - Math.cos(turn + curl * x)) / curl;
  return { x: sign * px, y, z: pz };
}

export function threeBudget(compact: boolean) {
  return compact ? { pixels: 420_000, fps: 30, segments: 24, islands: 5 } : { pixels: 1_200_000, fps: 60, segments: 48, islands: 9 };
}
