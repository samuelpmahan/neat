# Work board contract

`src/work-items.ts` holds declared work and the pure single-item compare-and-update operation. A work item targets one existing execution identity: `fn.*` for a Calculation, `tick.*` for a composition Tick, or `pcr.*` for a PCR. It never targets another task.

Execution and inspection records are named by checkpoint `verificationRefs` and resolved from `BoardFacts.verificationRecords`. A passing record must match the item, checkpoint, subject commit, target kind, and target identity. Missing records remain `unknown`. Human acceptance and Tidy promotion are separate facts: either can be absent without being inferred from the other.

`registerBoardCalculations` exposes the three bounded calculations to the shared PxC/PQL runtime:

| Identity | Input | Output |
| --- | --- | --- |
| `fn.neat.assess` | items + resolved facts | per-item evidence axes |
| `fn.neat.dependencies` | items + assessments | edges, missing IDs, cycles |
| `fn.neat.view` | items + assessments + graph | board-ready assessments |

`BOARD_PQL_COMPOSITION` is the corresponding existing composition shape. `materializeBoard` seeds PxC, registers those calculations, executes that PQL composition, composes its own board-PCR testimony, then projects the retained view into Markdown and Mermaid. It performs no I/O or hidden product verification.

The DiscStudio fixture is synthetic and labeled as such. Its canonical composition facts derive calculation-impact fanout: `fn.discstudio.prepare-image` is consumed by both the framing and shelf-insertion Ticks. Fanout is never inferred from a task-to-task graph.

`workItemRevision(item)` computes a deterministic content fingerprint. `updateWorkItem` compares the expected fingerprint, updates only the addressed item, and rejects fields that would fabricate acceptance, promotion, or execution testimony.
