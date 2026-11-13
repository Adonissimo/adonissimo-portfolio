import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';
import * as motion from '../lib/three-motion.ts';
import type { createThreeRenderer } from '../lib/three-renderer.ts';

/** Real scene/geometry code with only the GPU and browser clock replaced. */
function harness() {
  const pending = new Map<number, FrameRequestCallback>();
  let id = 0, now = 0, draws = 0, disposed = false, contextLost = false, fail = false, ratio = 1;
  let renderedScene: THREE.Scene | undefined;
  class Renderer {
    setClearColor() {} setSize() {}
    setPixelRatio(value: number) { ratio = value; }
    render(scene: THREE.Scene) { if (fail) throw new Error('Test GPU failure'); renderedScene = scene; draws++; }
    dispose() { disposed = true; }
    forceContextLoss() { contextLost = true; }
  }
  const compiled = ts.transpileModule(readFileSync(new URL('../lib/three-renderer.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} as { createThreeRenderer: typeof createThreeRenderer } };
  runInNewContext(compiled, {
    exports: compiledModule.exports, module: compiledModule,
    require: (name: string) => name === 'three' ? { ...THREE, WebGLRenderer: Renderer } : motion,
    window: { devicePixelRatio: 3 },
    document: { createElement: () => ({ width: 0, height: 0, getContext: () => null }) },
    requestAnimationFrame: (callback: FrameRequestCallback) => { pending.set(++id, callback); return id; },
    cancelAnimationFrame: (key: number) => pending.delete(key)
  });
  return {
    create: compiledModule.exports.createThreeRenderer,
    step(ms = 40) { now += ms; const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(callback => callback(now)); },
    pending: () => pending.size, draws: () => draws, ratio: () => ratio,
    disposed: () => disposed && contextLost,
    scene: () => renderedScene,
    fail: () => { fail = true; }
  };
}

test('Three renderer pauses, resumes, caps pixels and disposes an active scene', () => {
  const h = harness(), scene = h.create({} as HTMLCanvasElement, 'hero', true);
  scene.resize(2000, 1000);
  assert.ok(2000 * 1000 * h.ratio() ** 2 <= motion.threeBudget(true).pixels + 1);
  scene.setActive(true); assert.equal(h.pending(), 1);
  h.step(); h.step(); assert.ok(h.draws() > 1);
  scene.setActive(false); assert.equal(h.pending(), 0);
  scene.setActive(true); assert.equal(h.pending(), 1);
  scene.dispose(); scene.dispose(); assert.equal(h.pending(), 0); assert.ok(h.disposed());
});

test('paper turns replace earlier turns, stop after completion and cancel immediately', () => {
  const h = harness(), scene = h.create({} as HTMLCanvasElement, 'paper', false);
  scene.resize(1200, 800); scene.setActive(true);
  scene.turn(false, 940); h.step(); h.step(); scene.turn(true, 720);
  assert.equal(h.pending(), 1);
  for (let i = 0; i < 30; i++) h.step();
  assert.equal(h.pending(), 0);
  scene.turn(false, 940); assert.equal(h.pending(), 1);
  scene.cancelTurn(); h.step(); assert.equal(h.pending(), 0);
  scene.dispose();
});

test('a GPU render failure reports fallback and never restarts a failed renderer', () => {
  const h = harness(), scene = h.create({} as HTMLCanvasElement, 'entry', false);
  let failures = 0; scene.failure(() => { failures++; });
  h.fail(); scene.resize(1000, 700); assert.equal(failures, 1);
  scene.setActive(true); h.step(); assert.equal(h.pending(), 0);
  scene.theme(true); assert.equal(failures, 1); scene.dispose(); assert.ok(h.disposed());
});

test('realistic scenery has reflection lighting, material relief and finite detailed geometry', () => {
  const h = harness(), renderer = h.create({} as HTMLCanvasElement, 'hero', true);
  renderer.resize(900, 600);
  const scene = h.scene(); assert.ok(scene?.environment);
  let relief = 0, metal = 0, detailed = 0;
  const ownedTextures = new Set<THREE.Texture>([scene.environment]);
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const positions = object.geometry.attributes.position;
    assert.ok(Array.from(positions.array).every(Number.isFinite));
    if (positions.count > 100) detailed++;
    const material = object.material as THREE.MeshStandardMaterial;
    if (material.bumpMap) { relief++; ownedTextures.add(material.bumpMap); }
    if (material.roughnessMap) ownedTextures.add(material.roughnessMap);
    if (material.metalness > .9) metal++;
  });
  assert.ok(relief > 5); assert.ok(metal >= 3); assert.ok(detailed > 5);
  let released = 0;
  ownedTextures.forEach(texture => texture.addEventListener('dispose', () => { released++; }));
  renderer.dispose(); assert.equal(released, ownedTextures.size);
});
