# Machinery provenance

Neat’s in-memory PxC, PQL composition names, and PCR testimony were narrowly adapted from ChainSpot commit `b5a6ae040147b488bc44ea94c6303296b2ecde78`:

- `packages/alg/src/exec/board.ts`
- `packages/alg/src/exec/pql.ts`
- `packages/alg/src/exec/pcr.ts`

The retained PQL surface is `PrincipleComponentRender` → ordered `Ticks` → `Calculations` with `call`, `with`, `args`, and `into`. Neat provides no parser or text query language. Its programmatic runner consumes that same object shape and uses `with` address strings as PxC Part references.

Neat’s board PCR is `pcr.neat.board`; its executed composition is named `NeatBoard`. They intentionally have distinct identities: the former is the displayable board rendering; the latter is the execution composition. The board-PCR carries testimony from that executed run and does not claim product verification or human acceptance.

The Tidy extraction target was empty when this checkpoint was built. Neat has no promotion command or adapter; it retains only promotion references until Tidy publishes an actual receipt/interface.
