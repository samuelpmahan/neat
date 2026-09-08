import type { BoardFacts, Checkpoint, EvidenceResult, WorkItem, WorkTarget } from "./work-items.js";
import { workItemRevision } from "./work-items.js";

export interface ReviewLink { label: string; href: string; }
export interface SubmittedVerification {
  id: string;
  label: string;
  recordKind: "calculation" | "tick" | "pcr" | "inspection";
  requirementIds: string[];
  results: Record<string, EvidenceResult>;
  observed: string;
  links: ReviewLink[];
  /** Include this proof in Sam's independent review checklist. */
  reviewable?: boolean;
}

/** Immutable agent handoff. It is structured data, never prose parsed into facts. */
export interface ReviewSubmission {
  schemaVersion: 1;
  id: string;
  itemId: string;
  expectedItemRevision: string;
  checkpointId: string;
  subjectCommit: string;
  createdBy: string;
  whatChanged: string[];
  verifications: SubmittedVerification[];
}

/** A human inspection record. It deliberately contains no acceptance disposition. */
export interface HumanInspectionRecord {
  schemaVersion: 1;
  id: string;
  submissionId: string;
  itemId: string;
  checkpointId: string;
  subjectCommit: string;
  human: string;
  inspected: Record<string, boolean>;
}

export interface SubmissionAssessment {
  submission: ReviewSubmission;
  current: boolean;
  reason?: string;
}

const SAFE_ID = /^[A-Za-z0-9._-]+$/;
export function safeReviewId(id: string): boolean { return SAFE_ID.test(id); }

