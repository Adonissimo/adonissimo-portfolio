import type { BackgroundAudioPlayer } from './audio-player.ts';

export type VisibilityHost = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
export type MediaSessionPort = Pick<MediaSession, 'metadata' | 'playbackState' | 'setActionHandler'>;

/** Keep user-started music running in background tabs; media controls are optional. */
export function connectMusicSession(player: BackgroundAudioPlayer, host: VisibilityHost, session?: MediaSessionPort, metadata?: MediaMetadata): () => void {
  const visibility = () => player.setBackgrounded(host.visibilityState === 'hidden');
  host.addEventListener('visibilitychange', visibility);
  visibility();
  let active = false;
  const installed: MediaSessionAction[] = [];
  const sync = () => {
    if (!session) return;
    const state = player.getSnapshot();
    if (!active && state.status !== 'playing') return;
    if (!active) {
      active = true;
      try { if (metadata) session.metadata = metadata; } catch { /* Optional browser surface. */ }
      const handlers: Array<[MediaSessionAction, () => void]> = [
        ['play', () => { void player.play(); }],
        ['pause', player.pause],
        ['stop', player.pause]
      ];
      for (const [action, handler] of handlers) {
        try { session.setActionHandler(action, handler); installed.push(action); }
        catch { /* Browsers may support only some actions. */ }
      }
    }
    try { session.playbackState = state.status === 'playing' ? 'playing' : 'paused'; }
    catch { /* Playback remains independent of Media Session support. */ }
  };
  const unsubscribe = player.subscribe(sync);
  sync();
  return () => {
    host.removeEventListener('visibilitychange', visibility);
    unsubscribe();
    if (!session || !active) return;
    for (const action of installed) { try { session.setActionHandler(action, null); } catch { /* Optional cleanup. */ } }
    try { session.playbackState = 'none'; session.metadata = null; } catch { /* Optional cleanup. */ }
  };
}
