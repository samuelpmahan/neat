// DevTools boundary cases (spec: pxc-devtools_mGM.md), executed against real
// exec-boards (src/core/exec.js). Fixtures per the spec: a fresh Counter with
// count=2 and getterCalls=0; a produced Part with addressed/inline inputs;
// an add Calculation with inputs 3 and 5.
import assert from 'node:assert/strict';
import { createExecBoard, pxKey, pxFn, invokePql } from '../../discstudio-uds/src/core/exec.js';
import { discover, read, trace, runGetter, runMethod, runCalculation, runCalculationAsync, preflight, scratch, reviewTicks } from './devtools.mjs';

const cases = [];
function run(caseId, fn) { cases.push([caseId, fn]); }

const tag = Symbol('tag');
class Counter {
  constructor() {
    this.count = 2;
    this.getterCalls = 0;
    Object.defineProperty(this, 'hidden', { value: 7, enumerable: false });
    this[tag] = 'marked';
  }
  get doubled() { this.getterCalls++; return this.count * 2; }
  increment(n) { this.count += n; return this.count; }
  toJSON() { throw new Error('toJSON must never run during inspection'); }
}

run('devtools.m.object', () => {
  const c = new Counter();
  const opened = read(c);
  assert.equal(opened.class, 'Counter');
  assert.ok(opened.methods.includes('increment'), 'methods listed');
  assert.ok(Object.keys(opened.own).some(k => k === 'Symbol(tag)'), 'symbol field visible');
  assert.equal(opened.own.hidden.enumerable, false, 'non-enumerable field visible');
  assert.equal(opened.prototypeMembers.doubled.kind, 'accessor', 'getter reported, not run');
  assert.equal(c.getterCalls, 0, 'no getter executed during inspection');
  assert.equal(read(c).identity, opened.identity, 'real identity: stable across reads');
  assert.notEqual(read(new Counter()).identity, opened.identity, 'distinct objects differ');
});

run('devtools.m.trace', () => {
  const board = createExecBoard();
  board.set('px.mold.buzzz', { name: 'Buzzz' });
  board.register(pxFn('fn.makeDisc'), ({ mold, nickname }) => ({ id: 'd1', moldName: mold.name, nickname }));
  const composition = {
    PrincipleComponentRender: 'trace-fixture',
    Ticks: [{ name: 'Make', Calculations: [
      { call: 'fn.makeDisc', with: { mold: pxKey('px.mold.buzzz') }, args: { nickname: 'Minty' }, into: 'px.disc.d1' },
    ] }],
  };
  const runRecord = invokePql(composition, board);
  const t = trace(runRecord, 'px.disc.d1');
  assert.equal(t.producedBy.call, 'fn.makeDisc');
  const byName = Object.fromEntries(t.inputs.map(i => [i.name, i]));
  assert.equal(byName.mold.address, 'px.mold.buzzz', 'alias unwrapped to the exact Part identity');
  assert.equal(byName.mold.inline, false);
  assert.equal(byName.nickname.inline, true, 'literal arg flagged inline');
  assert.equal(byName.nickname.value, 'Minty');
});

run('devtools.m.getter', () => {
  const c = new Counter();
  const { result, receipt, effects } = runGetter(c, 'doubled');
  assert.equal(result, 4);
  assert.equal(c.getterCalls, 1, 'the actual receiver ran its getter once');
  assert.equal(receipt.status, 'ok');
  assert.deepEqual(effects.getterCalls, { from: 0, to: 1 });
});

run('devtools.m.method', () => {
  const c = new Counter();
  const { result, receipt, effects } = runMethod(c, 'increment', [3]);
  assert.equal(result, 5);
  assert.equal(c.count, 5, 'the actual receiver changed');
  assert.equal(receipt.status, 'ok');
  assert.deepEqual(effects.count, { from: 2, to: 5 });
});

run('devtools.m.async', async () => {
  const board = createExecBoard();
  board.register(pxFn('fn.add'), async ({ a, b }) => a + b);
  const handle = runCalculationAsync(board, 'fn.add', { a: 3, b: 5 }, 'px.sum');
  assert.equal(handle.state, 'running', 'running state visible before resolution');
  const { result, receipt } = await handle.promise;
  assert.equal(result, 8);
  assert.equal(receipt.status, 'ok');
  assert.equal(board.get('px.sum'), 8);
});

