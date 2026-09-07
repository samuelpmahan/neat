import assert from "node:assert/strict";
import test from "node:test";
import { calculationId, createPxC, invokeCalculation, registerCalculation } from "../../src/pxc.js";
import { call, part, program, runPql, tick } from "../../src/pql.js";
import { composePcr, definePcr } from "../../src/pcr.js";

test("PxC records addressed reads, writes, and reusable calculation invocations", () => {
  let pxc = createPxC({ "px.input": 2 });
  pxc = registerCalculation(pxc, {
    id: calculationId("fn.neat.double"),
    run: (value: number, context) => {
      context.write("px.output", value * 2);
      return value * 2;
    },
  });

  const first = invokeCalculation(pxc, "fn.neat.double", 2);
  const second = invokeCalculation(first.pxc, "fn.neat.double", 3);
  assert.equal(second.value, 6);
  assert.equal(second.pxc.telemetry.invocations.length, 2);
  assert.deepEqual(second.pxc.telemetry.invocations.map((item) => item.id), [
    calculationId("fn.neat.double"),
    calculationId("fn.neat.double"),
  ]);
  assert.deepEqual(second.pxc.telemetry.writes.map((item) => item.address), ["px.output", "px.output"]);
});

test("programmatic PQL reuses calculations and records Part-reference reads", () => {
  let pxc = createPxC({ "px.a": 2, "px.b": 4 });
  pxc = registerCalculation(pxc, {
    id: calculationId("fn.neat.add"),
    run: ({ left, right }: { left: number; right: number }) => left + right,
  });
  const query = program("neat-analysis", [
    tick("Assess", [call("fn.neat.add", { left: part("px.a"), right: part("px.b") }, "px.sum")]),
    tick("Reuse", [call("fn.neat.add", { left: part("px.sum"), right: 1 }, "px.next")]),
  ]);
  const run = runPql(pxc, query);
  assert.equal(run.status, "completed");
  assert.deepEqual(run.ticks.map((item) => item.id), ["Assess", "Reuse"]);
  assert.equal(run.telemetry.invocations.length, 2);
  assert.deepEqual(run.telemetry.reads.map((item) => item.address), ["px.a", "px.b", "px.sum"]);
  assert.deepEqual(run.telemetry.writes.map((item) => item.address), ["px.sum", "px.next"]);
  assert.deepEqual(run.ticks.map((item) => item.materializations.map((m) => m.value)), [[6], [7]]);
});

test("PQL combines ChainSpot-style with bindings and literal args without shadowing", () => {
  let pxc = createPxC({ "px.a": 4 });
  pxc = registerCalculation(pxc, {
    id: calculationId("fn.neat.add-amount"),
    run: ({ input, amount }: { input: number; amount: number }) => input + amount,
  });
  const run = runPql(pxc, {
    PrincipleComponentRender: "CombinedArgs",
    Ticks: [{ name: "Add", Calculations: [{ call: "fn.neat.add-amount", with: { input: "px.a" }, args: { amount: 2 }, into: "px.sum" }] }],
  });
  assert.equal(run.status, "completed");
  assert.equal(run.pxc.parts.get("px.sum"), 6);
  const shadow = runPql(pxc, {
    PrincipleComponentRender: "Shadow", Ticks: [{ name: "Bad", Calculations: [{ call: "fn.neat.add-amount", with: { input: "px.a" }, args: { input: 2 } }] }],
  });
  assert.equal(shadow.status, "failed");
  assert.match(String(shadow.error), /input.*both/);
});

test("PCR requires declared ordered Tick identities and derives execution evidence from the run", () => {
  let pxc = createPxC({ "px.a": 1 });
  pxc = registerCalculation(pxc, {
    id: calculationId("fn.neat.identity"),
    run: (value: number) => value,
  });
  const run = runPql(pxc, program("analysis", [tick("One", [call("fn.neat.identity", part("px.a"), "px.out")])]));
  const pcr = composePcr(definePcr("PCR.neat", ["One"]), run);
  assert.equal(pcr.testimony.status, "executed");
  assert.deepEqual(pcr.materializations, [{ tickId: "One", address: "px.out", value: 1 }]);
  assert.throws(() => composePcr(definePcr("PCR.bad", ["Other"]), run), /Tick identities do not match/);
  // Execution is evidence, not human acceptance; no acceptance flag is emitted.
  assert.equal("acceptance" in pcr, false);
});
