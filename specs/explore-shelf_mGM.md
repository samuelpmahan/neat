<!-- Source: pasted by Sam in chat, 2026-09-13. Internal links (../CASE-GUIDE.md,
     ../../../../exp/...) refer to Sam's spec tree, not this seed. Verbatim below. -->

# ExploreShelf

**Find a saved disc, inspect its composition, update a field, keep the work.**

[Shared model](../CASE-GUIDE.md) · [Producer: UploadDiscToShelf](../upload-disc-to-shelf/upload-disc-to-shelf_mGM.md)

## Parts

Reuse upload's Mold, Disc and shelf references.
Additional inputs are only query text, selected disc reference and field patch.
No separate flight-edit object or override subsystem.

## m · Stage

| Tick | Calculations | Inspect |
| --- | --- | --- |
| Find | `fn.find(ds.disc, query, fields)` | Matching owned references |
| Select | `fn.read(selectedDisc)` | Own fields, retained mold and resolved material |
| Edit | `oc.update(selectedDisc, {turn: -1})` → `fn.read` | The specialization and its effect |
| Keep | Local save → readback | Stored target and correction |
| Resume | Restore → `fn.read` | Same target with the correction retained |

Collection/context is explicit; notation is illustrative, not a new parser.
The same `fn.find` serves upload's mold catalog and later BuildBag's owned discs.

Experience — ShelfAsTheFocus (Sam, 2026-09-14; his review found it missing, so
it is the m-stage experience, not a Maximal addition): the shelf is the
experience, not the panel under the controls — iPod-Classic album scrolling
(momentum, snap-to-disc, focused disc lifts like "now playing"). Two rows like
a physical rack. The search comes in three shapes — bag walk (tour through
slots, top-down or bottom-up, ending in a named bag), maker review (collection
browse), slot review (tight predicate cohort) — and the lane split follows the
situation: the search names the split. Two-click configurable, max: tap the
lane to change the split axis, tap the filter to pick a better filter —
nothing nested deeper than one level.

## Cases at the boundaries

**Fixture:** 102 owned discs, including two Buzzz specimens; only discA is named
Minty. Both specimens retain the same mold. Capture original material before edits.
Cases start from that fixture independently; storage Cases supply their own adapter.

| Case | Action | Assertion |
| --- | --- | --- |
| `explore.m.find` | Search mold text, nickname, blank or unmatched text in separate runs | Correct distinct references; blank=all, unmatched=empty |
| `explore.m.select` | Select discB | Display discB's actual material, not discA or the upload draft |
| `explore.m.edit` | Set discA.turn=-1 | Only that field specializes; discB and mold unchanged |
| `explore.m.inherit` | Remove discA.turn after editing | Resolved turn comes from its retained mold |
| `explore.m.empty` | Open empty shelf or an unmatched result | Distinct empty messages; route back to upload or clear search |
| `explore.m.keep` | Edit → persist → reload | Same target, correction and source context restored |
| `explore.m.failure` | Reject a write or supply corrupt stored data | Visible failure, no false save and no silent empty-shelf replacement |

Flight edits inherit upload's proven update behavior; these assertions exercise
the consumer wiring, not another implementation.

{?} Local restore must include the corrected target's required material. Decide
whether m also retains the whole collection and images; no cloud sync is implied.

Resolution (Sam, 2026-09-14): surgical. The Disc carries its mold reference and
its own fields and inherits the mold's fields; local restore retains exactly
that — the target's required material. The collection and images are the shelf's
own composition, not the keep's; one source of truth per Part, no stale ghosts.

## Actual PxC / evidence

`ds.px.shelf.<save>` contains disc addresses. Each `ds.px.disc.<save>`
retains seed and depiction material; `ds.px.art.<save>` holds rendered art.

[Current model](../../../../exp/upload-disc-to-shelf/model.ts) and
[inline shelf UI](../../../../exp/upload-disc-to-shelf/app.ts) already resolve
saved material. Full search/detail/edit/persistence flow and shared scalar-field
composition remain to be wired. No completed ExploreShelf CaseRun is claimed.

## G

No additions selected. Finish upload's producer refinement first.

## M

Richer filters/sorting, removal UI, bags, graphics handoff and collection transfer.
Each should reuse the same operations and retained references.
