// pxc.hydrate(part) — hydration as a first-class board operation.
//
// A dehydrated part names its references; hydrate resolves them through the
// board's own addressing and returns the render-ready view. For a disc the
// mold reference pins its retained version: own fields win, else the pinned
// mold's, else unknown. A pure read — no writes, no network, no side effects.
// A missing part, or a missing pinned mold version, surfaces visibly by name;
// never a silent ?.

import { resolveFlight } from './specialize.mjs';

export function hydrate(board, address) {
  // The board itself throws on a missing slot, naming it — that visible
  // failure propagates; hydrate never invents a silent ?.
  const part = board.get(address);
  if (!part || typeof part !== 'object' || !part.mold) return structuredClone(part);
  const ref = `${part.mold.address}.v${part.mold.version}`;
  const mold = board.get(ref); // throws, named, if the pinned version is gone
  const view = structuredClone(part);
  view.moldRef = view.mold;
  view.mold = structuredClone(mold);
  view.flight = resolveFlight(board, part);
  return view;
}

/** Attach the operation to a board, giving the pxc.hydrate(part) form. */
export function withHydrate(board) {
  board.hydrate = address => hydrate(board, address);
  return board;
}
