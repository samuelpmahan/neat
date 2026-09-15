# NEAT — climb ledger

WorkItems climbing toward tidy milestones. Append-only: log events are never
rewritten. Statuses: `open | climbing | review | landed`.

**Hard rule:** neat never records acceptance. There is no accept command and
`neat status <id> accepted` is refused. Sam records acceptance by editing this
file by hand — the intentionally awkward gate.

Review-handoff: `neat review` shows everything with status `review`.

Spec-bound items: an item may carry `- spec:` pointing at an mGM spec file
(paths relative to this directory; the specs live in `specs/`). A bound spec's
**Cases at the boundaries** are the requirement rows, written
`case-id — action → assertion` (fixtures live in the spec). `neat spec <id>`
prints the bound spec. The spec's G section ("no additions selected") is the
anti-gold-plating gate and its M section the parking lot; both are enforced by
Sam's eye at review, not by the ledger. neat still never records acceptance.

Evidence: `neat evidence <id> <case-id> --receipt <run>` records a receipt that
one Part × Calculation composed correctly at the boundary (receipt prefixes:
`run:`, `ci:`, `commit:`, `browser:`, `note:`). It appends to the item's
`- evidence:` section (append-only) and flips that row to `[ready]`.
Evidence needs a case — an unknown case id is refused. The gate measures
evidence rows, not checkboxes: a row can be `[ready]` without evidence, and the
gate still counts it missing.

## Item: DS-COMPOSER-REBUILD
- title: Composer rebuild: maker dropdown, flight numbers, camera capture, mobile fixes
- milestone: DS-DEMO
- status: review
- requirements:
  - [ready] Manufacturer dropdown (20 seeds) + Other… reveals text input
  - [ready] Flight-number inputs (S/G/T/F); known mold facts as placeholders, entered values fill blanks only
  - [ready] Camera capture (capture=environment) + file upload
  - [ready] Seed expansion: 7 → 71 molds with flight numbers
  - [ready] Mobile composer fixes (16px inputs kill iOS zoom, single column)
- log:
  - 2026-09-13T08:52Z note item opened
  - 2026-09-13T08:52Z req added: Manufacturer dropdown (20 seeds) + Other… reveals text input
  - 2026-09-13T08:52Z req added: Flight-number inputs (S/G/T/F); known mold facts as placeholders, entered values fill blanks only
  - 2026-09-13T08:52Z req added: Camera capture (capture=environment) + file upload
  - 2026-09-13T08:52Z req added: Seed expansion: 7 → 71 molds with flight numbers
  - 2026-09-13T08:52Z req added: Mobile composer fixes (16px inputs kill iOS zoom, single column)
  - 2026-09-13T08:52Z req #1 -> ready
  - 2026-09-13T08:52Z req #2 -> ready
  - 2026-09-13T08:52Z req #3 -> ready
  - 2026-09-13T08:52Z req #4 -> ready
  - 2026-09-13T08:52Z req #5 -> ready
  - 2026-09-13T08:52Z branch boone/uds-live-label @ 7b86bbe — composer rebuild
  - 2026-09-13T08:52Z verify 279/279 unit tests pass; npm run build passes
  - 2026-09-13T08:52Z note CI browser check failed deterministically: test filled maker as text, rebuild made it a select (Playwright fill() refuses). NOT flaky.
  - 2026-09-13T08:52Z note real product bug found: Other… never revealed the maker-name input (change handler ignored selects). fixed in src/app.js
  - 2026-09-13T08:52Z land pushed 812486f9 via git-database API; CI run 34744700409 success; Pages deployed; live site verified serving new app.js
  - 2026-09-13T08:52Z note acceptance NOT recorded — Sam's pen only
  - 2026-09-13T08:52Z status -> review

