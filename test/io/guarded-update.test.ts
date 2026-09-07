import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { guardedUpdate } from "../../src/io.js";
import { WorkItem, workItemRevision } from "../../src/work-items.js";

function item(id: string): WorkItem {
  return {
    schemaVersion: 1, id, outcome: id, location: { component: "fixture" },
    target: { kind: "calculation", identity: "fn.fixture.work" }, requirements: [], dependencies: [],
    status: "queued", blockers: [], checkpoints: [], acceptanceRefs: [], promotionRefs: [], resume: "resume",
  };
}

test("guarded filesystem update replaces only the addressed JSON after fingerprint check", async () => {
  const root = await mkdtemp(join(tmpdir(), "neat-"));
  try {
    const directory = join(root, ".neat", "items");
    await mkdir(directory, { recursive: true });
    const first = item("A");
    const second = item("B");
    await writeFile(join(directory, "A.json"), `${JSON.stringify(first, null, 2)}\n`);
    await writeFile(join(directory, "B.json"), `${JSON.stringify(second, null, 2)}\n`);
    const beforeOther = await readFile(join(directory, "B.json"), "utf8");
    await guardedUpdate(root, "A", workItemRevision(first), { status: "active", agent: "luna" });
    assert.equal(JSON.parse(await readFile(join(directory, "A.json"), "utf8")).agent, "luna");
    assert.equal(await readFile(join(directory, "B.json"), "utf8"), beforeOther);
    await assert.rejects(() => guardedUpdate(root, "A", workItemRevision(first), { resume: "stale" }), /Expected/);
    await writeFile(join(directory, "A.json.lock"), "another writer owns this item\n");
    await assert.rejects(() => guardedUpdate(root, "A", workItemRevision(first), { resume: "contended" }), /is locked/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
