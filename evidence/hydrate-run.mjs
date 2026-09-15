// Demonstrates pxc.hydrate(part): the read side of the surgical keep.
// Not a gate case — a worked demonstration of the named operation.
import assert from 'node:assert/strict';
import { newBoard, commit, versionCount, makeDisc, specialize } from './specialize.mjs';
import { withHydrate } from './hydrate.mjs';

const pxc = withHydrate(newBoard());
commit(pxc, 'px.mold', { id: 'syn', name: 'Syn', flight: { speed: 5, glide: 5, turn: -1, fade: 0 } });
commit(pxc, 'px.disc.a', makeDisc('discA', 'px.mold', 1));
specialize(pxc, 'px.disc.a', 'turn', -1);

const view = pxc.hydrate('px.disc.a');
assert.deepEqual(view.flight, { speed: 5, glide: 5, turn: -1, fade: 0 }, 'own turn wins, the rest inherits');
assert.equal(view.mold.name, 'Syn', 'the mold reference dereferences through the board');
assert.deepEqual(view.moldRef, { address: 'px.mold', version: 1 }, 'the pinned ref is retained');

// Unreleased mold: nulls at the source hydrate to ?s.
commit(pxc, 'px.mold.u', { id: 'unrel', name: 'Unreleased', flight: { speed: null, glide: null, turn: null, fade: null } });
commit(pxc, 'px.disc.u', makeDisc('discU', 'px.mold.u', 1));
assert.deepEqual(pxc.hydrate('px.disc.u').flight, { speed: null, glide: null, turn: null, fade: null });

// Missing parts surface visibly, by name — never a silent ?.
assert.throws(() => pxc.hydrate('px.nope'), /px\.nope/);
commit(pxc, 'px.disc.ghost', makeDisc('discGhost', 'px.mold', 99));
assert.throws(() => pxc.hydrate('px.disc.ghost'), /px\.mold\.v99/);

// Hydration never writes: the board is unchanged.
assert.equal(versionCount(pxc, 'px.disc.a'), 2);
assert.equal(versionCount(pxc, 'px.mold'), 1);

console.log('pxc.hydrate(part): all good');
