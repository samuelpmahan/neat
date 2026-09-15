// PxC DevTools (m) — built from specs/pxc-devtools_mGM.md.
//
// An inspector over any exec-board-shaped substrate
// ({get, has, set, register, keys, call}, as created by
// src/core/exec.js `createExecBoard`). Wiring over the existing execution
// engine, not a new one: invokePql / board.call do the running; this module
// only looks, traces, and reports.
//
// Boundaries (spec m):
//   discover — browse/filter/find live bindings
//   read     — open object, fields and prototype; NEVER executes a getter
//             or toJSON (descriptor-level only)
//   trace    — follow composition links from a produced Part to its inputs
//   run      — explicitly invoke a Calculation/getter/method; the ONLY
//             boundary that executes, and only with live-effects opt-in
//   tick     — review one composition's Tick sequence: boundary state,
//             assertions, inspectable mismatches. Acceptance unchanged.

const identities = new WeakMap();
let nextId = 1;
const idOf = value => {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return null;
  if (!identities.has(value)) identities.set(value, nextId++);
  return `#${identities.get(value)}`;
};
const isAddrObj = v => v !== null && typeof v === 'object' && typeof v.address === 'string' && Object.keys(v).length === 1;
const unwrap = v => (isAddrObj(v) ? v.address : v);

/* ---------------- discover ---------------- */

export function discover(board, query = '') {
  const q = String(query).toLowerCase();
  return board.keys()
    .filter(a => a.toLowerCase().includes(q))
    .sort()
    .map(address => ({ address, kind: 'part' }));
}

/* ---------------- read ---------------- */

function describeValue(value, depth, seen) {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function'))
    return { type: typeof value, value };
  if (seen.has(value)) return { type: 'circular', identity: idOf(value) };
  if (depth <= 0) return { type: typeof value, identity: idOf(value) };
  seen.add(value);
  const proto = Object.getPrototypeOf(value);
  const own = {};
  for (const key of Reflect.ownKeys(value)) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    const name = typeof key === 'symbol' ? key.toString() : key;
    if ('get' in d || 'set' in d) {
      // Accessor: reported, never invoked.
      own[name] = { kind: 'accessor', enumerable: !!d.enumerable, hasGetter: !!d.get, hasSetter: !!d.set };
    } else {
      own[name] = { kind: 'data', enumerable: !!d.enumerable, writable: !!d.writable, value: describeValue(d.value, depth - 1, seen) };
    }
  }
  return {
    type: typeof value,
    identity: idOf(value),
    class: value.constructor?.name ?? null,
    prototype: proto ? (proto.constructor?.name ? `${proto.constructor.name}.prototype` : '?') : null,
    own,
  };
}

/** Open a value's fields and prototype. Reads descriptors; executes nothing. */
export function read(value) {
  const desc = describeValue(value, 2, new Set());
  const proto = Object.getPrototypeOf(value);
  const protoDesc = proto ? describeValue(proto, 1, new Set()) : null;
  const methods = new Set();
  for (const scope of [desc.own, protoDesc?.own]) {
    for (const [name, d] of Object.entries(scope ?? {})) {
      if (name === 'constructor') continue;
      if (d.kind === 'data' && d.value?.type === 'function') methods.add(name);
    }
  }
  return { ...desc, prototypeMembers: protoDesc?.own ?? null, methods: [...methods] };
}

/* ---------------- trace ---------------- */

function findProducer(run, address) {
  for (const tick of run.Ticks ?? []) {
    for (const calc of tick.Calculations ?? []) {
      const produced = calc.produces ?? (Array.isArray(calc.into) ? calc.into : [calc.into]);
      if (produced.map(unwrap).includes(address)) return { tick: tick.name, calc };
    }
  }
  return null;
}

/**
 * Follow a produced Part back through the composition that made it.
 * Returns the producing calculation and every input with its exact identity:
 * addressed inputs (aliases unwrapped to their address string) and inline
 * inputs (literal args, flagged inline).
 */
export function trace(run, address) {
  const hit = findProducer(run, address);
  if (!hit) return { address, producedBy: null, inputs: [] };
  const { tick, calc } = hit;
  const inputs = [];
  for (const [name, binding] of Object.entries(calc.with ?? {})) {
    const addr = unwrap(binding);
    if (typeof addr === 'string') inputs.push({ name, binding: addr, address: addr, inline: false });
    else inputs.push({ name, binding: String(binding), address: null, inline: true, value: binding });
  }
  for (const [name, value] of Object.entries(calc.args ?? {})) {
    inputs.push({ name, binding: null, address: null, inline: true, value });
  }
  return { address, producedBy: { tick, call: calc.actualCall ?? calc.call, into: calc.produces ?? calc.into }, inputs };
}

/* ---------------- run (the only executing boundary) ---------------- */

function receiptFor(status, extra = {}) {
  return Object.freeze({ status, at: new Date().toISOString(), ...extra });
}

