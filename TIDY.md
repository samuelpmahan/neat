# TIDY — milestones

Named, frozen rungs. A milestone declares what "clean" means: a version, the
clean tree, and its content hash. Before a real baseline exists, versions are
theater — declare with `--version pre-baseline` and `verify` reports nothing
to verify (not a failure).

**Hard rule:** promote is Sam-gated. `tidy promote` refuses without `--by-sam`
carrying his words.

**The gate:** tidy "clean" means every spec-bound neat item's m-cases have
evidence — receipts that the Part × Calculation composed correctly at the
boundary (Sam: "composing correctly is the truest mark of success").
`tidy verify` runs the gate and fails red when any bound case lacks evidence.
`tidy promote` reports the gate as advisory only — it never refuses on a red
gate; Sam's pen decides. Items with no spec are outside the gate, not failures.

## Milestone: DS-DEMO
- version: pre-baseline
- status: open
- clean: —
- hash: —
- declared: 2026-09-13T08:52Z
- log:
  - 2026-09-13T08:52Z declared Disc Studio demo — first tidy rung; no frozen baseline yet, versions are theater until one exists
