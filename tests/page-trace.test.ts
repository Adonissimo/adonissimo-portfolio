import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { canTracePage } from '../lib/page-trace.ts';

type Trace = typeof import('../lib/page-trace.ts');

function harness(pathname = '/', stall = false) {
  let removed = false, mainText = 'Outgoing page', capturedText = '', privateRemoved = false, idsRemoved = false;
  let deadline: (() => void) | undefined;
  const clone = { textContent: mainText, style: {}, removeAttribute() {}, querySelectorAll(selector: string) {
    if (selector === 'img') return [];
    return selector.includes('form') ? [{ remove() { privateRemoved = true; } }] : [{ removeAttribute() { idsRemoved = true; } }];
  } };
  const main = { cloneNode() { clone.textContent = mainText; return clone; }, getBoundingClientRect: () => ({ top: -100 }) };
  const source = { className: '', style: {}, inert: false, setAttribute() {}, append() {}, remove() { removed = true; } };
  const screenshot = { width: 800, height: 500 };
  let options: Record<string, unknown> | undefined;
  const compiledModule = { exports: {} as Trace };
  const compiled = ts.transpileModule(readFileSync(new URL('../lib/page-trace.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(compiled, {
    exports: compiledModule.exports, module: compiledModule, AbortController,
    require: () => ({ toCanvas: (_element: unknown, captureOptions: Record<string, unknown>) => { capturedText = clone.textContent; options = captureOptions; return stall ? new Promise(() => {}) : Promise.resolve(screenshot); } }),
    window: { location: { pathname }, innerHeight: 900 },
    document: { querySelector: (selector: string) => selector === 'main' ? main : selector === 'header' ? { getBoundingClientRect: () => ({ bottom: 74 }) } : null, documentElement: { clientWidth: 1600 }, body: { append() {} }, createElement: () => source },
    getComputedStyle: () => ({ backgroundColor: '#11292a' }),
    setTimeout: (callback: () => void) => { deadline = callback; return 1; }, clearTimeout() {}
  });
  return { capture: compiledModule.exports.capturePageTrace, changePage() { mainText = 'Incoming page'; }, expire: () => deadline?.(), state: () => ({ removed, capturedText, privateRemoved, idsRemoved, options, source, clone, screenshot }) };
}

test('page traces accept only public portfolio routes', () => {
  for (const path of ['/', '/about', '/contact', '/projects', '/projects/real-work', '/blog/a-note']) assert.equal(canTracePage(path), true);
  for (const path of ['/admin', '/admin/messages', '/login', '/reset-password', '/projects-old', '/unknown']) assert.equal(canTracePage(path), false);
});

test('capture freezes outgoing public content, strips sensitive controls and cleans up its inert clone', async () => {
  const h = harness(), pending = h.capture(true); h.changePage();
  assert.equal(await pending, h.state().screenshot);
  const state = h.state();
  assert.equal(state.capturedText, 'Outgoing page'); assert.ok(state.privateRemoved); assert.ok(state.idsRemoved); assert.ok(state.removed); assert.ok(state.source.inert);
  assert.ok(Number(state.options!.canvasWidth) * Number(state.options!.canvasHeight) <= 420_000);
});

test('private routes never capture and a stalled capture is bounded and removed', async () => {
  const privatePage = harness('/admin'); assert.equal(await privatePage.capture(false), null); assert.equal(privatePage.state().capturedText, '');
  const h = harness('/', true), pending = h.capture(false);
  await Promise.resolve(); await Promise.resolve(); h.expire();
  assert.equal(await pending, null); assert.ok(h.state().removed);
});

test('a new turn immediately cancels obsolete capture work', async () => {
  const h = harness('/', true), previous = h.capture(false), latest = h.capture(false);
  assert.equal(await previous, null);
  h.expire(); assert.equal(await latest, null); assert.ok(h.state().removed);
});
