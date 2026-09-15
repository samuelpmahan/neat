// Mold → Disc scalar-specialization producer refinement
// (spec: upload-disc-to-shelf mGM — "should precede consumers relying on it").
//
// Parts are immutable versions on an exec-board. `commit` publishes a new
// version and moves the address to it; every retained version stays
// addressable, so an update changes the selected version without overwriting
// retained Part material. A disc retains its base (mold address + version),
// so a catalog correction never rewrites a saved disc's history.
//
// Resolution (the boundary semantics the cases assert):
//   own scalar present  → own wins (explicit 0 wins)
//   assigned null       → clears the own-field (unknown lives at the source —
//                         e.g. unreleased molds; YAGNI: no authored ? as an override)
//   own scalar absent   → the retained mold's value

import { createExecBoard as newBoard } from '../../discstudio-uds/src/core/exec.js';
export { newBoard };

export const FLIGHT = ['speed', 'glide', 'turn', 'fade'];

const deepFreeze = v => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    for (const key of Reflect.ownKeys(v)) deepFreeze(v[key]);
    Object.freeze(v);
  }
  return v;
};
const snap = v => deepFreeze(structuredClone(v));

/** Publish a new immutable version; the address selects the latest. Returns the version. */
export function commit(board, address, value) {
  const n = (board.has(`${address}.n`) ? board.get(`${address}.n`) : 0) + 1;
  const frozen = snap(value);
  board.set(`${address}.v${n}`, frozen);
  board.set(`${address}.n`, n);
  board.set(address, frozen);
  return n;
}
export const current = (board, address) => board.get(address);
export const retained = (board, address, version) => board.get(`${address}.v${version}`);
export const versionCount = (board, address) => (board.has(`${address}.n`) ? board.get(`${address}.n`) : 0);

/** A disc retains its base: the mold address and the version it was created against. */
export function makeDisc(id, moldAddress, moldVersion, own = {}) {
  return snap({ id, mold: { address: moldAddress, version: moldVersion }, own: { ...own } });
}

/** Resolve flight against the RETAINED base. Own wins; null stays unknown; absent falls back. */
export function resolveFlight(board, disc) {
  const mold = retained(board, disc.mold.address, disc.mold.version);
  const out = {};
  for (const k of FLIGHT) {
    out[k] = disc.own && Object.hasOwn(disc.own, k) ? disc.own[k] : mold.flight[k];
  }
  return out;
}

/** Specialize one scalar: a new version; retained material untouched.
 *  Assigning null clears the own-field instead of writing a shadow null —
 *  unknown lives at the source, and a cleared field picks up the retained base. */
export function specialize(board, address, field, value) {
  const disc = current(board, address);
  const own = { ...disc.own };
  if (value === null) delete own[field]; else own[field] = value;
  return commit(board, address, { ...structuredClone(disc), own });
}

/** Remove an own-field: a new version without it; resolution falls back to the mold. */
export function despecialize(board, address, field) {
  const disc = current(board, address);
  const own = { ...disc.own };
  delete own[field];
  return commit(board, address, { ...structuredClone(disc), own });
}

/** Correct catalog defaults: the mold moves to a new version; discs keep their retained base. */
export function correctCatalog(board, moldAddress, flightPatch) {
  const mold = current(board, moldAddress);
  return commit(board, moldAddress, { ...structuredClone(mold), flight: { ...mold.flight, ...flightPatch } });
}

/**
 * Persist a target with its source context (all retained versions).
 * Corruption throws a named error — never a silent empty shelf.
 */
export function persist(board, addresses) {
  const parts = {};
  for (const a of addresses) {
    if (!board.has(a)) throw new Error(`persist: '${a}' was never produced.`);
    const n = versionCount(board, a);
    parts[a] = { n, values: Array.from({ length: n }, (_, i) => board.get(`${a}.v${i + 1}`)) };
  }
  return JSON.stringify({ v: 1, parts });
}

export function restore(json) {
  let doc;
  try { doc = JSON.parse(json); }
  catch (e) { throw new Error(`restore: corrupt payload (${e.message}); refusing a silent empty shelf.`); }
  if (!doc || doc.v !== 1 || !doc.parts || typeof doc.parts !== 'object' || Array.isArray(doc.parts))
    throw new Error('restore: corrupt payload (bad envelope); refusing a silent empty shelf.');
  const board = newBoard();
  for (const [a, entry] of Object.entries(doc.parts)) {
    if (!entry || typeof entry.n !== 'number' || !Array.isArray(entry.values) || entry.values.length !== entry.n || entry.n < 1)
      throw new Error(`restore: corrupt part '${a}'; refusing a silent empty shelf.`);
    entry.values.forEach((v, i) => board.set(`${a}.v${i + 1}`, snap(v)));
    board.set(`${a}.n`, entry.n);
    board.set(a, snap(entry.values[entry.n - 1]));
  }
  return board;
}
