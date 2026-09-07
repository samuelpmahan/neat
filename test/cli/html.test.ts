import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);

test("html writes a self-contained report at the requested path", async () => {
  const root = await mkdtemp(join(tmpdir(), "neat-html-"));
  await mkdir(join(root, ".neat", "items"), { recursive: true });
  const workItem = { schemaVersion: 1, id: "A", outcome: "A", location: { component: "demo" }, target: { kind: "calculation", identity: "fn.a" }, requirements: [], dependencies: [], status: "queued", blockers: [], checkpoints: [], acceptanceRefs: [], promotionRefs: [], resume: "continue" };
  await writeFile(join(root, ".neat", "items", "A.json"), `${JSON.stringify(workItem)}\n`);
  const out = join(root, "reports", "report.html");
  const result = await run(process.execPath, [join(process.cwd(), "dist/src/cli.js"), "html", "--root", root, "--out", out]);
  assert.equal(result.stdout.trim(), out);
  const html = await readFile(out, "utf8");
  assert.match(html, /Board/);
  assert.match(html, /Matrix/);
  assert.match(html, /Dependencies/);
});
