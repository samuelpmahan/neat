# Generic review handoff example

From the repository root:

```sh
node dist/src/cli.js submit examples/review-handoff/submission.json --root examples/review-handoff
node dist/src/cli.js handoff --root examples/review-handoff --out handoff.md
node dist/src/cli.js html --root examples/review-handoff --out ready-review.html
```

`ready-review.html` is self-contained. Open its **Review** tab, follow the proof routes, check any items you personally inspected, and export the JSON. Import it from the same root:

```sh
node dist/src/cli.js import-inspection inspection-demo-review-submission.json --root examples/review-handoff
```

The exported checkbox record does not accept or promote the handoff.
