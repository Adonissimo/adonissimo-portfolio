const desktop = Object.freeze({ duration: 940, strips: 8 });
const compact = Object.freeze({ duration: 720, strips: 5 });

export function paperTurnProfile(smallScreen: boolean) { return smallScreen ? compact : desktop; }

/** Chained rotations approximate a continuous curl, with the spine held still. */
export function paperBendFrames(index: number, count: number, backward: boolean): Array<{ offset: number; transform: string }> {
  const total = Number.isFinite(count) ? Math.max(2, Math.min(8, Math.round(count))) : 8;
  const rib = Number.isFinite(index) ? Math.max(0, Math.min(total - 1, Math.round(index))) : 0;
  const peak = rib === 0 ? 0 : (backward ? -1 : 1) * (58 / (total - 1)) * (.65 + .65 * rib / (total - 1));
  const rotate = (fraction: number) => `rotateY(${Math.round(peak * fraction * 100) / 100}deg)`;
  return [
    { offset: 0, transform: rotate(0) },
    { offset: .18, transform: rotate(.25) },
    { offset: .48, transform: rotate(1) },
    { offset: .76, transform: rotate(.42) },
    { offset: 1, transform: rotate(0) }
  ];
}
