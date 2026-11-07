import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { SoundEffectsPlayer, interactionCue, navigationCue, soundCollection, soundPreferenceKey, type SoundCue, type SoundOutput } from '../lib/sound-effects.ts';
import { StorySoundSynth } from '../lib/story-sound-synth.ts';

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));

class Output implements SoundOutput {
  calls: Array<[SoundCue, number]> = [];
  stops = 0;
  disposed = 0;
  result: Promise<boolean> = Promise.resolve(true);
  play(cue: SoundCue, volume: number) { this.calls.push([cue, volume]); return this.result; }
  stop() { this.stops++; }
  dispose() { this.disposed++; }
}

function playerWith(output = new Output()) {
  let now = 0;
  const player = new SoundEffectsPlayer(() => now);
  let creations = 0;
  const detach = player.attach(() => { creations++; return output; });
  cleanups.push(detach);
  return { player, output, creations: () => creations, advance: (ms: number) => { now += ms; } };
}

test('sound preferences load without creating an audio context or playing', () => {
  let creations = 0;
  const player = new SoundEffectsPlayer();
  const server = player.getServerSnapshot();
  const saved = JSON.stringify({ enabled: false, volume: 0.18 });
  cleanups.push(player.attach(() => { creations++; return new Output(); }, { getItem: () => saved, setItem() {} }));
  assert.equal(creations, 0);
  assert.equal(player.getSnapshot().enabled, false);
  assert.equal(player.getSnapshot().volume, 0.18);
  assert.equal(player.getServerSnapshot(), server, 'The hydration snapshot must remain stable');
});

test('explicit play calls the backend synchronously inside the activating gesture', async () => {
  const { player, output, creations } = playerWith();
  const playing = player.play('open');
  assert.equal(creations(), 1);
  assert.deepEqual(output.calls, [['open', 0.35]], 'Do not defer resume to an effect or timer');
  assert.equal(await playing, true);
});

test('rapid clicks are bounded while a page turn can supersede a small chime', async () => {
  const { player, output, advance } = playerWith();
  await player.play('select');
  advance(15);
  assert.equal(await player.play('select'), false);
  assert.equal(await player.play('page'), true);
  advance(90);
  assert.equal(await player.play('page'), false);
  advance(100);
  assert.equal(await player.play('page'), true);
  assert.deepEqual(output.calls.map(call => call[0]), ['select', 'page', 'page']);
});

test('muting during a pending resume prevents its late result from reviving effects', async () => {
  const output = new Output();
  let resolve!: (played: boolean) => void;
  output.result = new Promise(done => { resolve = done; });
  const { player } = playerWith(output);
  const playing = player.play('page');
  player.setEnabled(false);
  assert.equal(output.stops, 1);
  resolve(true);
  assert.equal(await playing, false);
  assert.equal(player.getSnapshot().enabled, false);
  assert.equal(await player.play('open'), false);
  assert.equal(output.calls.length, 1);
});

test('volume/mute persistence is separate from music and never starts playback', async () => {
  const values = new Map<string, string>([['adonissimo-audio-preferences', '{"muted":true,"volume":0.22}']]);
  const player = new SoundEffectsPlayer();
  let creations = 0;
  cleanups.push(player.attach(() => { creations++; return new Output(); }, { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } }));
  player.setVolume(9);
  assert.equal(player.getSnapshot().volume, 1);
  player.setVolume(-2);
  assert.equal(await player.play('select'), false);
  player.setEnabled(false);
  player.setEnabled(true);
  assert.equal(player.getSnapshot().volume, 0.35);
  assert.equal(creations, 0);
  assert.deepEqual(JSON.parse(values.get(soundPreferenceKey)!), { enabled: true, volume: 0.35 });
  assert.equal(values.get('adonissimo-audio-preferences'), '{"muted":true,"volume":0.22}');
});

