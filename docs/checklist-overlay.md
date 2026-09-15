# Review checklist overlay

`public/tick-part-checklist.js` is derived from DiscStudio's existing `tick-part-checklist` overlay (base `48ca10d`; inspected snapshot SHA-256 `fae43e320c326b195839476fc24d08db22f9990d4426cfbec553b7272e0fd51e`). It retains the `data-checklist`, `storage-key`, hidable panel, and Tick/Part behavior.

When a part adds `reviewId` and `action`, it becomes a review check. Set `submission-id`, `item-id`, `checkpoint-id`, and `subject-commit`; **Export inspection** downloads a durable record. Import it with `neat import-inspection file.json`. Checking it records inspection only; it never accepts or promotes work.