function checkpointMatches(item: WorkItem, submission: ReviewSubmission): Checkpoint | undefined {
  const checkpoint = item.checkpoints[item.checkpoints.length - 1];
  return checkpoint?.id === submission.checkpointId && checkpoint.commit === submission.subjectCommit ? checkpoint : undefined;
}
function isResult(value: unknown): value is EvidenceResult { return value === "passed" || value === "failed" || value === "unknown"; }
function isRecordKind(value: unknown): value is SubmittedVerification["recordKind"] { return value === "calculation" || value === "tick" || value === "pcr" || value === "inspection"; }
function isText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function safeLinkHref(value: string): boolean { return /^https?:\/\//i.test(value) || /^(?!\/\/)(?![a-z][a-z0-9+.-]*:)[^\s]+$/iu.test(value); }

export function validateSubmission(submission: ReviewSubmission, item: WorkItem): string[] {
  const errors: string[] = [];
  if (submission.schemaVersion !== 1) errors.push("submission: unsupported schemaVersion");
  if (!isText(submission.id) || !safeReviewId(submission.id)) errors.push("submission: unsafe id");
  if (!isText(submission.itemId) || submission.itemId !== item.id) errors.push("submission: itemId does not match target item");
  if (submission.expectedItemRevision !== workItemRevision(item)) errors.push("submission: item revision is stale");
  const checkpoint = checkpointMatches(item, submission);
  if (!checkpoint) errors.push("submission: checkpoint and subject commit do not match the current item");
  if (!isText(submission.createdBy)) errors.push("submission: createdBy is required");
  if (!Array.isArray(submission.whatChanged) || !submission.whatChanged.some(isText)) errors.push("submission: whatChanged is required");
  const requirementIds = new Set(item.requirements.map((requirement) => requirement.id));
  const seen = new Set<string>();
  const covered = new Set<string>();
  for (const verification of submission.verifications ?? []) {
    if (!isText(verification.id) || !safeReviewId(verification.id) || seen.has(verification.id)) errors.push(`submission: invalid or duplicate verification ${String(verification.id)}`);
    seen.add(verification.id);
    if (!isText(verification.label) || !isText(verification.observed) || !isRecordKind(verification.recordKind)) errors.push(`submission: ${String(verification.id)} needs label, observed result, and valid record kind`);
    if (!Array.isArray(verification.links) || verification.links.length === 0 || verification.links.some((link) => !isText(link?.label) || !isText(link?.href) || !safeLinkHref(link.href))) errors.push(`submission: ${String(verification.id)} needs a safe inspectable link`);
    if (!Array.isArray(verification.requirementIds) || !verification.results || typeof verification.results !== "object") errors.push(`submission: ${String(verification.id)} needs requirement results`);
    for (const requirementId of verification.requirementIds ?? []) {
      if (!requirementIds.has(requirementId)) errors.push(`submission: ${verification.id} names unknown requirement ${requirementId}`);
      else covered.add(requirementId);
      if (!Object.hasOwn(verification.results ?? {}, requirementId) || !isResult(verification.results?.[requirementId])) errors.push(`submission: ${verification.id} has no valid result for ${requirementId}`);
    }
  }
  for (const requirement of item.requirements) if (!covered.has(requirement.id)) errors.push(`submission: requirement ${requirement.id} has no submitted verification`);
  return errors;
}

export function validateHumanInspection(record: HumanInspectionRecord, submission: ReviewSubmission): string[] {
  const errors: string[] = [];
  if (record.schemaVersion !== 1) errors.push("inspection: unsupported schemaVersion");
  if (!isText(record.id) || !safeReviewId(record.id)) errors.push("inspection: unsafe id");
  if (record.submissionId !== submission.id || record.itemId !== submission.itemId || record.checkpointId !== submission.checkpointId || record.subjectCommit !== submission.subjectCommit) errors.push("inspection: submission/checkpoint subject mismatch");
  if (!isText(record.human)) errors.push("inspection: human is required");
  if (!record.inspected || typeof record.inspected !== "object" || Array.isArray(record.inspected)) errors.push("inspection: inspected must be an object");
  const ids = new Set(submission.verifications.filter((verification) => verification.reviewable).map((verification) => verification.id));
  for (const [id, checked] of Object.entries(record.inspected ?? {})) {
    if (!ids.has(id)) errors.push(`inspection: unknown review check ${id}`);
    if (typeof checked !== "boolean") errors.push(`inspection: ${id} must be boolean`);
  }
  return errors;
}

export function verificationFacts(submissions: readonly ReviewSubmission[], items: readonly WorkItem[]): NonNullable<BoardFacts["verificationRecords"]> {
  const byId = new Map(items.map((item) => [item.id, item]));
  return submissions.flatMap((submission) => submission.verifications.map((verification) => ({
    id: `${submission.id}.${verification.id}`,
    submissionId: submission.id,
    itemId: submission.itemId,
    checkpointId: submission.checkpointId,
    subjectCommit: submission.subjectCommit,
    recordKind: verification.recordKind,
    target: reviewTarget(byId.get(submission.itemId)!),
    requirementResults: verification.results,
    label: verification.label,
  })));
}

/** The report keeps only submissions which still exactly describe the current item. */
export function assessSubmissions(items: readonly WorkItem[], submissions: readonly ReviewSubmission[]): SubmissionAssessment[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return submissions.map((submission) => {
    const item = byId.get(submission.itemId);
    if (!item) return { submission, current: false, reason: "work item no longer exists" };
    const errors = validateSubmission(submission, item);
    return errors.length ? { submission, current: false, reason: errors.join("; ") } : { submission, current: true };
  });
}

export function renderHandoffMarkdown(items: readonly WorkItem[], submissions: readonly ReviewSubmission[]): string {
  const markdownLink = (link: ReviewLink): string => safeLinkHref(link.href) ? `[${link.label}](${link.href})` : `${link.label} (unsafe link omitted)`;
  const assessments = assessSubmissions(items, submissions).filter((assessment) => assessment.current);
  if (!assessments.length) return "# Review handoffs\n\nNo current structured review handoffs.\n";
  return `# Review handoffs\n\n${assessments.map(({ submission }) => {
    const item = items.find((candidate) => candidate.id === submission.itemId)!;
    return `## ${submission.itemId}: ${item.outcome}\n\nCheckpoint: \`${submission.subjectCommit}\` (${submission.checkpointId})\n\n### What changed\n\n${submission.whatChanged.map((change) => `- ${change}`).join("\n")}\n\n### Verifications\n\n${submission.verifications.map((verification) => `- **${verification.label}** — ${verification.observed} (${verification.requirementIds.join(", ") || "no requirement"})\n  ${verification.links.map(markdownLink).join(" · ")}`).join("\n")}\n\nHuman inspection and acceptance remain separate records.\n`;
  }).join("\n")}`;
}

export function reviewTarget(item: WorkItem): WorkTarget { return { ...item.target }; }
