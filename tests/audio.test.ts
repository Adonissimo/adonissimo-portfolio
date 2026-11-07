import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { BackgroundAudioPlayer, clampVolume, validAudioPath, audioPreferenceKey, type AudioPort, type PreferenceStorage } from '../lib/audio-player.ts';
import { backgroundMusic, openingForestTrack } from '../lib/music.ts';

class FakeAudio extends EventTarget implements AudioPort {
  src = '';
  preload = '';
  loop = false;
  volume = 1;
  muted = false;
  paused = true;
  calls = 0;
  reject: Error | undefined;
  deferred: Promise<void> | undefined;
  play(): Promise<void> {
    this.calls++;
    if (this.reject) return Promise.reject(this.reject);
    this.paused = false;
    if (this.deferred) return this.deferred;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
  pause(): void {
    const changed = !this.paused;
    this.paused = true;
    if (changed) this.dispatchEvent(new Event('pause'));
  }
}

const players: BackgroundAudioPlayer[] = [];
function create() { const player = new BackgroundAudioPlayer(backgroundMusic); players.push(player); return player; }
afterEach(() => players.splice(0).forEach(player => player.detach()));

test('the configured track is the supplied Zelda’s Lullaby file and does not autoplay', () => {
  assert.equal(backgroundMusic.title, "Zelda's Lullaby");
  assert.equal(backgroundMusic.enabled, true);
  assert.equal(backgroundMusic.src, '/audio/zeldas-lullaby.mp3');
  assert.ok(existsSync(new URL('../public/audio/zeldas-lullaby.mp3', import.meta.url)));
  const player = create(); const audio = new FakeAudio();
  player.attach(audio);
  assert.equal(audio.src, backgroundMusic.src);
  assert.equal(audio.preload, 'none');
  assert.equal(audio.loop, true);
  assert.equal(audio.calls, 0);
  assert.equal(player.getSnapshot().status, 'paused');
});

test('the forest opening uses a valid shipped WAV and cannot overwrite main music preferences', async () => {
  const data = readFileSync(new URL(`../public${openingForestTrack.src}`, import.meta.url));
  assert.equal(data.toString('ascii', 0, 4), 'RIFF');
  assert.equal(data.toString('ascii', 8, 12), 'WAVE');
  assert.equal(data.readUInt16LE(20), 1, 'PCM');
  assert.equal(data.readUInt16LE(22), 1, 'mono');
  assert.equal(data.readUInt32LE(24), 22050);
  assert.equal(data.readUInt16LE(34), 16);
  assert.equal(data.readUInt32LE(40), 40 * 22050 * 2);
  const preview = new BackgroundAudioPlayer(openingForestTrack);
  players.push(preview);
  const audio = new FakeAudio();
  preview.attach(audio);
  assert.equal(audio.src, openingForestTrack.src);
  assert.equal(audio.calls, 0);
  const pending = preview.play();
  assert.equal(audio.calls, 1);
  assert.equal(await pending, true);
  preview.pause();
  assert.equal(audio.paused, true);
});

test('only an explicitly enabled local audio source can be played', async () => {
  for (const src of ['javascript:alert(1)', '//example.com/a.mp3', '/audio/../private.mp3', '/audio/test.mp3?token=secret', 'https://example.com/a.mp3']) assert.equal(validAudioPath(src), false);
  for (const src of ['/audio/test.mp3','/audio/test.ogg','/audio/test.m4a','/audio/test.wav']) assert.equal(validAudioPath(src), true);
  const player = new BackgroundAudioPlayer({ ...backgroundMusic, enabled: false });players.push(player);
  const audio = new FakeAudio(); player.attach(audio);
  assert.equal(await player.play(), false);
  assert.equal(audio.calls, 0);
  assert.equal(audio.src, '');
  assert.equal(player.getSnapshot().status, 'unavailable');
});

test('the actual play call stays synchronous with the gesture and success is confirmed afterward', async () => {
  const player = create(); const audio = new FakeAudio(); player.attach(audio);
  const pending = player.play();
  assert.equal(audio.calls, 1, 'Must call play before leaving the user gesture');
  assert.equal(await pending, true);
  assert.equal(player.getSnapshot().status, 'playing');
  player.pause();
  assert.equal(audio.paused, true);
  assert.equal(player.getSnapshot().status, 'paused');
});

test('blocked playback returns a nonfatal retry message and can be retried', async () => {
  const player = create();const audio = new FakeAudio();player.attach(audio);
  audio.reject = Object.assign(new Error('Blocked'), { name: 'NotAllowedError' });
  assert.equal(await player.play(), false);
  assert.equal(player.getSnapshot().status, 'error');
  assert.match(player.getSnapshot().error || '', /Press Play music/);
  audio.reject = undefined;
  assert.equal(await player.play(), true);
  assert.equal(player.getSnapshot().error, null);
});

test('unavailable or undecodable audio fails gracefully rather than claiming playback', async () => {
  const player = create();const audio = new FakeAudio();player.attach(audio);
  audio.reject = Object.assign(new Error('Missing'), { name: 'NotSupportedError' });
  assert.equal(await player.play(), false);
  assert.equal(player.getSnapshot().status, 'error');
  assert.match(player.getSnapshot().error || '', /continue without it/);
});

test('pause cancels a pending play and its late resolution cannot restart the track', async () => {
  const player = create();const audio = new FakeAudio();let resolve: () => void = () => {};
  audio.deferred = new Promise<void>(done => { resolve = done; });player.attach(audio);
  const pending = player.play();player.pause();resolve();
  assert.equal(await pending, false);
  assert.equal(audio.paused, true);
  assert.equal(player.getSnapshot().status, 'paused');
});

test('volume and mute are bounded, saved, and never start playback by themselves', () => {
  const saved = new Map<string,string>();
  const storage: PreferenceStorage = { getItem: key => saved.get(key) ?? null, setItem: (key,value) => { saved.set(key,value); } };
  const player = create();const audio = new FakeAudio();player.attach(audio,storage);
  player.setVolume(2);assert.equal(audio.volume, 1);
  player.setVolume(-1);assert.equal(audio.volume, 0);
  player.setMuted(false);assert.equal(audio.volume, 0.22);
  player.setMuted(true);assert.equal(audio.muted, true);
  assert.deepEqual(JSON.parse(saved.get(audioPreferenceKey) || '{}'), { volume: 0.22, muted: true });
  assert.equal(audio.calls, 0);
  assert.equal(clampVolume(Number.NaN), 0.22);
  assert.equal(clampVolume(Infinity), 0.22);
});

test('blocked or malformed preference storage does not prevent controlled playback', async () => {
  const storage: PreferenceStorage = { getItem: () => { throw new Error('Denied'); }, setItem: () => { throw new Error('Denied'); } };
  const player = create();const audio = new FakeAudio();player.attach(audio, storage);
  assert.equal(player.getSnapshot().volume, 0.22);
  player.setVolume(0.3);player.setMuted(false);
  assert.equal(await player.play(), true);
  player.pause();
  const malformed: PreferenceStorage = { getItem: () => 'not json', setItem: () => {} };
  player.attach(new FakeAudio(), malformed);
  assert.ok(Number.isFinite(player.getSnapshot().volume));
});

test('detached media events cannot change the active player state', async () => {
  const player = create();const first = new FakeAudio();player.attach(first);
  const second = new FakeAudio();player.attach(second);
  const before = player.getSnapshot();
  first.dispatchEvent(new Event('error'));
  assert.equal(player.getSnapshot(), before);
  assert.equal(first.paused, true);
  assert.equal(await player.play(), true);
  assert.equal(second.calls, 1);
});
