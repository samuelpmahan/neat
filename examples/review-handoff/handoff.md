# Review handoffs

## DEMO-REVIEW: A reusable review handoff shows what changed and how to inspect it.

Checkpoint: `abc123demo` (cp-demo-review)

### What changed

- Added a structured, checkpoint-bound review handoff.
- Added a hidable checklist with inspectable proof routes and durable inspection export.

### Verifications

- **Structured handoff** — The handoff validates against the exact current item fingerprint and checkpoint. (structured)
  [Open handoff](handoff.md)
- **Handoff render** — The generated Review tab names the checkpoint, changes, and proof route. (structured)
  [Open report](ready-review.html)
- **Inspectable route** — Each verification has a label, observed result, and safe route. (inspectable)
  [Open report](ready-review.html)
- **Route render** — The Review tab renders the route as an actionable review link. (inspectable)
  [Open report](ready-review.html)

Human inspection and acceptance remain separate records.
