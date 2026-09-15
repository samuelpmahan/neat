// Remaining boundary cases (specs: upload-disc-to-shelf, explore-shelf mGM).
// The producer refinement lives in ./specialize.mjs; the demo runtime covers
// the refusal/undo paths. Every case is a real execution, labeled by what ran.
import assert from 'node:assert/strict';
import { shelfQuery } from '../../discstudio-uds/src/shelf.js';
import { createStudioRuntime } from '../../discstudio-uds/src/runtime.js';
import { createSeed } from '../../discstudio-uds/src/seed.js';
import { get } from '../../discstudio-uds/src/domain.js';
import { newBoard, commit, current, retained, versionCount, makeDisc, resolveFlight, specialize, despecialize, correctCatalog, persist, restore } from './specialize.mjs';

const cases = [];
function run(caseId, fn) { cases.push([caseId, fn]); }

/** Spec fixture: synthetic mold with flight 5,5,0,0; two specimens sharing it. */
function moldFixture() {
  const board = newBoard();
  commit(board, 'px.mold', { id: 'syn', name: 'Syn', flight: { speed: 5, glide: 5, turn: 0, fade: 0 } });
  commit(board, 'px.disc.a', makeDisc('discA', 'px.mold', 1));
  commit(board, 'px.disc.b', makeDisc('discB', 'px.mold', 1));
  return board;
}

run('upload.m.specialize', () => {
  const board = moldFixture();
  specialize(board, 'px.disc.a', 'turn', -1);
  assert.deepEqual(resolveFlight(board, current(board, 'px.disc.a')), { speed: 5, glide: 5, turn: -1, fade: 0 }, 'only turn differs');
  assert.equal(retained(board, 'px.mold', 1).flight.turn, 0, 'the mold is unchanged');
  assert.deepEqual(resolveFlight(board, current(board, 'px.disc.b')), { speed: 5, glide: 5, turn: 0, fade: 0 }, 'discB is unchanged');
  assert.deepEqual(retained(board, 'px.disc.a', 1).own, {}, 'the pre-specialization version is retained');
});

run('upload.m.inherit', () => {
  const board = moldFixture();
  specialize(board, 'px.disc.a', 'turn', -1);
  despecialize(board, 'px.disc.a', 'turn');
  assert.equal(resolveFlight(board, current(board, 'px.disc.a')).turn, 0, 'turn resolves to the mold’s 0');
});

run('upload.m.presence', () => {
  const board = newBoard();
  commit(board, 'px.mold', { id: 'syn', name: 'Syn', flight: { speed: 5, glide: 5, turn: -1, fade: 0 } });
  commit(board, 'px.disc.a', makeDisc('discA', 'px.mold', 1, { turn: 0 }));
  assert.equal(resolveFlight(board, current(board, 'px.disc.a')).turn, 0, 'explicit zero wins over the base -1');
  commit(board, 'px.disc.b', makeDisc('discB', 'px.mold', 1, { turn: 1 }));
  specialize(board, 'px.disc.b', 'turn', null); // assigning null clears the own-field
  const discB = current(board, 'px.disc.b');
  assert.ok(!Object.hasOwn(discB.own, 'turn'), 'no shadow null is retained');
  assert.equal(resolveFlight(board, discB).turn, -1, 'the cleared field falls back to the retained base');
  // Unknown lives at the source: an unreleased mold carries nulls; discs inherit them.
  commit(board, 'px.mold.u', { id: 'unrel', name: 'Unreleased', flight: { speed: null, glide: null, turn: null, fade: null } });
  commit(board, 'px.disc.u', makeDisc('discU', 'px.mold.u', 1));
  assert.deepEqual(resolveFlight(board, current(board, 'px.disc.u')), { speed: null, glide: null, turn: null, fade: null }, 'source nulls read as unknown');
});

run('upload.m.catalog', () => {
  const board = moldFixture();
  correctCatalog(board, 'px.mold', { turn: -1 });
  assert.equal(versionCount(board, 'px.mold'), 2);
  assert.deepEqual(resolveFlight(board, current(board, 'px.disc.a')), { speed: 5, glide: 5, turn: 0, fade: 0 }, 'the saved disc keeps its retained base');
  commit(board, 'px.disc.c', makeDisc('discC', 'px.mold', 2));
  assert.equal(resolveFlight(board, current(board, 'px.disc.c')).turn, -1, 'a new disc may select the corrected base');
});

const causeChain = e => { const msgs = []; let c = e; while (c) { msgs.push(String(c.message)); c = c.cause; } return msgs.join(' | '); };

run('upload.m.reject', () => {
  const r = createStudioRuntime(createSeed());
  const n = Object.keys(r.world().objects.Disc).length;
  let err = null;
  try {
    r.dispatch({ type: 'disc.create', id: 'buzzz-mint', manufacturer: 'X', mold: 'Y', category: 'Putter', plastic: 'Z', weight: 170, color: 'Red', nickname: '', photo: null, bagId: null });
  } catch (e) { err = e; }
  assert.ok(err, 'invalid input produces no false success');
  assert.match(causeChain(err), /Invalid new disc/, 'the refusal names the real reason');
  assert.equal(Object.keys(r.world().objects.Disc).length, n, 'nothing was created');
  // Overlapping saves (serial in the demo): both land, no lost membership.
  const mk = id => ({ type: 'disc.create', id, manufacturer: 'Innova', mold: 'Mako3', category: 'Midrange', plastic: 'Champion', weight: 180, color: 'Blue', nickname: '', photo: null, bagId: 'everyday' });
  r.dispatch(mk('disc-r1')); r.dispatch(mk('disc-r2'));
  const w = r.world();
  assert.ok(w.objects.Disc['disc-r1'] && w.objects.Disc['disc-r2'], 'both saves landed');
  assert.ok(w.objects.Bag.everyday.discIds.includes('disc-r1') && w.objects.Bag.everyday.discIds.includes('disc-r2'), 'no lost membership');
});

