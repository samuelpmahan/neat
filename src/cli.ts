#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { materializeBoard } from "./board.js";
import { guardedUpdate, readSnapshot, snapshotProblems } from "./io.js";
import type { WorkItemUpdatePatch } from "./work-items.js";
import { workItemRevision } from "./work-items.js";

function usage(): string {
  return "neat <check|next|board|update> [--root <repo>]\n  update <id> --expect <item-fingerprint> --patch <json-file>";
}

function option(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function main(args: string[]): Promise<void> {
  const command = args[0];
  const root = option(args, "--root") ?? process.cwd();
  if (!command || command === "--help" || command === "help") throw new Error(usage());
  if (command === "update") {
    const id = args[1];
    const expected = option(args, "--expect");
    const patchPath = option(args, "--patch");
    if (!id || !expected || !patchPath) throw new Error(usage());
    const patch = JSON.parse(await readFile(patchPath, "utf8")) as WorkItemUpdatePatch;
    const result = await guardedUpdate(root, id, expected, patch);
    process.stdout.write(`${result.item.id} updated; previous fingerprint ${result.previousFingerprint}\n`);
    return;
  }
  const snapshot = await readSnapshot(root);
  const problems = snapshotProblems(snapshot);
  if (command === "check") {
    if (problems.length) throw new Error(problems.join("\n"));
    process.stdout.write(`neat check: ${snapshot.items.length} item schemas valid\n`);
    return;
  }
  if (problems.length) throw new Error(problems.join("\n"));
  const board = materializeBoard(snapshot);
  if (command === "board") {
    process.stdout.write(`${board.markdown}\n\n\`\`\`mermaid\n${board.mermaid}\n\`\`\`\n`);
    return;
  }
  if (command === "next") {
    const available = board.assessments.filter((item) => item.bucket === "queued" && item.dependencySatisfied && item.available === "available");
    const active = board.assessments.filter((item) => item.activity === "active");
    process.stdout.write(JSON.stringify({
      available,
      active,
      itemFingerprints: Object.fromEntries(snapshot.items.map((item) => [item.id, workItemRevision(item)])),
      fingerprint: board.inputFingerprint,
    }, null, 2) + "\n");
    return;
  }
  throw new Error(usage());
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
