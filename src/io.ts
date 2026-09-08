import { link, mkdir, open, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { HumanInspectionRecord, ReviewSubmission, assessSubmissions, validateHumanInspection, validateSubmission, verificationFacts } from "./review.js";
import { BoardFacts, WorkItem, WorkItemUpdatePatch, updateWorkItem, validateWorkItem, workItemRevision } from "./work-items.js";

export interface NeatSnapshot {
  root: string;
  items: WorkItem[];
  facts: BoardFacts;
  submissions: ReviewSubmission[];
  humanInspections: HumanInspectionRecord[];
}

function itemDirectory(root: string): string { return join(root, ".neat", "items"); }
function factsPath(root: string): string { return join(root, ".neat", "facts.json"); }
function submissionDirectory(root: string): string { return join(root, ".neat", "submissions"); }
function inspectionDirectory(root: string): string { return join(root, ".neat", "inspections"); }
async function readJsonDirectory<T>(directory: string): Promise<T[]> {
  return readdir(directory).then(async (names) => Promise.all(names.filter((name) => name.endsWith(".json")).sort().map(async (name) => JSON.parse(await readFile(join(directory, name), "utf8")) as T))).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  });
}
async function createImmutable(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, contents, "utf8");
  try { await link(temporary, path); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`Refusing to overwrite immutable record ${basename(path)}.`); throw error; }
  finally { await unlink(temporary).catch(() => undefined); }
}
function safeReviewFileId(id: unknown): id is string { return typeof id === "string" && /^[A-Za-z0-9._-]+$/.test(id); }
function itemPath(root: string, id: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new Error(`Unsafe work-item identity '${id}'.`);
  return join(itemDirectory(root), `${id}.json`);
}

export async function readSnapshot(root: string): Promise<NeatSnapshot> {
  const directory = itemDirectory(root);
  const names = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  const items = await Promise.all(names.map(async (name) => JSON.parse(await readFile(join(directory, name), "utf8")) as WorkItem));
  const facts: BoardFacts = await readFile(factsPath(root), "utf8")
    .then((text) => JSON.parse(text) as BoardFacts)
    .catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {} as BoardFacts;
      throw error;
    });
  const submissions = await readJsonDirectory<ReviewSubmission>(submissionDirectory(root));
  const humanInspections = await readJsonDirectory<HumanInspectionRecord>(inspectionDirectory(root));
  const currentSubmissions = assessSubmissions(items, submissions).filter((assessment) => assessment.current).map((assessment) => assessment.submission);
  const submittedFacts = verificationFacts(currentSubmissions, items);
  const currentSubmissionIds = new Set(currentSubmissions.map((submission) => submission.id));
  return { root, items, submissions, humanInspections, facts: {
    ...facts,
    verificationRecords: [...(facts.verificationRecords ?? []), ...submittedFacts],
    reviewSubmissionItemIds: [...new Set([...(facts.reviewSubmissionItemIds ?? []), ...currentSubmissions.map((submission) => submission.itemId)])],
    humanInspectionRecords: [...(facts.humanInspectionRecords ?? []), ...humanInspections.filter((inspection) => currentSubmissionIds.has(inspection.submissionId))],
  } };
}

export function snapshotProblems(snapshot: NeatSnapshot): string[] {
  const ids = new Set<string>();
  const problems = snapshot.items.flatMap((item) => {
    const errors = validateWorkItem(item);
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate item id`);
    ids.add(item.id);
    return errors;
  });
  const byId = new Map(snapshot.items.map((item) => [item.id, item]));
  // Immutable handoffs are historical evidence. Current ones are validated and projected;
  // stale ones remain readable but cannot block the next checkpoint.
  const current = assessSubmissions(snapshot.items, snapshot.submissions).filter((assessment) => assessment.current).map((assessment) => assessment.submission);
  const bySubmission = new Map(current.map((submission) => [submission.id, submission]));
  for (const inspection of snapshot.humanInspections) {
    const submission = bySubmission.get(inspection.submissionId);
    if (submission) problems.push(...validateHumanInspection(inspection, submission));
  }
  return problems;
}

/**
 * A short exclusive sibling lock makes the content-fingerprint comparison a
 * real guarded update. It intentionally never removes a stale lock.
 */
export async function guardedUpdate(
  root: string,
  id: string,
  expectedFingerprint: string,
  patch: WorkItemUpdatePatch,
): Promise<{ item: WorkItem; previousFingerprint: string }> {
  if (patch.status === "review") throw new Error("Use neat submit with a structured review handoff; status=review alone is a legacy display state.");
  const path = itemPath(root, id);
  const lockPath = `${path}.lock`;
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`Item '${id}' is locked; inspect ${basename(lockPath)} before retrying.`);
    throw error;
  }
  try {
    const text = await readFile(path, "utf8");
    const current = JSON.parse(text) as WorkItem;
    const result = updateWorkItem([current], id, expectedFingerprint, patch);
    if (!result.ok) {
      if (result.reason === "revision_mismatch") throw new Error(`Expected ${expectedFingerprint}; current item fingerprint is ${result.currentRevision}.`);
      throw new Error(result.reason === "not_found" ? `Item '${id}' was not found.` : result.message);
    }
    const problems = validateWorkItem(result.item);
    if (problems.length) throw new Error(`Refusing invalid update: ${problems.join("; ")}`);
    const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(result.item, null, 2)}\n`, "utf8");
    await rename(temporary, path);
    return { item: result.item, previousFingerprint: workItemRevision(current) };
  } finally {
    await lock?.close();
    await unlink(lockPath).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    });
  }
}

/** Submit an immutable structured handoff only when it still names the current item/checkpoint. */
export async function submitReview(root: string, submission: ReviewSubmission): Promise<void> {
  if (!safeReviewFileId(submission.id) || !safeReviewFileId(submission.itemId)) throw new Error("Refusing unsafe review submission identity.");
  const path = itemPath(root, submission.itemId); const lockPath = `${path}.lock`;
  let lock; try { lock = await open(lockPath, "wx"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error(`Item '${submission.itemId}' is locked; retry review submission.`); throw error; }
  try {
    const current = JSON.parse(await readFile(path, "utf8")) as WorkItem;
    const errors = validateSubmission(submission, current);
    if (errors.length) throw new Error(`Refusing review submission: ${errors.join("; ")}`);
    await createImmutable(join(submissionDirectory(root), `${submission.id}.json`), `${JSON.stringify(submission, null, 2)}\n`);
  } finally { await lock.close(); await unlink(lockPath).catch(() => undefined); }
}

/** Persist a browser-exported checklist result without mutating verification or acceptance facts. */
export async function importHumanInspection(root: string, record: HumanInspectionRecord): Promise<void> {
  if (!safeReviewFileId(record.id) || !safeReviewFileId(record.submissionId) || !safeReviewFileId(record.itemId)) throw new Error("Refusing unsafe human inspection identity.");
  const submissionPath = join(submissionDirectory(root), `${record.submissionId}.json`);
  const submission = JSON.parse(await readFile(submissionPath, "utf8")) as ReviewSubmission;
  const current = JSON.parse(await readFile(itemPath(root, record.itemId), "utf8")) as WorkItem;
  const submissionErrors = validateSubmission(submission, current);
  const errors = [...submissionErrors, ...validateHumanInspection(record, submission)];
  if (errors.length) throw new Error(`Refusing human inspection import: ${errors.join("; ")}`);
  await createImmutable(join(inspectionDirectory(root), `${record.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
}
