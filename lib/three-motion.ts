export type ThreeSceneKind = 'hero' | 'prologue' | 'entry' | 'paper';

export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

/** A continuous sheet: its spine stays fixed while its free edge curls and turns. */
export function paperPoint(u: number, v: number, progress: number, backward: boolean) {
  const p = clampProgress(progress), x = clampProgress(u), y = clampProgress(v) - .5;
  const sign = backward ? -1 : 1;
  const turn = p * Math.PI;
  const curl = Math.sin(p * Math.PI) * .85;
  const angle = turn + curl * x;
  return { x: sign * x * Math.cos(angle), y, z: x * Math.sin(angle) + curl * Math.sin(x * Math.PI) * .16 };
}

export function threeBudget(compact: boolean) {
  return compact ? { pixels: 420_000, fps: 30, segments: 24, islands: 5 } : { pixels: 1_200_000, fps: 60, segments: 48, islands: 9 };
}
