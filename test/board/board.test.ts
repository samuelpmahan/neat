import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { materializeBoard } from "../../src/board.js";
import { BoardFacts, WorkItem, updateWorkItem, workItemRevision } from "../../src/work-items.js";

const fixtureRoot = new URL("../../../fixtures/generic-project/.neat/", import.meta.url);
const items = readdirSync(new URL("items/", fixtureRoot))
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => JSON.parse(readFileSync(new URL(`items/${name}`, fixtureRoot), "utf8")) as WorkItem);
const facts = JSON.parse(
  readFileSync(new URL("facts.json", fixtureRoot), "utf8"),
) as BoardFacts;

test("generic fixture materializes all requested activity states", () => {
  const board = materializeBoard({ items, facts });
  const buckets = Object.fromEntries(board.assessments.map((assessment) => [assessment.itemId, assessment.bucket]));
  assert.deepEqual(buckets, {
    "EX-01": "promoted",
    "EX-02": "ready-for-review",
    "EX-03": "active",
    "EX-04": "queued",
    "EX-05": "blocked",
    "EX-06": "blocked",
  });
  assert.match(board.markdown, /fixture evidence is explicitly synthetic/);
  assert.match(board.markdown, /EX-05/);
  assert.match(board.mermaid, /blocked/);
});

test("calculation fanout comes from canonical Tick composition", () => {
  const board = materializeBoard({ items, facts });
  assert.deepEqual(board.calculationFanout["fn.example.prepare-image"], ["EX-03", "EX-05"]);
  assert.match(board.mermaid, /fn_example_prepare_image.*shared calculation/);
});

test("guarded update fingerprints content and leaves unrelated records untouched", () => {
  const ex04 = items.find((item) => item.id === "EX-04")!;
  const other = items.find((item) => item.id === "EX-03")!;
  const revision = workItemRevision(ex04);
  const result = updateWorkItem(items, "EX-04", revision, { status: "active", agent: "facts-worker" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.items.find((item) => item.id === "EX-03"), other);
  assert.equal(result.item.agent, "facts-worker");
  const stale = updateWorkItem(result.items, "EX-04", revision, { resume: "stale" });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.reason, "revision_mismatch");
  const invalidPatch = { status: "active", acceptanceRefs: [] } as any;
  const invalid = updateWorkItem(items, "EX-04", revision, invalidPatch);
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.reason, "invalid_patch");
});

test("explicit acceptance is independent of verification", () => {
  const item = structuredClone(items.find((candidate) => candidate.id === "EX-02")!) as WorkItem;
  item.acceptanceRefs = [
    {
      ref: "fixture-acceptance-example-02",
      human: "Sam",
      subjectCommit: "fixture-example-sha-02",
      requirementScope: ["photo"],
      disposition: "accepted",
      source: "fixture-chat-decision-example-02",
      synthetic: true,
    },
  ];
  const board = materializeBoard({
    items: [item],
    facts: {
      ...facts,
      allowSynthetic: true,
      verificationRecords: [],
      acceptanceRecords: [
        {
          id: "fixture-acceptance-example-02",
          itemId: "EX-02",
          subjectCommit: "fixture-example-sha-02",
          requirementScope: ["photo"],
          disposition: "accepted",
          human: "Sam",
          source: "fixture-chat-decision-example-02",
          synthetic: true,
        },
      ],
    },
  });
  assert.equal(board.assessments[0].verified, false);
  assert.equal(board.assessments[0].accepted, true);
});

test("missing dependency and cycles are explicit", () => {
  const a = structuredClone(items[0]) as WorkItem;
  const b = structuredClone(items[1]) as WorkItem;
  a.id = "A";
  a.dependencies = [{ item: "B", requires: "verified" }];
  b.id = "B";
  b.dependencies = [{ item: "A", requires: "verified" }];
  const board = materializeBoard({ items: [a, b], facts });
  assert.equal(board.graph.cycles.length, 1);
  assert.equal(board.assessments.find((item) => item.itemId === "A")!.bucket, "blocked");
});