test('blocked/malformed storage and non-finite volumes use safe quiet defaults', () => {
  for (const value of ['oops', 'null', '{"enabled":"yes","volume":"loud"}']) {
    const player = new SoundEffectsPlayer();
    cleanups.push(player.attach(() => new Output(), { getItem: () => value, setItem: () => { throw new Error('Denied'); } }));
    player.setVolume(NaN);
    assert.equal(player.getSnapshot().enabled, true);
    assert.equal(player.getSnapshot().volume, 0.35);
  }
  const player = new SoundEffectsPlayer();
  cleanups.push(player.attach(undefined, { getItem: () => { throw new Error('Denied'); }, setItem() {} }));
  assert.equal(player.getSnapshot().available, false);
});

test('unavailable or rejected audio never rejects the interaction or prevents retry', async () => {
  const absent = new SoundEffectsPlayer();
  assert.equal(await absent.play('page'), false);
  const output = new Output();
  output.result = Promise.reject(new Error('NotAllowedError'));
  const { player, advance } = playerWith(output);
  assert.equal(await player.play('select'), false);
  assert.equal(player.getSnapshot().status, 'blocked');
  output.result = Promise.resolve(true);
  advance(200);
  assert.equal(await player.play('page'), true);
  assert.equal(player.getSnapshot().status, 'ready');
});

test('detaching discards old asynchronous results and closes the old backend', async () => {
  const old = new Output();
  let resolve!: (played: boolean) => void;
  old.result = new Promise(done => { resolve = done; });
  const { player } = playerWith(old);
  const playing = player.play('page');
  const replacement = new Output();
  cleanups.push(player.attach(() => replacement));
  assert.equal(old.disposed, 1);
  resolve(false);
  assert.equal(await playing, false);
  assert.equal(player.getSnapshot().status, 'ready');
  assert.equal(await player.play('select'), true);
});

test('cue selection excludes silent/disabled/current controls and distinguishes journal navigation', () => {
  const currentUrl = 'https://adonissimo.test/#home';
  assert.equal(interactionCue({ currentUrl }), 'select');
  assert.equal(interactionCue({ currentUrl, href: '#projects' }), 'page');
  assert.equal(interactionCue({ currentUrl, href: '/projects/a-quest' }), 'quest');
  assert.equal(interactionCue({ currentUrl, href: 'https://external.test' }), 'external');
  assert.equal(interactionCue({ currentUrl, explicit: 'magic' }), 'magic');
  assert.equal(interactionCue({ currentUrl, href: 'mailto:hello@example.test' }), 'contact');
  for (const facts of [{ explicit: 'none' }, { disabled: true }, { selected: true, explicit: 'page' }, { href: '#home' }, { href: 'javascript:void(0)' }]) {
    assert.equal(interactionCue({ currentUrl, ...facts }), null);
  }
});

test('route sounds match page, return, project and letter actions without hijacking other links', () => {
  const origin = 'https://adonissimo.test';
  assert.equal(navigationCue('/about', `${origin}/projects`), 'page');
  assert.equal(navigationCue('/projects/a-quest', `${origin}/projects`), 'quest');
  assert.equal(navigationCue('/projects', `${origin}/projects/a-quest`), 'page-back');
  assert.equal(navigationCue('/', `${origin}/blog`), 'return');
  assert.equal(navigationCue('/contact', `${origin}/about`), 'contact');
  assert.equal(navigationCue('/projects?page=2', `${origin}/projects`), 'page');
  for (const href of ['#projects', '/', 'https://external.test/about', 'mailto:hello@example.test', 'javascript:void(0)']) {
    assert.equal(navigationCue(href, `${origin}/`), null);
  }
});

