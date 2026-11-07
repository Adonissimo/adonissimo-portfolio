/** Small, deterministic cloud textures; generated once, then composited as slow layers. */
function smooth(low: number, high: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}
function hash(x: number, y: number, seed: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}
function noise(x: number, y: number, period: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const wrap = (n: number) => (n % period + period) % period;
  const u = smooth(0, 1, x - ix), v = smooth(0, 1, y - iy);
  const a = hash(wrap(ix), iy, seed), b = hash(wrap(ix + 1), iy, seed);
  const c = hash(wrap(ix), iy + 1, seed), d = hash(wrap(ix + 1), iy + 1, seed);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
function fbm(x: number, y: number, period: number, seed: number): number {
  let value = 0, amplitude = .55, weight = 0;
  for (let octave = 0; octave < 5; octave++) {
    value += noise(x, y, period, seed + octave * 17) * amplitude;
    weight += amplitude; amplitude *= .5; x *= 2; y *= 2; period *= 2;
  }
  return value / weight;
}

export function cloudDensity(u: number, v: number, seed = 84): number {
  const x = u * 4, y = v * 3;
  const warpX = fbm(x, y, 4, seed), warpY = fbm(x + 11.4, y + 8.2, 4, seed + 29);
  const body = fbm(x * 2 + warpX * 1.9, y * 1.35 + warpY * 1.4, 8, seed + 61);
  const billow = smooth(.24, .7, body);
  const edge = smooth(0, .11, v) * (1 - smooth(.86, 1, v));
  return Math.min(.9, billow * edge * .9);
}

export function cloudPixels(width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    const density = cloudDensity(x / width, y / (height - 1));
    data[index] = data[index + 1] = data[index + 2] = Math.round(175 + 80 * Math.sqrt(density / .9));
    data[index + 3] = Math.round(density * 255);
  }
  return data;
}

export function fogBudget(compact: boolean) {
  return compact ? { pixels: 100000, fps: 12, textureWidth: 128, textureHeight: 96 } : { pixels: 200000, fps: 18, textureWidth: 192, textureHeight: 128 };
}
export function fogCanvasSize(width: number, height: number, compact: boolean) {
  const w = Number.isFinite(width) ? Math.max(1, width) : 1;
  const h = Number.isFinite(height) ? Math.max(1, height) : 1;
  const scale = Math.min(1, Math.sqrt(fogBudget(compact).pixels / (w * h)));
  return { width: Math.max(1, Math.floor(w * scale)), height: Math.max(1, Math.floor(h * scale)) };
}

export type FogAppearance = { tone: string; left: number; right: number; quiet: boolean };
export type FogClock = { request(callback: FrameRequestCallback): number; cancel(id: number): void };
// Two small CPU buffers also survive the welcome-to-page portal handoff.
const textureCache = new Map<boolean, Uint8ClampedArray>();
const planes = [
  { width: 1.55, height: 1.4, top: -.2, offset: .12, speed: .00035, alpha: .62 },
  { width: 1.3, height: .92, top: .12, offset: .48, speed: -.0005, alpha: .67 },
  { width: 1.8, height: .58, top: .6, offset: .77, speed: .0007, alpha: .74 }
];

/** One bounded canvas and one cached cloud tile; no procedural work in the animation loop. */
export function createFogRenderer(canvas: HTMLCanvasElement, compact: boolean, clock: FogClock) {
  const context = canvas.getContext('2d', { alpha: true });
  const tile = canvas.ownerDocument.createElement('canvas');
  const texture = tile.getContext('2d', { alpha: true });
  if (!context || !texture) return null;
  const budget = fogBudget(compact);
  tile.width = budget.textureWidth; tile.height = budget.textureHeight;
  const pixels = texture.createImageData(tile.width, tile.height);
  let cached = textureCache.get(compact);
  if (!cached) { cached = cloudPixels(tile.width, tile.height); textureCache.set(compact, cached); }
  const source = cached;
  pixels.data.set(source);
  texture.putImageData(pixels, 0, 0);
  let appliedTone = '';
  let appearance: FogAppearance = { tone: '#c2d6d0', left: .08, right: .92, quiet: false };
  let frame = 0, disposed = false, active = false, elapsed = 0, last = 0, painted = -Infinity;

  function draw() {
    if (disposed) return;
    const w = canvas.width, h = canvas.height;
    context!.clearRect(0, 0, w, h);
    context!.globalCompositeOperation = 'source-over';
    for (const [index, plane] of planes.entries()) {
      const width = w * plane.width, height = h * plane.height;
      const phase = ((plane.offset + elapsed * plane.speed) % 1 + 1) % 1;
      const x = -phase * width, y = h * plane.top + Math.sin(elapsed * .025 + index * 2) * h * .012;
      context!.globalAlpha = plane.alpha;
      context!.drawImage(tile, x, y, width, height);
      context!.drawImage(tile, x + width, y, width, height);
    }
    context!.globalAlpha = 1;
    // Keep the texture visible over scenery and cards, with a fixed reading ceiling.
    const left = Number.isFinite(appearance.left) ? Math.max(0, Math.min(.45, appearance.left)) : .08;
    const right = Number.isFinite(appearance.right) ? Math.max(.55, Math.min(1, appearance.right)) : .92;
    const mask = context!.createLinearGradient(0, 0, w, 0);
    mask.addColorStop(0, appearance.quiet ? '#ffffff66' : '#ffffffff');
    mask.addColorStop(Math.max(0, left - .025), appearance.quiet ? '#ffffff66' : '#ffffffff');
    mask.addColorStop(Math.min(.49, left + .02), '#ffffff2e');
    mask.addColorStop(Math.max(.51, right - .02), '#ffffff2e');
    mask.addColorStop(Math.min(1, right + .025), appearance.quiet ? '#ffffff66' : '#ffffffff');
    mask.addColorStop(1, appearance.quiet ? '#ffffff66' : '#ffffffff');
    context!.globalCompositeOperation = 'destination-in';
    context!.fillStyle = mask; context!.fillRect(0, 0, w, h);
    context!.globalCompositeOperation = 'source-over';
  }
  function tick(timestamp: number) {
    frame = 0;
    if (!active || disposed) return;
    const delta = last ? Math.max(0, Math.min(.2, (timestamp - last) / 1000)) : 0;
    last = timestamp; elapsed += delta;
    if (timestamp - painted >= 1000 / budget.fps) { draw(); painted = timestamp; }
    frame = clock.request(tick);
  }
  return {
    resize(width: number, height: number) {
      if (disposed) return;
      const size = fogCanvasSize(width, height, compact);
      canvas.width = size.width; canvas.height = size.height;
      context.imageSmoothingEnabled = true; draw();
    },
    appearance(value: FogAppearance) {
      if (disposed) return;
      appearance = value;
      if (appliedTone !== value.tone) {
        const tone = /^#[\da-f]{6}$/i.test(value.tone) ? value.tone.slice(1) : 'c2d6d0';
        const channels = [0, 2, 4].map(offset => Number.parseInt(tone.slice(offset, offset + 2), 16));
        for (let i = 0; i < source.length; i += 4) {
          for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.round(source[i + c] * channels[c] / 255);
        }
        texture.putImageData(pixels, 0, 0); appliedTone = value.tone;
      }
      draw();
    },
    active(value: boolean) {
      if (disposed || active === value) return;
      active = value; last = 0;
      if (frame) clock.cancel(frame);
      frame = active ? clock.request(tick) : 0;
    },
    dispose() {
      disposed = true; active = false;
      if (frame) clock.cancel(frame);
      frame = 0; tile.width = tile.height = 1;
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}
