# DiscStudio example

This directory is a planned project setup for DiscStudio on the `impl/DiscStudio` branch. It contains four independently inspectable Ticks, their canonical `discstudio.first-flow` composition, and a Goldilocks-targeted mGM capability matrix.

The setup contains no execution, inspection, human acceptance, or Tidy promotion facts. It does not claim that DiscStudio is implemented or that any DiscStudio result has been executed or accepted. Automatic framing correction is recorded as a future experiment in the maximal tier; manual ellipse adjustment is the selected Goldilocks baseline.

PxC, PQL, and PCR remain foundational at every scope. The mGM tiers describe cumulative capability requirements; observed progress is recorded separately when real work produces evidence.

The current mGM matrix is planning data. WorkItem verification still evaluates all declared requirements, so this setup provides no tier verification or maturity tracking and makes no claim that Goldilocks has been achieved. The next neat gap is an evidence-to-selected-target requirement-subset mechanism.

From this directory, validate the item schemas:

```sh
node ../../dist/src/cli.js check --root .
```

Generate the local Board / Matrix / Dependencies report:

```sh
node ../../dist/src/cli.js html --root .
```

The report is written to `.neat/out/neat-report.html`.