## Item: DS-EXPERIENCE-PROJECTIONS
- title: Experience minimum specs: (firing condition, projection) pairs, spotlight scope
- milestone: DS-DEMO
- status: review
- requirements:
  - [ready] UDS pair: depiction+facts fires, specimen+depiction Parts projected
  - [ready] ExploreShelf pair: shelf query fires, px.shelf.view projected
  - [ready] CreateBag pair: naming fires, bag of shared references projected
  - [ready] ManageBags pair: adaptation fires, updated bag Parts projected
  - [ready] CreateGraphics-spotlight pair: binding fires, spotlight card projected
  - [ready] ExportGraphics-spotlight pair: release fires, PNG + provenance projected
- log:
  - 2026-09-13T09:00Z note item opened
  - 2026-09-13T09:00Z req added: UDS pair: depiction+facts fires, specimen+depiction Parts projected
  - 2026-09-13T09:00Z req added: ExploreShelf pair: shelf query fires, px.shelf.view projected
  - 2026-09-13T09:00Z req added: CreateBag pair: naming fires, bag of shared references projected
  - 2026-09-13T09:00Z req added: ManageBags pair: adaptation fires, updated bag Parts projected
  - 2026-09-13T09:00Z req added: CreateGraphics-spotlight pair: binding fires, spotlight card projected
  - 2026-09-13T09:00Z req added: ExportGraphics-spotlight pair: release fires, PNG + provenance projected
  - 2026-09-13T09:00Z req #1 -> ready
  - 2026-09-13T09:00Z req #2 -> ready
  - 2026-09-13T09:00Z req #3 -> ready
  - 2026-09-13T09:00Z req #4 -> ready
  - 2026-09-13T09:00Z req #5 -> ready
  - 2026-09-13T09:00Z req #6 -> ready
  - 2026-09-13T09:00Z note scope: competition/battle parked in Maximal per Sam; spotlight card is the minimum
  - 2026-09-13T09:00Z note spec written to goals/disc-studio-demo/files/experience-projections.md; sequencing falls out of the pairs (each projection is the next firing condition)
  - 2026-09-13T09:00Z status -> review

## Item: DS-EXPERIENCE-IMPL
- title: Implement Experience minimum projections (spotlight scope): five Experiences from defined to usable
- milestone: DS-DEMO
- status: review
- requirements:
  - [ready] ExploreShelf usable: fn.shelf.query fires on shelf view, projects px.shelf.view
  - [ready] CreateBag usable: naming fires, projects Bag Part of shared references
  - [ready] ManageBags usable: adaptation fires, projects updated Bag Parts
  - [ready] CreateGraphics-spotlight usable: binding fires, projects spotlight card
  - [ready] ExportGraphics-spotlight usable: release fires, projects PNG + provenance
- log:
  - 2026-09-13T09:37Z note item opened
  - 2026-09-13T09:37Z req added: ExploreShelf usable: fn.shelf.query fires on shelf view, projects px.shelf.view
  - 2026-09-13T09:37Z req added: CreateBag usable: naming fires, projects Bag Part of shared references
  - 2026-09-13T09:37Z req added: ManageBags usable: adaptation fires, projects updated Bag Parts
  - 2026-09-13T09:37Z req added: CreateGraphics-spotlight usable: binding fires, projects spotlight card
  - 2026-09-13T09:37Z req added: ExportGraphics-spotlight usable: release fires, projects PNG + provenance
  - 2026-09-13T09:37Z req #1 -> ready
  - 2026-09-13T09:37Z req #2 -> ready
  - 2026-09-13T09:37Z req #3 -> ready
  - 2026-09-13T09:37Z req #4 -> ready
  - 2026-09-13T09:37Z req #5 -> ready
  - 2026-09-13T09:37Z branch boone/uds-live-label @ d5519f7 — five Experiences wired through existing compositions, competition parked
  - 2026-09-13T09:37Z verify 292/292 unit tests (13 new in tests/experience-projections.test.js); build passes
  - 2026-09-13T09:37Z note first push CI failed on browser test: bag name filled but no disc selected, runtime correctly refused (firing condition unmet) — test fixed in 0dd2575, not a product bug
  - 2026-09-13T09:37Z land pushed 8379d8e4 via git-database API; CI run 34749633267 success; Pages deployed; live experiences.js verified with unseals markers
  - 2026-09-13T09:37Z note acceptance NOT recorded — Sam's pen only
  - 2026-09-13T09:37Z status -> review

