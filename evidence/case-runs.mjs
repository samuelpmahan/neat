// Evidence runs for spec boundary cases, executed against the Disc Studio demo
// implementation (~/workspace/discstudio-uds) — the working, imperfectly refined
// progress the mGM specs make legible. Each run constructs the spec's fixture
// logic, executes the case's action, and asserts the case's assertion.
//
// What a PASS means: the Part x Calculation composed correctly at the boundary
// in THIS implementation. It does not claim the PxC experiment tree or the
// target refinement shape; the neat receipt names the implementation.

import assert from 'node:assert/strict';
import { shelfQuery } from '../../discstudio-uds/src/shelf.js';
import { createStudioRuntime } from '../../discstudio-uds/src/runtime.js';
import { createSeed } from '../../discstudio-uds/src/seed.js';
import { get } from '../../discstudio-uds/src/domain.js';

const results = [];
function run(caseId, fn) {
  try {
    fn();
    results.push([caseId, 'PASS']);
  } catch (e) {
    results.push([caseId, 'FAIL: ' + e.message]);
  }
}

// Spec fixture logic (explore): two Buzzz specimens sharing one mold;
// only discA is named Minty.
function exploreFixture() {
  const makers = { discraft: { id: 'discraft', name: 'Discraft' } };
  const molds = {
    buzzz: { id: 'buzzz', name: 'Buzzz', manufacturerId: 'discraft', category: 'Midrange', flight: { speed: 5, glide: 4, turn: -1, fade: 1 } },
    zone: { id: 'zone', name: 'Zone', manufacturerId: 'discraft', category: 'Putt & approach', flight: { speed: 4, glide: 3, turn: 0, fade: 3 } },
  };
  const discs = [
    { id: 'discA', moldId: 'buzzz', nickname: 'Minty', plastic: 'ESP', weight: 177, color: 'Mint', photo: null, notes: '' },
    { id: 'discB', moldId: 'buzzz', nickname: '', plastic: 'ESP', weight: 175, color: 'Rose', photo: null, notes: '' },
    { id: 'discC', moldId: 'zone', nickname: '', plastic: 'Z', weight: 173, color: 'Peach', photo: null, notes: '' },
  ];
  return { discs, molds, makers, bags: [] };
}
const ids = view => view.rows.map(r => r.id);

run('explore.m.find', () => {
  const f = exploreFixture();
  assert.deepEqual(ids(shelfQuery({ ...f, query: 'buzzz' })).sort(), ['discA', 'discB'],
    'mold text finds both specimens');
  assert.deepEqual(ids(shelfQuery({ ...f, query: 'minty' })), ['discA'],
    'nickname finds only discA');
  assert.equal(shelfQuery({ ...f, query: '' }).shown, 3, 'blank = all');
  assert.equal(shelfQuery({ ...f, query: 'zzzz' }).shown, 0, 'unmatched = empty');
});

run('explore.m.select', () => {
  const r = createStudioRuntime(createSeed());
  const rowB = r.shelf({ query: 'buzzz' }).rows.find(row => row.id === 'buzzz-rose');
  assert.ok(rowB, 'discB is selectable from the find results');
  const w = r.world();
  const disc = get(w, 'Disc', 'buzzz-rose');
  const mold = get(w, 'Mold', disc.moldId);
  const maker = get(w, 'Manufacturer', mold.manufacturerId);
  assert.equal(disc.nickname, 'Rose backup disc', "discB's own material");
  assert.equal(mold.name, 'Buzzz', "discB's retained mold");
  assert.equal(maker.name, 'Discraft', "discB's maker");
  assert.notEqual(disc.nickname, get(w, 'Disc', 'buzzz-mint').nickname, 'not discA’s material');
});

run('explore.m.empty', () => {
  const empty = shelfQuery({ discs: [], molds: {}, makers: {}, bags: [] });
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.shown, 0, 'empty shelf in → empty out, nothing invented');
  assert.equal(shelfQuery({ ...exploreFixture(), query: 'zzzz' }).shown, 0, 'unmatched → empty');
  // NOTE (partial): the distinct empty messages and the route back to upload
  // are UI copy in app.js; this run covers the composition half only.
});

run('upload.m.defaults', () => {
  const r = createStudioRuntime(createSeed());
  r.dispatch({ type: 'disc.create', id: 'disc-mako', manufacturer: 'Innova', mold: 'Mako3', category: 'Midrange', plastic: 'Champion', weight: 180, color: 'Blue', nickname: '', photo: null, bagId: null });
  const w = r.world();
  const disc = get(w, 'Disc', 'disc-mako');
  assert.equal(disc.moldId, 'mako3', 'linked to the existing mold, not a duplicate');
  const mold = get(w, 'Mold', disc.moldId);
  assert.deepEqual(mold.flight, { speed: 5, glide: 5, turn: 0, fade: 0 }, 'resolved flight is 5,5,0,0');
  assert.equal(disc.flight, undefined, 'unspecialized: the disc carries no own flight');
});

for (const [id, status] of results) console.log(`${status} ${id}`);
if (results.some(([, s]) => s !== 'PASS')) process.exit(1);
console.log('done');
