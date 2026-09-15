<!-- Source: pasted by Sam in chat, 2026-09-13. Internal links (../CASE-GUIDE.md,
     ../../../../exp/...) refer to Sam's spec tree, not this seed. Verbatim below. -->

# PxC DevTools

**Inspect the actual object and the Tick that produced it.**

[Shared notation](../CASE-GUIDE.md) · [Runtime source and evidence](../../../../exp/upload-disc-to-shelf/DEVTOOLS.md)

## Parts

Selected Part, its JS material, producing Calculation/input Parts, direct consumers,
execution receipts. Experimental runs retain their actual receiver and arguments.
No copied debugger database or invented object schema.

## m · inspection flow

| Boundary | Action | Inspect |
| --- | --- | --- |
| Discover | Browse/filter/find | Actual live bindings |
| Read | Open object, fields and prototype | Own values, descriptors and identity |
| Trace | Follow composition links | Actual contributing and consuming Parts |
| Run | Explicitly invoke Calculation/getter/method | Result, receiver effects and receipt |
| Review a Tick — next wiring | Execute its selected Calculation sequence | Meaningful boundary state and Case assertions |

Browsing/trace/run exist today. The Tick/Case view is wiring still to do, not a
new execution engine. A neat checklist can open that same boundary evidence.

## Cases at the boundaries

**Fixtures:** a fresh Counter instance with count=2 and getterCalls=0; a produced
Part with addressed/inline inputs; an add Calculation with inputs 3 and 5.
Each Case selects its named fixture; calls require explicit live-effects opt-in.

| Case | Action | Assertion |
| --- | --- | --- |
| `devtools.m.object` | Inspect Counter and its prototype | Real identity, methods, symbol/non-enumerable fields; no ordinary getter/toJSON execution |
| `devtools.m.trace` | Follow a produced Part's inputs | Exact Part identities, including aliases and inline Parts |
| `devtools.m.getter` | Evaluate doubled | Result=4; actual receiver getterCalls=1; execution inspectable |
| `devtools.m.method` | Invoke increment(3) | Actual receiver count=5; result=5 |
| `devtools.m.async` | Run the controlled async add | Running state visible before resolution; awaited result=8 |
| `devtools.m.failure` | Invoke throwing method | Failed receipt, no produced result; not a rollback guarantee |
| `devtools.m.binding` | Supply a missing or ambiguous binding | Preflight rejects it before execution |
| `devtools.m.scratch` | Retain an alternative | Original and application selections remain unchanged |
| `devtools.m.tick` — next | Run one existing upload sequence with a fixed fixture | Start → actions → boundary assertions → inspect mismatches; acceptance unchanged |

Fine-grained edge assertions remain in the [tests](../../../../exp/upload-disc-to-shelf/devtools.test.mjs).
The example doc need not repeat their setup as dozens of independent workflows.

## Actual PxC / evidence

- Target: an existing `pxc.entries()` binding; `object#N` labels JS identity.
- Run: `devtools.run.<n>.started`, `.result` when produced, and `.finished`.
- Execution: `pxc.receipts()`; scratch: `devtools.scratch.<n>` / `devtools.result.<n>`.
- Latest recorded checks: 52 combined tests plus TypeScript; browser object,
  getter, Calculation, identity and failure inspection.

Runtime inspection exists; Stage/Tick selection, boundary Case display and neat
checklist integration remain unwired. No fresh execution is claimed by this edit.

## G

No additions selected.

## M

Compare alternatives side by side, apply validated domain CRUD, persist inspection
bundles, and improve larger-graph navigation.

## Limits

Borrowed material is not a snapshot. Explicit calls can mutate or perform effects;
Proxy reflection traps can execute. No rollback, cancellation, source eval,
breakpoints or private-slot/closure access. Inspection does not mark acceptance.