## Item: DS-UDS-SPEC
- title: UploadDiscToShelf m-spec: composed Mold -> Disc fields, 8 boundary cases
- milestone: DS-DEMO
- spec: specs/upload-disc-to-shelf_mGM.md
- status: open
- requirements:
  - [ready] upload.m.defaults — Create/read an unspecialized disc → Resolved flight is 5,5,0,0
  - [ready] upload.m.specialize — Set discA.turn to -1 → Only turn differs; mold and discB unchanged
  - [ready] upload.m.inherit — Remove discA.turn after specialization → Turn resolves to mold's 0
  - [ready] upload.m.catalog — Correct catalog defaults → Saved disc keeps its base; new disc may select corrected base
  - [ready] upload.m.save — Save either depiction path → Disc/art/shelf agree; readback receipt resolves
  - [ready] upload.m.reject — Invalid input or overlapping save → No false success, no lost membership
  - [ready] upload.m.discard — Discard active draft → Saved specimens and mold unchanged
  - [ready] upload.m.presence — Base turn=-1: discA.turn=0; discB.turn specialized then nulled → Explicit zero wins; null clears the own-field (unknown is source-only)
- evidence:
  - upload.m.save: 2026-09-14T00:44Z note:spec Actual PxC/evidence — ds.px.receipt.<save> + CATALOG.md browser record + model.test.ts; pre-refinement shape
  - upload.m.defaults: 2026-09-14T01:01Z run:ntc/evidence/case-runs.mjs — upload.m.defaults vs demo disc.create (mako3 5,5,0,0; unspecialized, no own flight)
  - upload.m.specialize: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the specialize fixture green
  - upload.m.inherit: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the inherit fixture green
  - upload.m.presence: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the presence fixture green
  - upload.m.catalog: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the catalog fixture green
  - upload.m.reject: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: demo runtime dispatch refuses a duplicate-id disc.create (cause chain names 'Invalid new disc'), world unchanged; two serial saves both land with bag membership intact
  - upload.m.discard: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: demo runtime — one atomic disc.create, one undo.pop('px.studio.world'); saved specimens and mold byte-identical after, with px.receipt.studio-undo
  - upload.m.presence: 2026-09-14T01:36Z node evidence/case-runs-2.mjs (YAGNI revision per Sam 2026-09-14: null is source-only — assigning null clears the own-field, no shadow null; explicit zero still wins; unreleased-mold source nulls inherit as unknown)
