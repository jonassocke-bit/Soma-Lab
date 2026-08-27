# v0.8.25.9

- Proof 1.6 solver science/gates unchanged.
- Solver WebGL heartbeat instead of continuous 60-fps render during compute.
- Exact repeated-shape ANSUR24 measurement cache + performance timings.
- Heavy Result Review refresh deferred until proof completion instead of rebuilding after every seed.
- Experimental non-gating torso surface-continuity diagnostic.
- Blind Audit quality tag: `torso-transition-angular`.
- Proof Inspector reorganized as simple-first `ERGEBNIS PRÜFEN`; technical details collapsed.
- Added next-phase roadmap for extreme/plausible stress, held-out real ANSUR validation and few-measure prediction mask.

---

# PATCH NOTES · v0.8.25.7

## SOLVER V2 PROOF 1.6
- Adds bounded post-solve POLISH: final WARN/FAIL body → fresh remeasurement → at most two tighter reruns.
- No repeated STAT/multistart; no hidden source use; conflict-controls excluded.
- Unchanged measurement, target-validity, repair, reliability and gate semantics.

## INSPECTOR 1.2
- Simple decision summary first.
- Technical details collapsed by default.
- POLISH stage replay and diagnostics.

## v0.8.25.8 — Solver V2 Proof 1.6 Boot Hotfix
- Restores four Solver V2 Proof UI/runtime helpers accidentally omitted in v0.8.25.7.
- Fixes iPhone/Safari `sammySolverV2ProofSetMode` ReferenceError and `sammySolverV2ProofStatus is not a function` TypeError.
- No Solver V2 scientific behavior changed; Proof remains v1.6 / bounded Polish 1.0.
