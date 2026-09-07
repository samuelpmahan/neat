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

The checked-in generic project fixture is synthetic and labeled as such. Its canonical composition facts derive calculation-impact fanout: `fn.example.prepare-image` is consumed by both example Ticks. Fanout is never inferred from a task-to-task graph.

`workItemRevision(item)` computes a deterministic content fingerprint. `updateWorkItem` compares the expected fingerprint, updates only the addressed item, and rejects fields that would fabricate acceptance, promotion, or execution testimony.

## mGM scope contract

An optional `.neat/mgm.json` records the staged build for each independently inspectable unit. Each unit uses the same canonical target identity already declared by its WorkItem (`fn.*`, `tick.*`, or `pcr.*`); mGM does not create a parallel task hierarchy or alternate target identity.

Each unit may declare `minimal`, `goldilocks`, and `maximal` requirement tiers. Tiers are cumulative: Goldilocks includes the minimal requirements, and maximal includes both earlier tiers. A tier’s `requirementIds` contains IDs that refer to that WorkItem’s declared requirements. The desired tier is a target; observed verification, human acceptance, and Tidy promotion remain separate facts and are never inferred from the target.

PxC/PQL/PCR remains foundational at every tier. The mGM matrix varies product capability and requirements while each result still has an accounted-for target, calculation composition, execution evidence, inspection, and acceptance path.

`neat html` writes a local HTML view from the same retained board model as Markdown and Mermaid. It presents the current board, mGM matrix, and dependency/fanout relationships for inspection; it does not add evidence or change work records.
