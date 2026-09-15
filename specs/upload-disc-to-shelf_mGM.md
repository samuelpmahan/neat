<!-- Source: pasted by Sam in chat, 2026-09-13. Internal links (../CASE-GUIDE.md,
     ../../../../exp/...) refer to Sam's spec tree, not this seed. Verbatim below. -->

# UploadDiscToShelf

**Original m reached. First refinement: composed Mold → Disc fields.**

[Shared model and notation](../CASE-GUIDE.md) · [Next: ExploreShelf](../explore-shelf/explore-shelf_mGM.md)

## Parts

```js
mold = { manufacturer, name, speed, glide, turn, fade }
disc = { mold: moldRef, nickname, plastic, weight, Color1, Color2, depiction }
// A flippy specimen adds just:
disc.turn = -1
```

This is the target shape, not today's implementation. Current mold material is
`ds.px.seed.<id>` with a flight array; current Disc uses a `seed` reference.
Refine that implementation here before consumers depend on the new shape.
Presume catalog numbers correct; prefer manufacturer defaults.

## m · Stage

| Tick | Calculations | Inspect |
| --- | --- | --- |
| Resolve mold · `UDS` | `fn.find` → `fn.read` | Selected mold and its defaults |
| Specialize · `UDS` | `oc.create` → `oc.update` → `fn.read` | Disc's own fields beside resolved defaults |
| Depict · `UDS[paint]` | Select painting → render | Painting, colors, 50/50 or Halo, nickname label |
| Depict · `UDS[photo]` | Prepare supplied photo | Prepared depiction; original file unchanged |
| Save · `UDS` | Retain disc → update shelf → read back | Disc, shelf membership and save receipt |

Choose one depiction path. CRUD handles material; rendering remains a Calculation.
Discarding a draft uses `oc.destroy`, not a special disc-deletion subsystem.

## Cases at the boundaries

**Fixture:** a synthetic mold with flight fields `5,5,0,0`; two distinct
specimens referring to it; explicit empty shelf and fixed depiction choice.
Each row uses a fresh fixture unless its action explicitly builds on a prior result.

| Case | Action | Assertion |
| --- | --- | --- |
| `upload.m.defaults` | Create/read an unspecialized disc | Resolved flight is `5,5,0,0` |
| `upload.m.specialize` | Set discA.turn to -1; inspect | Only turn differs; mold and discB stay unchanged |
| `upload.m.inherit` | Remove discA.turn after specialization | Turn resolves to mold's 0 |
| `upload.m.presence` | On a base with turn=-1: supply discA.turn=0; specialize discB.turn, then assign null | Explicit zero wins; assigning null clears the own-field — unknown lives at the source |
| `upload.m.catalog` | Correct catalog defaults | Saved disc keeps its retained base; a new disc may select the corrected base |
| `upload.m.save` | Save either depiction path | Actual disc/art/shelf agree; readback receipt resolves |
| `upload.m.reject` | In separate fixtures: invalid input, or overlapping save | Invalid/rejected attempt produces no false success or lost membership |
| `upload.m.discard` | Discard active draft | Saved specimens and mold remain unchanged |

An update changes the selected version; it need not overwrite retained Part material.

## Actual PxC / evidence

- Mold: `ds.px.seed.<id>`; disc: `ds.px.disc.<save>`.
- Art: `ds.px.art.<save>`; shelf: `ds.px.shelf.<save>`.
- Save evidence: `ds.px.receipt.<save>` plus producing compositions.
- Existing checks: [model](../../../../exp/upload-disc-to-shelf/model.test.ts),
  [catalog/painting](../../../../exp/upload-disc-to-shelf/catalog.test.ts),
  [browser record](../../../../exp/upload-disc-to-shelf/CATALOG.md).

Existing upload behavior has evidence. Named scalar flight specialization, shared
CRUD and Stage/Tick composition are **not yet implemented**. No new run is claimed.

## G

No additions selected. Validate this refinement, then reuse it in ExploreShelf.

## M

- Explain the 21 apparent rating updates when cleared; do not block ordinary use.
- Expand catalog/plastic coverage, batch entry and painted assets.
- Add richer palette controls or photo cropping.

These are parked possibilities, not extra requirements for m.
