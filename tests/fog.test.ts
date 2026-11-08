import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudDensity, cloudPixels, createFogRenderer, fogBudget, fogCanvasSize } from '../lib/fog.ts';

test('clouds have visible uneven density, soft vertical edges and a seamless wind loop', () => {
  const data = cloudPixels(96, 64);
  const values: number[] = [];
  for (let y = 0; y < 64; y++) for (let x = 0; x < 96; x++) {
    const alpha = data[(y * 96 + x) * 4 + 3];
    assert(alpha >= 0 && alpha <= 230);
    if (y === 0 || y === 63) assert.equal(alpha, 0);
    else values.push(alpha);
  }
  assert(values.filter(value => value > 100).length > values.length * .35, 'The cloud field must be visibly present at initial paint.');
  assert(values.filter(value => value < 30).length > values.length * .05, 'Clear gaps keep the result from becoming a uniform white veil.');
  for (const v of [.1, .3, .5, .75, .9]) assert(Math.abs(cloudDensity(0, v) - cloudDensity(1, v)) < 1e-10);
  assert.deepEqual(cloudPixels(32, 24), cloudPixels(32, 24));
});

test('phone and desktop fog buffers are bounded independently of high DPI', () => {
  for (const compact of [false, true]) for (const [w, h] of [[390, 844], [1440, 900], [3840, 2160], [0, 0], [Infinity, NaN]]) {
    const size = fogCanvasSize(w, h, compact);
    assert(size.width >= 1 && size.height >= 1);
    assert(size.width * size.height <= fogBudget(compact).pixels);
  }
  assert(fogBudget(true).fps < fogBudget(false).fps);
});

function surface() {
  const stops: Array<[number, string]> = [];
  const draws: Array<{ alpha: number; operation: string }> = [];
  let paints = 0, textures = 0;
  const context = {
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', imageSmoothingEnabled: true,
    clearRect() {}, fillRect() {}, drawImage() { paints++; draws.push({ alpha: this.globalAlpha, operation: this.globalCompositeOperation }); },
    createLinearGradient() { return { addColorStop(position: number, color: string) { stops.push([position, color]); } }; },
    createImageData(w: number, h: number) { return { data: new Uint8ClampedArray(w * h * 4) }; },
    putImageData() { textures++; }
  };
  const tile = { width: 1, height: 1, getContext: () => context };
  const canvas = { width: 1, height: 1, getContext: () => context, ownerDocument: { createElement: () => tile } };
  const frames = new Map<number, FrameRequestCallback>(); let id = 0;
  return { canvas, context, stops, draws, frames, tile, paints: () => paints, textures: () => textures,
    clock: { request(callback: FrameRequestCallback) { frames.set(++id, callback); return id; }, cancel(key: number) { frames.delete(key); } } };
}

test('fog paints a continuous field immediately, reuses its tile and stops all work on pause/dispose', () => {
  const env = surface();
  const painter = createFogRenderer(env.canvas as unknown as HTMLCanvasElement, true, env.clock)!;
  painter.appearance({ tone: '#c2d6d0', quiet: false });
  painter.resize(390, 844);
  assert(env.paints() > 0, 'A visible frame is drawn before the first animation tick.');
  assert.equal(env.stops.length, 0, 'A reading-column cutout must not divide the atmosphere into bright edges and a dark box.');
  assert(env.draws.every(draw => draw.operation === 'source-over' && draw.alpha > 0 && draw.alpha < .5));
  const textures = env.textures();
  painter.active(true); assert.equal(env.frames.size, 1);
  for (let i = 1; i <= 30; i++) { const [key, callback] = env.frames.entries().next().value!; env.frames.delete(key); callback(i * 17); }
  assert.equal(env.textures(), textures, 'No cloud noise generation or tile uploads belong in the animation loop.');
  assert.equal(env.stops.length, 0, 'Animation must not recreate a layout-shaped clearing.');
  assert.equal(env.frames.size, 1);
  painter.active(false); assert.equal(env.frames.size, 0);
  painter.active(true); painter.dispose(); assert.equal(env.frames.size, 0);
  assert.equal(env.tile.width, 1); assert.equal(env.tile.height, 1);
  const painted = env.paints(); painter.active(true); painter.resize(900, 600);
  assert.equal(env.paints(), painted);
});

test('theme, quiet settings and viewport changes preserve continuous fog without a reading mask', () => {
  const env = surface();
  const painter = createFogRenderer(env.canvas as unknown as HTMLCanvasElement, false, env.clock)!;
  painter.resize(1440, 900);
  const publicAlphas = env.draws.slice(-6).map(draw => draw.alpha);
  painter.appearance({ tone: '#a0c4ba', quiet: true });
  const quietAlphas = env.draws.slice(-6).map(draw => draw.alpha);
  assert(quietAlphas.every((alpha, i) => alpha < publicAlphas[i]), 'Private pages lower the whole effect, not a rectangular part of it.');
  const textures = env.textures();
  painter.appearance({ tone: '#a0c4ba', quiet: false });
  assert.equal(env.textures(), textures, 'Changing opacity does not regenerate the cloud texture.');
  assert.deepEqual(env.draws.slice(-6).map(draw => draw.alpha), publicAlphas);
  painter.resize(390, 844);
  assert.equal(env.stops.length, 0);
  assert(env.draws.every(draw => draw.operation === 'source-over'));
  painter.dispose();
});

test('missing canvas capabilities allow a static fallback instead of blocking the portfolio', () => {
  const env = surface();
  env.canvas.getContext = () => null as unknown as typeof env.context;
  assert.equal(createFogRenderer(env.canvas as unknown as HTMLCanvasElement, true, env.clock), null);
  assert.equal(env.frames.size, 0);
});