- log:
  - 2026-09-13T23:17Z note item opened
  - 2026-09-13T23:17Z note spec bound: specs/upload-disc-to-shelf_mGM.md (m-cases are the requirement rows)
  - 2026-09-13T23:17Z req added: upload.m.defaults — Create/read an unspecialized disc → Resolved flight is 5,5,0,0
  - 2026-09-13T23:17Z req added: upload.m.specialize — Set discA.turn to -1 → Only turn differs; mold and discB unchanged
  - 2026-09-13T23:17Z req added: upload.m.inherit — Remove discA.turn after specialization → Turn resolves to mold's 0
  - 2026-09-13T23:17Z req added: upload.m.catalog — Correct catalog defaults → Saved disc keeps its base; new disc may select corrected base
  - 2026-09-13T23:17Z req added: upload.m.save — Save either depiction path → Disc/art/shelf agree; readback receipt resolves
  - 2026-09-13T23:17Z req added: upload.m.reject — Invalid input or overlapping save → No false success, no lost membership
  - 2026-09-13T23:17Z req added: upload.m.discard — Discard active draft → Saved specimens and mold unchanged
  - 2026-09-13T23:17Z req added: upload.m.presence — Base turn=-1: discA.turn=0; discB.turn specialized then nulled → Explicit zero wins; null clears the own-field (unknown is source-only)
  - 2026-09-14T00:44Z evidence upload.m.save: note:spec Actual PxC/evidence — ds.px.receipt.<save> + CATALOG.md browser record + model.test.ts; pre-refinement shape
  - 2026-09-14T00:44Z req upload.m.save -> ready
  - 2026-09-14T01:00Z note triage: 7 open — save evidenced; defaults/specialize/inherit/presence/catalog need target shape; reject needs verify-or-wire in tree; discard runnable today (oc.destroy fixture run)
  - 2026-09-14T01:01Z evidence upload.m.defaults: run:ntc/evidence/case-runs.mjs — upload.m.defaults vs demo disc.create (mako3 5,5,0,0; unspecialized, no own flight)
  - 2026-09-14T01:01Z req upload.m.defaults -> ready
  - 2026-09-14T01:11Z evidence upload.m.specialize: node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the specialize fixture green
  - 2026-09-14T01:11Z req upload.m.specialize -> ready
  - 2026-09-14T01:11Z evidence upload.m.inherit: node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the inherit fixture green
  - 2026-09-14T01:11Z req upload.m.inherit -> ready
  - 2026-09-14T01:11Z evidence upload.m.presence: node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the presence fixture green
  - 2026-09-14T01:11Z req upload.m.presence -> ready
  - 2026-09-14T01:11Z evidence upload.m.catalog: node evidence/case-runs-2.mjs: producer refinement (evidence/specialize.mjs — versioned Parts, retained base, resolveFlight) runs the catalog fixture green
  - 2026-09-14T01:11Z req upload.m.catalog -> ready
  - 2026-09-14T01:11Z evidence upload.m.reject: node evidence/case-runs-2.mjs: demo runtime dispatch refuses a duplicate-id disc.create (cause chain names 'Invalid new disc'), world unchanged; two serial saves both land with bag membership intact
  - 2026-09-14T01:11Z req upload.m.reject -> ready
  - 2026-09-14T01:11Z evidence upload.m.discard: node evidence/case-runs-2.mjs: demo runtime — one atomic disc.create, one undo.pop('px.studio.world'); saved specimens and mold byte-identical after, with px.receipt.studio-undo
  - 2026-09-14T01:11Z req upload.m.discard -> ready
  - 2026-09-14T01:36Z evidence upload.m.presence: node evidence/case-runs-2.mjs (YAGNI revision per Sam 2026-09-14: null is source-only — assigning null clears the own-field, no shadow null; explicit zero still wins; unreleased-mold source nulls inherit as unknown)

## Item: DS-EXPLORE-SPEC
- title: ExploreShelf m-spec: find/inspect/update/keep, 7 boundary cases
- milestone: DS-DEMO
- spec: specs/explore-shelf_mGM.md
- status: open
- requirements:
  - [ready] explore.m.find — Search mold/nickname/blank/unmatched → Correct refs; blank=all, unmatched=empty
  - [ready] explore.m.select — Select discB → Shows discB's material, not discA or the draft
  - [ready] explore.m.edit — Set discA.turn=-1 → Only that field specializes; discB and mold unchanged
  - [ready] explore.m.inherit — Remove discA.turn after editing → Resolved turn comes from its mold
  - [ready] explore.m.empty — Empty shelf or unmatched result → Distinct empty messages; route to upload or clear
  - [ready] explore.m.keep — Edit → persist → reload → Same target, correction and source context restored
  - [ready] explore.m.failure — Rejected write or corrupt data → Visible failure; no false save, no silent replacement
