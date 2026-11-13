export type ThreeSceneKind = 'hero' | 'prologue' | 'entry' | 'paper';

export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
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