run('upload.m.discard', () => {
  const r = createStudioRuntime(createSeed());
  const beforeDiscs = Object.keys(r.world().objects.Disc).sort();
  const beforeMolds = JSON.stringify(r.world().objects.Mold);
  r.dispatch({ type: 'disc.create', id: 'disc-draft', manufacturer: 'Innova', mold: 'Mako3', category: 'Midrange', plastic: 'Champion', weight: 180, color: 'Blue', nickname: '', photo: null, bagId: null });
  assert.ok(r.world().objects.Disc['disc-draft'], 'the draft exists');
  r.undo.pop('px.studio.world'); // one atomic create, one undo
  assert.deepEqual(Object.keys(r.world().objects.Disc).sort(), beforeDiscs, 'saved specimens unchanged');
  assert.equal(JSON.stringify(r.world().objects.Mold), beforeMolds, 'the mold is unchanged');
  assert.ok(r.pxc.has('px.receipt.studio-undo'), 'the discard has a receipt');
});

// Explore consumer wiring over the same refinement: find → select → edit → read.
function exploreParts() {
  const board = moldFixture();
  const makers = { discraft: { id: 'discraft', name: 'Discraft' } };
  const molds = { syn: { id: 'syn', name: 'Syn', manufacturerId: 'discraft', category: 'Midrange', flight: { speed: 5, glide: 5, turn: 0, fade: 0 } } };
  const discs = [
    { id: 'discA', moldId: 'syn', nickname: 'Minty', plastic: 'ESP', weight: 177, color: 'Mint', photo: null, notes: '' },
    { id: 'discB', moldId: 'syn', nickname: '', plastic: 'ESP', weight: 175, color: 'Rose', photo: null, notes: '' },
  ];
  return { board, shelf: { discs, molds, makers, bags: [] } };
}
const partAddr = id => id === 'discA' ? 'px.disc.a' : 'px.disc.b';

run('explore.m.edit', () => {
  const { board, shelf } = exploreParts();
  const found = shelfQuery({ ...shelf, query: 'minty' }).rows;
  assert.deepEqual(found.map(r => r.id), ['discA'], 'find selects discA');
  specialize(board, partAddr(found[0].id), 'turn', -1);
  const flight = resolveFlight(board, current(board, partAddr('discA')));
  assert.deepEqual(flight, { speed: 5, glide: 5, turn: -1, fade: 0 }, 'only that field specializes');
  assert.deepEqual(resolveFlight(board, current(board, partAddr('discB'))), { speed: 5, glide: 5, turn: 0, fade: 0 }, 'discB unchanged');
  assert.equal(retained(board, 'px.mold', 1).flight.turn, 0, 'mold unchanged');
});

run('explore.m.inherit', () => {
  const { board } = exploreParts();
  specialize(board, 'px.disc.a', 'turn', -1);
  despecialize(board, 'px.disc.a', 'turn');
  assert.equal(resolveFlight(board, current(board, 'px.disc.a')).turn, 0, 'resolved turn comes from its retained mold');
});

run('explore.m.keep', () => {
  const { board } = exploreParts();
  specialize(board, 'px.disc.a', 'turn', -1);
  const snap = persist(board, ['px.disc.a', 'px.mold']); // target + source context
  const b2 = restore(snap); // reload
  const disc = current(b2, 'px.disc.a');
  assert.equal(disc.id, 'discA', 'same target');
  assert.equal(resolveFlight(b2, disc).turn, -1, 'correction retained');
  assert.deepEqual(disc.mold, { address: 'px.mold', version: 1 }, 'source context restored');
  // NOTE: the spec's {?} (whether m also retains the whole collection and
  // images) is Sam's call; this run retains the target + its source context.
});

run('explore.m.failure', () => {
  const r = createStudioRuntime(createSeed());
  const n = Object.keys(r.world().objects.Disc).length;
  let err = null;
  try { r.dispatch({ type: 'entity.set', entityType: 'Disc', id: 'nope', path: 'nickname', value: 'x' }); }
  catch (e) { err = e; }
  assert.ok(err, 'rejected write is visible');
  assert.match(causeChain(err), /is missing/, 'the refusal names the missing entity');
  assert.equal(Object.keys(r.world().objects.Disc).length, n, 'no false save');
  assert.throws(() => restore('{"v":1,"parts":{"px.disc.a":{"n":2,"values":[{}}]}}}'.slice(0, 40)), /corrupt payload/, 'corrupt stored data fails visibly');
  assert.throws(() => restore('{"v":1,"parts":{"px.disc.a":{"n":2,"values":[{"id":"x"}]}}}'), /corrupt part/, 'inconsistent versions fail visibly');
  // Neither path returns an empty shelf in place of the failure.
});

const results = [];
for (const [id, fn] of cases) {
  try { await fn(); results.push([id, 'PASS']); }
  catch (e) { results.push([id, 'FAIL: ' + String(e.message).split('\n')[0]]); }
}
for (const [id, status] of results) console.log(`${status} ${id}`);
if (results.some(([, s]) => s !== 'PASS')) process.exit(1);
console.log('done');
