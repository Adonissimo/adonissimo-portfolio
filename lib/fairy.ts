/** Wing beat in milliseconds: a gentle idle, with a bounded response to pointer speed. */
export function fairyWingDuration(distance: number, elapsedMs: number): number {
  if (!Number.isFinite(distance) || !Number.isFinite(elapsedMs) || distance < 0 || elapsedMs <= 0) return 750;
  const speed = distance / Math.max(8, elapsedMs);
  return Math.round(Math.max(90, 750 / (1 + speed * 3)));
}

// A native dialog is in the browser's top layer. Portal the single shared fairy
// into it instead of replacing the animated sprite with a static native cursor.
let fairyHost: HTMLElement | null = null;
const hostListeners = new Set<() => void>();
const hostClaims: Array<{ host: HTMLElement }> = [];
function publishHost(host: HTMLElement | null): void {
  if (fairyHost === host) return;
  fairyHost = host;
  hostListeners.forEach(notify => notify());
}
export function fairyHostSnapshot(): HTMLElement | null { return fairyHost; }
export function serverFairyHostSnapshot(): null { return null; }
export function subscribeFairyHost(notify: () => void): () => void {
  hostListeners.add(notify);
  return () => { hostListeners.delete(notify); };
}
export function claimFairyHost(host: HTMLElement): () => void {
  const claim = { host };
  hostClaims.push(claim);
  publishHost(host);
  return () => {
    const index = hostClaims.indexOf(claim);
    if (index < 0) return;
    hostClaims.splice(index, 1);
    const previous = hostClaims.findLast(entry => entry.host.isConnected);
    publishHost(previous?.host ?? null);
  };
}
