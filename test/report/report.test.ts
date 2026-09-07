import assert from "node:assert/strict";
import test from "node:test";
import { materializeBoard } from "../../src/board.js";
import { renderReport, safeHref, type MgmMatrix } from "../../src/report.js";
import type { BoardFacts, WorkItem } from "../../src/work-items.js";

const item = (id: string, identity: string, dependencies: WorkItem["dependencies"] = []): WorkItem => ({
  schemaVersion: 1, id, outcome: `Outcome ${id}`, location: { component: "demo" },
  target: { kind: "tick", identity, composition: "demo.flow" }, requirements: [{ id: "r", text: "Inspectable" }],
  dependencies, status: "queued", blockers: [], checkpoints: [], acceptanceRefs: [], promotionRefs: [], resume: "continue",
});

const items = [item("T-A", "tick.alpha"), item("T-B", "tick.beta", [{ item: "T-A", requires: "verified" }])];
const facts: BoardFacts = { availableSurfaces: ["demo"], compositions: [{ identity: "demo.flow", pql: { PrincipleComponentRender: "Demo", Ticks: [{ name: "tick.alpha", Calculations: [{ call: "fn.shared", into: "px.alpha" }] }, { name: "tick.beta", Calculations: [{ call: "fn.shared", into: "px.beta" }] }] } }] };
const matrix: MgmMatrix = {
  schemaVersion: 1, scopeSemantics: "cumulative", foundations: ["PxC", "PQL", "PCR"], title: "DiscStudio mGM",
  units: [{ id: "photo", title: "Photo intake", target: { kind: "tick", identity: "tick.alpha" }, inspectableResult: "That is my photo.", targetScope: "goldilocks", scopes: {
  minimal: { requirementIds: ["r"] }, goldilocks: { requirementIds: ["r"] }, maximal: { requirementIds: ["r"] },
  } }],
};

test("report exposes board, matrix, and dependency tabs from one model", () => {
  const html = renderReport(materializeBoard({ items, facts }), items, { matrix });
  assert.match(html, />Board</); assert.match(html, />Matrix</); assert.match(html, />Dependencies</);
  assert.match(html, /targetScope|Target scope/);
  assert.match(html, /Inspectable/);
  assert.match(html, /planned · not observed/);
  assert.match(html, /data-item="T-B" data-prerequisite="T-A"/);
  assert.match(html, /fn\.shared/);
});

test("report escapes content and only links safe static references", () => {
  const dangerous = item("<script>", "tick.<x>");
  const html = renderReport(materializeBoard({ items: [dangerous], facts: {} }), [dangerous], { title: "<title>" });
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>[^<]*script>/);
  assert.equal(safeHref("https://example.com/a"), "https://example.com/a");
  assert.equal(safeHref("/reports/a.html"), "/reports/a.html");
  assert.equal(safeHref("//evil.example"), undefined);
  assert.equal(safeHref("javascript:alert(1)"), undefined);
});