/** Explicitly evaluate a getter on a live receiver. Opt-in execution. */
export function runGetter(receiver, name) {
  const desc = Object.getOwnPropertyDescriptor(receiver, name)
    ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(receiver), name);
  if (!desc || typeof desc.get !== 'function') throw new Error(`devtools: '${name}' is not a getter on this receiver.`);
  const before = snapshotOwn(receiver);
  const result = desc.get.call(receiver);
  return { result, receipt: receiptFor('ok', { kind: 'getter', name, result }) , effects: diffOwn(before, snapshotOwn(receiver)) };
}

/** Explicitly invoke a method on a live receiver. Opt-in execution. */
export function runMethod(receiver, name, args = []) {
  const fn = receiver[name];
  if (typeof fn !== 'function') throw new Error(`devtools: '${name}' is not a method on this receiver.`);
  const before = snapshotOwn(receiver);
  const result = fn.apply(receiver, args);
  return { result, receipt: receiptFor('ok', { kind: 'method', name, args, result }), effects: diffOwn(before, snapshotOwn(receiver)) };
}

function snapshotOwn(obj) {
  const snap = {};
  for (const key of Reflect.ownKeys(obj)) {
    const d = Object.getOwnPropertyDescriptor(obj, key);
    if ('value' in d && (typeof d.value !== 'object' || d.value === null)) snap[String(key)] = d.value;
  }
  return snap;
}
function diffOwn(before, after) {
  const effects = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[key] !== after[key]) effects[key] = { from: before[key] ?? null, to: after[key] ?? null };
  }
  return effects;
}

/** Invoke a registered Calculation. Records a receipt; a throw records a failed receipt and produces nothing. */
export function runCalculation(board, fnAddress, inputs = {}, into = null) {
  const target = into ?? `devtools.result.${Date.now()}`;
  try {
    const output = board.call({ address: fnAddress }, inputs);
    if (into) board.set(into, output);
    return { result: output, receipt: receiptFor('ok', { kind: 'calculation', call: fnAddress, inputs, result: output, produced: into ?? null }) };
  } catch (cause) {
    return { result: undefined, receipt: receiptFor('failed', { kind: 'calculation', call: fnAddress, inputs, error: cause.message, produced: null }) };
  }
}

/** Async variant: the running state is visible before the promise resolves. */
export function runCalculationAsync(board, fnAddress, inputs = {}, into = null) {
  let state = 'running';
  const promise = (async () => {
    try {
      const output = await board.call({ address: fnAddress }, inputs);
      if (into) board.set(into, output);
      state = 'resolved';
      return { result: output, receipt: receiptFor('ok', { kind: 'calculation', call: fnAddress, inputs, result: output, produced: into ?? null }) };
    } catch (cause) {
      state = 'failed';
      return { result: undefined, receipt: receiptFor('failed', { kind: 'calculation', call: fnAddress, inputs, error: cause.message, produced: null }) };
    }
  })();
  return { get state() { return state; }, promise };
}

/* ---------------- preflight ---------------- */

/**
 * Refuse a bad binding BEFORE anything executes. Missing address, or a prefix
 * query matching zero bindings, is refused; a prefix matching more than one
 * where the reading is singular is ambiguous and refused.
 */
export function preflight(board, calculation) {
  for (const [name, binding] of Object.entries(calculation.with ?? {})) {
    const addr = unwrap(binding);
    if (typeof addr !== 'string') throw new Error(`devtools preflight: '${name}' binds a non-address.`);
    if (addr.endsWith('.*')) {
      const matches = board.keys().filter(a => a.startsWith(addr.slice(0, -1)));
      if (!matches.length) throw new Error(`devtools preflight: '${name}' binds '${addr}' which matches nothing.`);
      if (matches.length > 1) throw new Error(`devtools preflight: '${name}' binds '${addr}' which is ambiguous (${matches.length} matches).`);
    } else if (!board.has(addr)) {
      throw new Error(`devtools preflight: '${name}' binds '${addr}' which was never produced.`);
    }
  }
  return true;
}

/* ---------------- scratch ---------------- */

/** Retain an alternative without touching the original or the app's selection. */
export function scratch(board, key, value) {
  const address = `devtools.scratch.${key}`;
  board.set(address, value);
  return address;
}

/* ---------------- tick review ---------------- */

/**
 * Review one composition's Tick sequence: run it, show each Tick's boundary
 * state, check assertions, list mismatches for inspection. Reports only;
 * acceptance is unchanged by a review.
 */
export function reviewTicks(invokePql, board, composition, assertions = []) {
  const run = invokePql(composition, board);
  const ticks = (run.Ticks ?? []).map(tick => ({
    name: tick.name,
    actions: (tick.Calculations ?? []).map(c => ({
      call: c.actualCall ?? c.call,
      into: c.produces ?? c.into,
      produced: Object.fromEntries((c.produces ?? []).map(a => [unwrap(a), board.has(unwrap(a)) ? board.get(unwrap(a)) : undefined])),
    })),
  }));
  const checked = assertions.map(a => {
    const actual = board.has(a.address) ? board.get(a.address) : undefined;
    const pass = JSON.stringify(actual) === JSON.stringify(a.expect);
    return { ...a, actual, pass };
  });
  return { composition: composition.PrincipleComponentRender, ticks, assertions: checked, mismatches: checked.filter(c => !c.pass) };
}
