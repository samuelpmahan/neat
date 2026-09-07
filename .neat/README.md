# neat local files

Agents read this directory before claiming work. Put one independently editable item in `items/<id>.json`; keep resolved execution, inspection, human-decision, and Tidy facts in `facts.json` or durable records that items reference.

An item declares intent and target identity. It does not duplicate a PCR’s Ticks or Calculations. Never infer human acceptance. Use `neat update` for ordinary ownership/status/resume changes so an unrelated item remains byte-identical.

Generated board output belongs outside this directory or under `.neat/out/`, which is ignored.
