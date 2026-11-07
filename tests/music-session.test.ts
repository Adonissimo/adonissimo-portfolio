import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { BackgroundAudioPlayer, type AudioPort } from '../lib/audio-player.ts';
import { backgroundMusic } from '../lib/music.ts';
import { connectMusicSession, type MediaSessionPort, type VisibilityHost } from '../lib/music-session.ts';

class Audio extends EventTarget implements AudioPort {
  src = ''; preload = ''; loop = false; volume = 1; muted = false; paused = true; calls = 0;
  pending: Promise<void> | undefined;
  play() { this.calls++; this.paused = false; this.dispatchEvent(new Event('playing')); return this.pending ?? Promise.resolve(); }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
}
class Visibility extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible';
  change(hidden: boolean) { this.visibilityState = hidden ? 'hidden' : 'visible'; this.dispatchEvent(new Event('visibilitychange')); }
}
class Session implements MediaSessionPort {
  metadata: MediaMetadata | null = null;
  playbackState: MediaSessionPlaybackState = 'none';
  handlers = new Map<MediaSessionAction, MediaSessionActionHandler | null>();
  setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) { this.handlers.set(action, handler); }
  activate(action: MediaSessionAction) { this.handlers.get(action)?.({ action }); }
}
const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));
function setup(session?: MediaSessionPort, host = new Visibility()) {
  const player = new BackgroundAudioPlayer(backgroundMusic);
  const audio = new Audio();
  const detach = player.attach(audio);
  const metadata = { title: backgroundMusic.title } as MediaMetadata;
  const disconnect = connectMusicSession(player, host as unknown as VisibilityHost, session, metadata);
  cleanups.push(() => { disconnect(); detach(); });
  return { player, audio, host, disconnect, metadata };
}

test('music continues across scroll and repeated tab switches without restart; manual pause stays paused', async () => {
  const { player, audio, host } = setup();
  await player.play();
  host.dispatchEvent(new Event('scroll'));
  for (let i = 0; i < 3; i++) {
    host.change(true);
    assert.equal(audio.paused, false);
    assert.equal(audio.volume, 0.22, 'Complete the fade before background timers can be throttled');
    host.change(false);
    assert.equal(player.getSnapshot().status, 'playing');
  }
  assert.equal(audio.calls, 1, 'Tab switching must not restart the recording');
  assert.equal(audio.loop, true);
  player.pause();
  host.change(true); host.change(false);
  assert.equal(audio.paused, true);
  assert.equal(audio.calls, 1, 'Visibility must not undo an explicit pause');
});

test('hiding a tab during pending playback or starting while hidden does not leave a silent stalled fade', async () => {
  const { player, audio, host } = setup();
  let resolve!: () => void;
  audio.pending = new Promise(done => { resolve = done; });
  const playing = player.play();
  host.change(true);
  resolve();
  assert.equal(await playing, true);
  assert.equal(audio.volume, 0.22);
  player.pause();
  assert.equal(await player.play(), true);
  assert.equal(audio.volume, 0.22);
  assert.equal(audio.paused, false);
});

test('media controls appear after playback, follow real player state and are removed on cleanup', async () => {
  const session = new Session();
  const { player, audio, host, disconnect, metadata } = setup(session);
  assert.equal(session.handlers.size, 0, 'Loading the page must not claim media controls');
  assert.equal(session.metadata, null);
  await player.play();
  assert.equal(session.metadata, metadata);
  assert.equal(session.playbackState, 'playing');
  host.change(true);
  session.activate('pause');
  assert.equal(audio.paused, true);
  assert.equal(session.playbackState, 'paused');
  session.activate('play');
  assert.equal(audio.calls, 2, 'The media-key handler must call play synchronously');
  await Promise.resolve();
  assert.equal(session.playbackState, 'playing');
  session.activate('stop');
  assert.equal(player.getSnapshot().status, 'paused');
  disconnect();
  assert.equal(session.metadata, null);
  assert.equal(session.playbackState, 'none');
  assert.ok([...session.handlers.values()].every(handler => handler === null));
  await player.play();
  assert.equal(session.playbackState, 'none', 'A cleaned-up session must no longer subscribe to the player');
});

test('unsupported metadata, playback state or media actions never stop ordinary background playback', async () => {
  const unsupported = new Proxy({} as MediaSessionPort, {
    get(_target, property) { if (property === 'setActionHandler') return () => { throw new Error('Not supported'); }; return null; },
    set() { throw new Error('Not supported'); }
  });
  const { player, audio, host } = setup(unsupported);
  assert.equal(await player.play(), true);
  host.change(true);
  assert.equal(audio.paused, false);
  assert.equal(player.getSnapshot().status, 'playing');
  player.pause();
  assert.equal(audio.paused, true);
});