run('devtools.m.failure', () => {
  const board = createExecBoard();
  board.register(pxFn('fn.boom'), () => { throw new Error('kaput'); });
  const { result, receipt } = runCalculation(board, 'fn.boom', {}, 'px.boom.out');
  assert.equal(result, undefined);
  assert.equal(receipt.status, 'failed');
  assert.match(receipt.error, /kaput/);
  assert.equal(board.has('px.boom.out'), false, 'no produced result');
});

run('devtools.m.binding', () => {
  const board = createExecBoard();
  let invoked = 0;
  board.register(pxFn('fn.counted'), () => { invoked++; return 1; });
  assert.throws(() => preflight(board, { call: 'fn.counted', with: { x: 'px.never.produced' }, into: 'px.out' }), /never produced/);
  board.set('px.a.1', 1); board.set('px.a.2', 2);
  assert.throws(() => preflight(board, { call: 'fn.counted', with: { x: 'px.a.*' }, into: 'px.out' }), /ambiguous/);
  assert.equal(invoked, 0, 'rejected before any execution');
  assert.equal(preflight(board, { call: 'fn.counted', with: { x: 'px.a.1' }, into: 'px.out' }), true);
});

run('devtools.m.scratch', () => {
  const board = createExecBoard();
  board.set('px.app.selection', 'discA');
  const address = scratch(board, 'alt', 'discB');
  assert.equal(address, 'devtools.scratch.alt');
  assert.equal(board.get('devtools.scratch.alt'), 'discB');
  assert.equal(board.get('px.app.selection'), 'discA', 'the application selection is unchanged');
});

run('devtools.m.tick', () => {
  const board = createExecBoard();
  board.set('px.catalog', { mako3: { name: 'Mako3', flight: { speed: 5, glide: 5, turn: 0, fade: 0 } } });
  board.register(pxFn('fn.findMold'), ({ catalog, name }) => catalog[name]);
  board.register(pxFn('fn.makeDisc'), ({ mold, nickname }) => ({ nickname, mold: mold.name }));
  board.register(pxFn('fn.viewDisc'), ({ disc, mold }) => ({ ...disc, flight: mold.flight }));
  const composition = {
    PrincipleComponentRender: 'upload-sequence',
    Ticks: [
      { name: 'Resolve', Calculations: [{ call: 'fn.findMold', with: { catalog: 'px.catalog' }, args: { name: 'mako3' }, into: 'px.mold' }] },
      { name: 'Create', Calculations: [{ call: 'fn.makeDisc', with: { mold: 'px.mold' }, args: { nickname: 'Minty' }, into: 'px.disc' }] },
      { name: 'Read', Calculations: [{ call: 'fn.viewDisc', with: { disc: 'px.disc', mold: 'px.mold' }, into: 'px.disc.view' }] },
    ],
  };
  const review = reviewTicks(invokePql, board, composition, [
    { address: 'px.mold', expect: { name: 'Mako3', flight: { speed: 5, glide: 5, turn: 0, fade: 0 } } },
    { address: 'px.disc.view', expect: { nickname: 'Minty', mold: 'Mako3', flight: { speed: 5, glide: 5, turn: 0, fade: 0 } } },
  ]);
  assert.deepEqual(review.ticks.map(t => t.name), ['Resolve', 'Create', 'Read'], 'start → actions in order');
  assert.deepEqual(review.mismatches, [], 'boundary assertions hold');
  const bad = reviewTicks(invokePql, board, composition, [{ address: 'px.disc.view', expect: { nickname: 'Wrong' } }]);
  assert.equal(bad.mismatches.length, 1, 'mismatches are inspectable');
  assert.deepEqual(bad.mismatches[0].actual.nickname, 'Minty');
  assert.equal(review.accepted, undefined, 'a review reports; acceptance is unchanged');
});

// run every case, awaiting async ones, then report
const results = [];
for (const [id, fn] of cases) {
  try { await fn(); results.push([id, 'PASS']); }
  catch (e) { results.push([id, 'FAIL: ' + String(e.message).split('\n')[0]]); }
}
for (const [id, status] of results) console.log(`${status} ${id}`);
if (results.some(([, s]) => s !== 'PASS')) process.exit(1);
console.log('done');
