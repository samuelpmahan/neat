import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { materializeBoard } from "../../src/board.js";
import { importHumanInspection, readSnapshot, submitReview } from "../../src/io.js";
import { renderReport } from "../../src/report.js";
import { HumanInspectionRecord, ReviewSubmission } from "../../src/review.js";
import { WorkItem, workItemRevision } from "../../src/work-items.js";

function item(): WorkItem { return { schemaVersion: 1, id: "R", outcome: "Review", location: { component: "demo" }, target: { kind: "tick", identity: "tick.review", composition: "demo.pcr" }, requirements: [{ id: "r", text: "Inspect it" }], dependencies: [], status: "review", blockers: [], checkpoints: [{ id: "cp", commit: "deadbeef", observationRef: "report.html", verificationRefs: {} }], acceptanceRefs: [], promotionRefs: [], resume: "review" }; }
function submission(current: WorkItem): ReviewSubmission { return { schemaVersion: 1, id: "handoff-1", itemId: "R", expectedItemRevision: workItemRevision(current), checkpointId: "cp", subjectCommit: "deadbeef", createdBy: "agent", whatChanged: ["Rendered the review report."], verifications: [
  { id: "run", label: "Run", recordKind: "calculation", requirementIds: ["r"], results: { r: "passed" }, observed: "Completed.", links: [{ label: "Report", href: "report.html" }], reviewable: true },
  { id: "render", label: "Render", recordKind: "inspection", requirementIds: ["r"], results: { r: "passed" }, observed: "Visible.", links: [{ label: "Report", href: "report.html" }], reviewable: true },
] }; }

async function fixture() { const root = await mkdtemp(join(tmpdir(), "neat-review-")); const dir = join(root, ".neat", "items"); await mkdir(dir, { recursive: true }); const current = item(); await writeFile(join(dir, "R.json"), JSON.stringify(current)); return { root, current }; }

test("immutable review handoff projects verification while exported inspection stays independent", async () => {
  const { root, current } = await fixture();
  try {
    await submitReview(root, submission(current));
    await assert.rejects(() => submitReview(root, submission(current)), /immutable/);
    let snapshot = await readSnapshot(root); let board = materializeBoard(snapshot);
    assert.equal(board.assessments[0].verified, true); assert.equal(board.assessments[0].accepted, false); assert.equal(board.assessments[0].humanInspectionCount, 0);
    const inspection: HumanInspectionRecord = { schemaVersion: 1, id: "inspection-1", submissionId: "handoff-1", itemId: "R", checkpointId: "cp", subjectCommit: "deadbeef", human: "Sam", inspected: { run: true, render: false } };
    await importHumanInspection(root, inspection);
    snapshot = await readSnapshot(root); board = materializeBoard(snapshot);
    assert.equal(board.assessments[0].humanInspectionCount, 1); assert.equal(board.assessments[0].accepted, false);
    await assert.rejects(() => importHumanInspection(root, { ...inspection, id: "bad", subjectCommit: "wrong" }), /mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("stale immutable handoff remains history and does not prove a newer item", async () => {
  const { root, current } = await fixture();
  try {
    await submitReview(root, submission(current));
    const changed = { ...current, resume: "new checkpoint direction" }; await writeFile(join(root, ".neat", "items", "R.json"), JSON.stringify(changed));
    const snapshot = await readSnapshot(root); const board = materializeBoard(snapshot);
    assert.equal(board.assessments[0].verified, false);
    assert.equal(snapshot.facts.verificationRecords?.filter((record) => record.submissionId).length, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("report embeds one exportable overlay even when more than one current handoff exists", () => {
  const current = item(); const one = submission(current); const two = { ...submission(current), id: "handoff-2" };
  const html = renderReport(materializeBoard({ items: [current], facts: {} }), [current], { submissions: [one, two] });
  assert.match(html, />Review</); assert.equal((html.match(/<tick-part-checklist/g) ?? []).length, 2); assert.match(html, /Inspection is recorded separately from acceptance/);
});
