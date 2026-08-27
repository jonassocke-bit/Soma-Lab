# Sammy v0.8.25.8 — Solver V2 Proof 1.6 Boot Hotfix

## Purpose
Runtime-only hotfix for v0.8.25.7. Scientific Solver V2 Proof 1.6 / Polish 1.0 behavior is unchanged.

## Fixed
v0.8.25.7 accidentally omitted four Solver V2 UI/runtime helper declarations while integrating Inspector 1.2:
- `sammySolverV2ProofProgress`
- `sammySolverV2ProofStatus`
- `sammySolverV2ProofLive`
- `sammySolverV2ProofSetMode`

On iPhone/Safari this caused:
- `ReferenceError: Can't find variable: sammySolverV2ProofSetMode` during UI init.
- A second failure where the missing `sammySolverV2ProofStatus` identifier resolved through legacy named DOM access to the `<div id="sammySolverV2ProofStatus">`, causing `TypeError: ... is not a function` when Proof Start was pressed.

## Scientific boundary
No change to:
- ANSUR24-PROT-v2 definitions or geometry.
- Deep Repair v1.6 policy.
- reliability weights.
- target/seed validity.
- Statistical Body Bank / canonical multistart.
- RIG → MASS → FRAME → COMP → SEG → LOCAL hierarchy.
- FINAL fresh-wide finisher.
- bounded post-solve POLISH rules.
- PASS/WARN/FAIL or proof gate thresholds.
- Conflict-Control behavior.
- AUDT case generation.

Proof schema therefore remains `sammy-solver-v2-proof-v1.6`.

## Validation
- `node --check app.js`: PASS.
- all four missing helper declarations exist exactly once.
- required Proof DOM IDs present.
- 496 HTML IDs, zero duplicates.
- cache/version references updated to v0.8.25.8.
- focused diff against v0.8.25.7 contains only app version + restored helpers and HTML cache/version changes, aside from release/build metadata.