- evidence:
  - explore.m.find: 2026-09-14T01:01Z run:ntc/evidence/case-runs.mjs — explore.m.find vs demo shelfQuery (spec fixture: 2 Buzzz, Minty; mold/nickname/blank/unmatched)
  - explore.m.select: 2026-09-14T01:01Z run:ntc/evidence/case-runs.mjs — explore.m.select vs demo runtime seed (find buzzz-rose → read disc/mold/maker material)
  - explore.m.empty: 2026-09-14T01:01Z run:ntc/evidence/case-runs.mjs — explore.m.empty vs demo shelfQuery, composition half only (empty in → empty out; UI messages not executed)
  - explore.m.edit: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: shelfQuery find('minty') → select discA → versioned specialize turn=-1 → resolveFlight readback; only turn differs, discB and mold unchanged
  - explore.m.inherit: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: despecialize removes own turn; resolved turn comes from the retained mold
  - explore.m.keep: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: edit → persist (target + source context) → restore into a fresh board; same target, correction, and mold base/version restored. The spec's {?} (whole collection + images) stays Sam's call
  - explore.m.failure: 2026-09-14T01:11Z node evidence/case-runs-2.mjs: demo runtime entity.set on a missing disc throws (cause names the missing entity), world unchanged; corrupt/tampered restore payloads throw a named error instead of a silent empty shelf
  - explore.m.keep: 2026-09-14T02:18Z Sam 2026-09-14: keep {?} resolved surgical — the Disc carries its mold reference and own fields and inherits the mold's fields; local restore retains exactly the target's required material. Collection + images are the shelf's own composition (one source of truth per Part). The existing persist/restore run already evidences this shape.
