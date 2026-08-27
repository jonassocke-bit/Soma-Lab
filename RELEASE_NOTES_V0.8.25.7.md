# Sammy v0.8.25.7 — Solver V2 Proof 1.6 + Inspector 1.2

## Proof 1.6 · bounded post-solve polish
- Proof 1.5 hierarchy/statistical canonical multistart remains the main architecture.
- A non-conflict seed that is still WARN/FAIL after its selected hierarchy result is finished uses that exact final body as the new start.
- The body is freshly remeasured and sent through at most 2 tighter hierarchy rounds.
- STAT/canonical/multistart are not repeated during polish. Hidden source parameters are never used.
- Every accepted polish sub-step must reduce the global real-mesh objective.
- Stop reasons: `pass`, `polish-stalled`, `polish-budget`.
- Conflict-controls are explicitly excluded.
- FULL/Summary export polish attempts, gains, rounds and stop reasons.

## Inspector 1.2
- Default view is now a short decision summary: accuracy, seed stability, passed bodies, conflict protection and worst remaining measure.
- Technical restart/stage/Jacobian/24-measure details are collapsed by default.
- Timeline understands POLISH 1/2 and can replay their stored body states.

## Scientific boundary
No changes to ANSUR24-PROT-v2 definitions, MeasurementStates, target generation, seed validity, repair-v1.6 policy, reliability weights, gate thresholds or Statistical Body Bank.