// A narrow recording audio graph exercises the shipped synth's scheduling/lifecycle.
// This is not an audible browser test.
class Param {
  value = 0;
  values: number[][] = [];
  setValueAtTime(...values: number[]) { this.values.push(values); return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
  cancelScheduledValues() { return this; }
}
class Node {
  type = '';
  buffer: { getChannelData(index: number): Float32Array } | undefined;
  connections = 0;
  gain = new Param();
  frequency = new Param();
  Q = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  starts = 0;
  stops: Array<number | undefined> = [];
  connect() { this.connections++; return this; }
  disconnect() { this.connections = 0; }
  start() { this.starts++; }
  stop(at?: number) { this.stops.push(at); }
}
class Context {
  state = 'suspended';
  currentTime = 1;
  sampleRate = 24000;
  destination = new Node();
  sources: Node[] = [];
  buffers: Float32Array[] = [];
  resumes = 0;
  suspends = 0;
  closes = 0;
  pending: Promise<void> | undefined;
  createGain() { return new Node(); }
  createDynamicsCompressor() { return new Node(); }
  createBiquadFilter() { return new Node(); }
  createOscillator() { const node = new Node(); this.sources.push(node); return node; }
  createBufferSource() { const node = new Node(); this.sources.push(node); return node; }
  createBuffer(_channels: number, length: number) { const samples = new Float32Array(length); this.buffers.push(samples); return { getChannelData: () => samples }; }
  resume() { this.resumes++; return (this.pending ?? Promise.resolve()).then(() => { if (this.state !== 'closed') this.state = 'running'; }); }
  suspend() { this.suspends++; this.state = 'suspended'; return Promise.resolve(); }
  close() { this.closes++; this.state = 'closed'; return Promise.resolve(); }
}

function synthWith(context = new Context()) {
  const synth = new StorySoundSynth(context as unknown as AudioContext);
  cleanups.push(() => synth.dispose());
  return { synth, context };
}

test('synth resumes in the gesture, caches paper, and bounds all generated samples', async () => {
  const { synth, context } = synthWith();
  assert.equal(context.sources.length, 0);
  const playing = synth.play('page', 0.35);
  assert.equal(context.resumes, 1);
  assert.equal(context.sources.length, 0, 'Wait for a resumed context before scheduling sources');
  assert.equal(await playing, true);
  assert.equal(context.sources[0].starts, 1);
  assert.equal(context.buffers.length, 1);
  const samples = context.buffers[0];
  assert.ok(samples.every(value => Number.isFinite(value) && Math.abs(value) <= 1));
  assert.ok(samples.some(value => Math.abs(value) > 0.1), 'Paper must contain actual sound data');
  await synth.play('page', 0.35);
  assert.equal(context.buffers.length, 1, 'Reuse the small noise buffer');
});

test('synth does not schedule late audio after mute/hidden-tab stop or disposal', async () => {
  const context = new Context();
  let resolve!: () => void;
  context.pending = new Promise(done => { resolve = done; });
  const { synth } = synthWith(context);
  const playing = synth.play('open', 0.35);
  synth.stop();
  resolve();
  assert.equal(await playing, false);
  assert.equal(context.sources.length, 0);
  synth.dispose();
  assert.equal(context.closes, 1);
  assert.equal(await synth.play('select', 0.35), false);
});

test('synth limits overlapping cues and stops/disconnects every active source', async () => {
  const { synth, context } = synthWith();
  for (let i = 0; i < 5; i++) await synth.play('select', 0.35);
  const active = () => context.sources.filter(source => source.connections > 0);
  assert.equal(active().length, 6, 'At most three two-note cues can overlap');
  assert.ok(context.sources.slice(0, 4).every(source => source.stops.includes(undefined)), 'Oldest cues are stopped');
  synth.stop();
  assert.equal(active().length, 0);
  assert.ok(context.sources.every(source => source.stops.includes(undefined)));
  assert.equal(context.suspends, 1);
});

test('opening and magic cues schedule real tones with finite stop times', async () => {
  for (const cue of ['open', 'magic'] as const) {
    const { synth, context } = synthWith();
    assert.equal(await synth.play(cue, 0.35), true);
    assert.equal(context.sources.length, cue === 'open' ? 5 : 3);
    assert.ok(context.sources.every(source => source.starts === 1 && source.stops.some(at => typeof at === 'number' && at < 2)));
  }
});

test('forward and backward page turns combine bounded paper and magical tones', async () => {
  for (const cue of ['page', 'page-back'] as const) {
    const { synth, context } = synthWith();
    assert.equal(await synth.play(cue, .35), true);
    assert.equal(context.buffers.length, 1, 'Each turn contains one generated paper rustle.');
    assert.equal(context.sources.length, 4, 'Paper and three bell tones form one transition cue.');
    assert.ok(context.sources.every(source => source.stops.some(at => typeof at === 'number' && at < context.currentTime + 1)));
  }
});

test('all eighteen cues have distinct bounded audio graphs and map to actual portfolio actions', async () => {
  assert.equal(soundCollection.length, 18);
  const signatures = new Set<string>();
  for (const sound of soundCollection) {
    const { synth, context } = synthWith();
    assert.equal(await synth.play(sound.cue, 0.35), true, sound.label);
    assert.ok(context.sources.length > 0, `${sound.label} must produce audible sources`);
    assert.ok(context.sources.every(source => source.starts === 1 && source.stops.some(at => typeof at === 'number' && Number.isFinite(at) && at < 2)), `${sound.label} must end within a second`);
    signatures.add(JSON.stringify(context.sources.map(source => ({ type: source.type, pitches: source.frequency.values, samples: source.buffer ? Array.from(source.buffer.getChannelData(0).slice(0, 16)) : [], stops: source.stops }))));
    assert.equal(interactionCue({ currentUrl: 'https://adonissimo.test', explicit: sound.cue }), sound.cue);
  }
  assert.equal(signatures.size, 18, 'New labels must not alias the same sound');
  for (const [hash, cue] of [['#inventory', 'inventory'], ['#about', 'bookmark'], ['#contact', 'contact'], ['#home', 'home']] as const) {
    assert.equal(interactionCue({ currentUrl: 'https://adonissimo.test/#projects', href: hash }), cue);
  }
  assert.equal(interactionCue({ currentUrl: 'https://adonissimo.test/projects/a-quest', href: '/#projects' }), 'return');
});

test('automatic interaction sounds cycle through all eighteen cues without adjacent repeats', async () => {
  let now=0;
  const output=new Output();
  const player=new SoundEffectsPlayer(()=>now,()=>0);
  cleanups.push(player.attach(()=>output));
  for(let i=0;i<36;i++){assert.equal(await player.playInteraction(),true);now+=200;}
  const cues=output.calls.map(([cue])=>cue);
  assert.equal(new Set(cues.slice(0,18)).size,18);
  assert.equal(new Set(cues.slice(18)).size,18);
  assert.ok(cues.every((cue,i)=>i===0||cue!==cues[i-1]),'Refilling must not repeat the previous cue');
});

test('automatic effects respect mute, zero volume and rapid-click limits without consuming the next sound', async () => {
  let now=0;
  const output=new Output();
  const player=new SoundEffectsPlayer(()=>now,()=>0);
  cleanups.push(player.attach(()=>output));
  const pending=player.playInteraction();
  assert.equal(output.calls.length,1,'Audio activation must stay synchronous');
  assert.equal(await pending,true);
  now=20;assert.equal(await player.playInteraction(),false);
  player.setEnabled(false);now=200;assert.equal(await player.playInteraction(),false);
  player.setEnabled(true);player.setVolume(0);assert.equal(await player.playInteraction(),false);
  player.setVolume(.35);assert.equal(await player.playInteraction(),true);
  assert.deepEqual(output.calls.map(([cue])=>cue),['select','page']);
});

test('random draws handle both ends of the random range and invalid samples safely', async () => {
  for(const value of [0,1,NaN,-1,2]) {
    let now=0;
    const output=new Output();
    const player=new SoundEffectsPlayer(()=>now,()=>value);
    cleanups.push(player.attach(()=>output));
    for(let i=0;i<20;i++){assert.equal(await player.playInteraction(),true);now+=200;}
    assert.ok(output.calls.every(([cue])=>soundCollection.some(sound=>sound.cue===cue)));
    assert.equal(new Set(output.calls.slice(0,18).map(([cue])=>cue)).size,18);
  }
});