- log:
  - 2026-09-13T23:17Z note item opened
  - 2026-09-13T23:17Z note spec bound: specs/explore-shelf_mGM.md (m-cases are the requirement rows)
  - 2026-09-13T23:17Z req added: explore.m.find — Search mold/nickname/blank/unmatched → Correct refs; blank=all, unmatched=empty
  - 2026-09-13T23:17Z req added: explore.m.select — Select discB → Shows discB's material, not discA or the draft
  - 2026-09-13T23:17Z req added: explore.m.edit — Set discA.turn=-1 → Only that field specializes; discB and mold unchanged
  - 2026-09-13T23:17Z req added: explore.m.inherit — Remove discA.turn after editing → Resolved turn comes from its mold
  - 2026-09-13T23:17Z req added: explore.m.empty — Empty shelf or unmatched result → Distinct empty messages; route to upload or clear
  - 2026-09-13T23:17Z req added: explore.m.keep — Edit → persist → reload → Same target, correction and source context restored
  - 2026-09-13T23:17Z req added: explore.m.failure — Rejected write or corrupt data → Visible failure; no false save, no silent replacement
  - 2026-09-14T01:00Z note triage: 7 open, none claimed per spec — find/select/empty runnable today; edit/inherit need target shape + wiring; keep blocked on {?} (Sam's call); failure needs small wiring
  - 2026-09-14T01:01Z evidence explore.m.find: run:ntc/evidence/case-runs.mjs — explore.m.find vs demo shelfQuery (spec fixture: 2 Buzzz, Minty; mold/nickname/blank/unmatched)
  - 2026-09-14T01:01Z req explore.m.find -> ready
  - 2026-09-14T01:01Z evidence explore.m.select: run:ntc/evidence/case-runs.mjs — explore.m.select vs demo runtime seed (find buzzz-rose → read disc/mold/maker material)
  - 2026-09-14T01:01Z req explore.m.select -> ready
  - 2026-09-14T01:01Z evidence explore.m.empty: run:ntc/evidence/case-runs.mjs — explore.m.empty vs demo shelfQuery, composition half only (empty in → empty out; UI messages not executed)
  - 2026-09-14T01:01Z req explore.m.empty -> ready
  - 2026-09-14T01:11Z evidence explore.m.edit: node evidence/case-runs-2.mjs: shelfQuery find('minty') → select discA → versioned specialize turn=-1 → resolveFlight readback; only turn differs, discB and mold unchanged
  - 2026-09-14T01:11Z req explore.m.edit -> ready
  - 2026-09-14T01:11Z evidence explore.m.inherit: node evidence/case-runs-2.mjs: despecialize removes own turn; resolved turn comes from the retained mold
  - 2026-09-14T01:11Z req explore.m.inherit -> ready
  - 2026-09-14T01:11Z evidence explore.m.keep: node evidence/case-runs-2.mjs: edit → persist (target + source context) → restore into a fresh board; same target, correction, and mold base/version restored. The spec's {?} (whole collection + images) stays Sam's call
  - 2026-09-14T01:11Z req explore.m.keep -> ready
  - 2026-09-14T01:11Z evidence explore.m.failure: node evidence/case-runs-2.mjs: demo runtime entity.set on a missing disc throws (cause names the missing entity), world unchanged; corrupt/tampered restore payloads throw a named error instead of a silent empty shelf
  - 2026-09-14T01:11Z req explore.m.failure -> ready
  - 2026-09-14T02:18Z evidence explore.m.keep: Sam 2026-09-14: keep {?} resolved surgical — the Disc carries its mold reference and own fields and inherits the mold's fields; local restore retains exactly the target's required material. Collection + images are the shelf's own composition (one source of truth per Part). The existing persist/restore run already evidences this shape.

## Item: DS-DEVTOOLS-SPEC
- title: PxC DevTools m-spec: inspect the actual object and the Tick, 9 boundary cases
- milestone: DS-DEMO
- spec: specs/pxc-devtools_mGM.md
- status: open
- requirements:
  - [ready] devtools.m.object — Inspect Counter and prototype → Real identity/methods; no getter/toJSON execution
  - [ready] devtools.m.trace — Follow a produced Part's inputs → Exact Part identities incl. aliases and inline
  - [ready] devtools.m.getter — Evaluate doubled → Result 4; getterCalls 1; execution inspectable
  - [ready] devtools.m.method — Invoke increment(3) → Receiver count 5; result 5
  - [ready] devtools.m.async — Run controlled async add → Running state visible; awaited result 8
  - [ready] devtools.m.failure — Invoke throwing method → Failed receipt, no result; not a rollback guarantee
  - [ready] devtools.m.binding — Missing/ambiguous binding → Preflight rejects before execution
  - [ready] devtools.m.scratch — Retain an alternative → Original and application selections unchanged
  - [ready] devtools.m.tick — Run one upload sequence on a fixed fixture → Start → actions → assertions → inspect mismatches
- evidence:
  - devtools.m.object: 2026-09-14T00:44Z note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser object/identity inspection
  - devtools.m.getter: 2026-09-14T00:44Z note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser getter inspection
  - devtools.m.method: 2026-09-14T00:44Z note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser Calculation inspection
  - devtools.m.failure: 2026-09-14T00:44Z note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser failure inspection
  - devtools.m.object: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.object vs fresh Counter (descriptors only; getterCalls 0, toJSON never runs)
  - devtools.m.trace: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.trace vs invokePql run (alias unwrapped to exact address, inline inputs flagged)
  - devtools.m.getter: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.getter (doubled → 4, receiver getterCalls 1)
  - devtools.m.method: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.method (increment(3) → 5, receiver count 5)
  - devtools.m.async: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.async (running state visible pre-resolution; awaited 8)
  - devtools.m.failure: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.failure (failed receipt, nothing produced)
  - devtools.m.binding: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.binding (preflight refuses missing/ambiguous before any execution)
  - devtools.m.scratch: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.scratch (devtools.scratch.alt retained; app selection unchanged)
  - devtools.m.tick: 2026-09-14T01:06Z run:ntc/evidence/devtools-cases.mjs — devtools.m.tick (upload-sequence fixture: 3 ticks walked, assertions hold, mismatch inspectable)
- log:
  - 2026-09-13T23:17Z note item opened
  - 2026-09-13T23:17Z note spec bound: specs/pxc-devtools_mGM.md (m-cases are the requirement rows)
  - 2026-09-13T23:17Z req added: devtools.m.object — Inspect Counter and prototype → Real identity/methods; no getter/toJSON execution
  - 2026-09-13T23:17Z req added: devtools.m.trace — Follow a produced Part's inputs → Exact Part identities incl. aliases and inline
  - 2026-09-13T23:17Z req added: devtools.m.getter — Evaluate doubled → Result 4; getterCalls 1; execution inspectable
  - 2026-09-13T23:17Z req added: devtools.m.method — Invoke increment(3) → Receiver count 5; result 5
  - 2026-09-13T23:17Z req added: devtools.m.async — Run controlled async add → Running state visible; awaited result 8
  - 2026-09-13T23:17Z req added: devtools.m.failure — Invoke throwing method → Failed receipt, no result; not a rollback guarantee
  - 2026-09-13T23:17Z req added: devtools.m.binding — Missing/ambiguous binding → Preflight rejects before execution
  - 2026-09-13T23:17Z req added: devtools.m.scratch — Retain an alternative → Original and application selections unchanged
  - 2026-09-13T23:17Z req added: devtools.m.tick — Run one upload sequence on a fixed fixture → Start → actions → assertions → inspect mismatches
  - 2026-09-14T00:44Z evidence devtools.m.object: note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser object/identity inspection
  - 2026-09-14T00:44Z req devtools.m.object -> ready
  - 2026-09-14T00:44Z evidence devtools.m.getter: note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser getter inspection
  - 2026-09-14T00:44Z req devtools.m.getter -> ready
  - 2026-09-14T00:44Z evidence devtools.m.method: note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser Calculation inspection
  - 2026-09-14T00:44Z req devtools.m.method -> ready
  - 2026-09-14T00:44Z evidence devtools.m.failure: note:spec Actual PxC/evidence — 52 combined tests + TypeScript; browser failure inspection
  - 2026-09-14T00:44Z req devtools.m.failure -> ready
  - 2026-09-14T01:00Z note triage: 5 open — object/getter/method/failure evidenced; trace/async/scratch runnable today; binding+tick need small wiring
  - 2026-09-14T01:06Z evidence devtools.m.object: run:ntc/evidence/devtools-cases.mjs — devtools.m.object vs fresh Counter (descriptors only; getterCalls 0, toJSON never runs)
  - 2026-09-14T01:06Z evidence devtools.m.trace: run:ntc/evidence/devtools-cases.mjs — devtools.m.trace vs invokePql run (alias unwrapped to exact address, inline inputs flagged)
  - 2026-09-14T01:06Z req devtools.m.trace -> ready
  - 2026-09-14T01:06Z evidence devtools.m.getter: run:ntc/evidence/devtools-cases.mjs — devtools.m.getter (doubled → 4, receiver getterCalls 1)
  - 2026-09-14T01:06Z evidence devtools.m.method: run:ntc/evidence/devtools-cases.mjs — devtools.m.method (increment(3) → 5, receiver count 5)
  - 2026-09-14T01:06Z evidence devtools.m.async: run:ntc/evidence/devtools-cases.mjs — devtools.m.async (running state visible pre-resolution; awaited 8)
  - 2026-09-14T01:06Z req devtools.m.async -> ready
  - 2026-09-14T01:06Z evidence devtools.m.failure: run:ntc/evidence/devtools-cases.mjs — devtools.m.failure (failed receipt, nothing produced)
  - 2026-09-14T01:06Z evidence devtools.m.binding: run:ntc/evidence/devtools-cases.mjs — devtools.m.binding (preflight refuses missing/ambiguous before any execution)
  - 2026-09-14T01:06Z req devtools.m.binding -> ready
  - 2026-09-14T01:06Z evidence devtools.m.scratch: run:ntc/evidence/devtools-cases.mjs — devtools.m.scratch (devtools.scratch.alt retained; app selection unchanged)
  - 2026-09-14T01:06Z req devtools.m.scratch -> ready
  - 2026-09-14T01:06Z evidence devtools.m.tick: run:ntc/evidence/devtools-cases.mjs — devtools.m.tick (upload-sequence fixture: 3 ticks walked, assertions hold, mismatch inspectable)
  - 2026-09-14T01:06Z req devtools.m.tick -> ready
