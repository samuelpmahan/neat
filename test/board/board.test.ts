import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { materializeBoard } from "../../src/board.js";
import { BoardFacts, WorkItem, updateWorkItem, workItemRevision } from "../../src/work-items.js";

const fixtureRoot = new URL("../../../fixtures/discstudio/.neat/", import.meta.url);
const items = readdirSync(new URL("items/", fixtureRoot))
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => JSON.parse(readFileSync(new URL(`items/${name}`, fixtureRoot), "utf8")) as WorkItem);
const facts = JSON.parse(
  readFileSync(new URL("facts.json", fixtureRoot), "utf8"),
) as BoardFacts;

test("DiscStudio fixture materializes all requested activity states", () => {
  const board = materializeBoard({ items, facts });
  const buckets = Object.fromEntries(board.assessments.map((assessment) => [assessment.itemId, assessment.bucket]));
  assert.deepEqual(buckets, {
    "DS-01": "promoted",
    "DS-02": "ready-for-review",
    "DS-03": "active",
    "DS-04": "queued",
    "DS-05": "blocked",
    "DS-06": "blocked",
  });
  assert.match(board.markdown, /fixture evidence is explicitly synthetic/);
  assert.match(board.markdown, /DS-05/);
  assert.match(board.mermaid, /blocked/);
});

test("calculation fanout comes from canonical Tick composition", () => {
  const board = materializeBoard({ items, facts });
  assert.deepEqual(board.calculationFanout["fn.discstudio.prepare-image"], ["DS-03", "DS-05"]);
  assert.match(board.mermaid, /fn_discstudio_prepare_image.*shared calculation/);
});

test("guarded update fingerprints content and leaves unrelated records untouched", () => {
  const ds04 = items.find((item) => item.id === "DS-04")!;
  const other = items.find((item) => item.id === "DS-03")!;
  const revision = workItemRevision(ds04);
  const result = updateWorkItem(items, "DS-04", revision, { status: "active", agent: "facts-worker" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.items.find((item) => item.id === "DS-03"), other);
  assert.equal(result.item.agent, "facts-worker");
  const stale = updateWorkItem(result.items, "DS-04", revision, { resume: "stale" });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.reason, "revision_mismatch");
  const invalidPatch = { status: "active", acceptanceRefs: [] } as any;
  const invalid = updateWorkItem(items, "DS-04", revision, invalidPatch);
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.reason, "invalid_patch");
});

test("explicit acceptance is independent of verification", () => {
  const item = structuredClone(items.find((candidate) => candidate.id === "DS-02")!) as WorkItem;
  item.acceptanceRefs = [
    {
      ref: "fixture-acceptance-ds-02",
      human: "Sam",
      subjectCommit: "fixture-discstudio-sha-02",
      requirementScope: ["photo"],
      disposition: "accepted",
      source: "fixture-chat-decision-ds-02",
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
          id: "fixture-acceptance-ds-02",
          itemId: "DS-02",
          subjectCommit: "fixture-discstudio-sha-02",
          requirementScope: ["photo"],
          disposition: "accepted",
          human: "Sam",
          source: "fixture-chat-decision-ds-02",
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
