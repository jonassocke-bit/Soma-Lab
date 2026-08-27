# Sammy v0.8.25.7 — Solver V2 Proof 1.6 + Inspector 1.2

Proof 1.6 keeps the v0.8.25.6 hierarchical canonical-multistart architecture and adds one bounded convergence experiment: when a normal seed is still WARN/FAIL, its actual final body is freshly remeasured and may run through at most two tighter post-solve POLISH rounds. Statistical initialization and multistart are not repeated. Conflict controls never receive polish.

Inspector 1.2 is simple-first: the top view shows only the decision-relevant metrics and worst remaining measure. Full restart/stage/ANSUR debug data stays available under a collapsed technical section.

Scientific boundary remains frozen: ANSUR24-PROT-v2 operators/MeasurementStates, Proof target and seed validity, Deep repair-v1.6 policy, reliability weights, gate thresholds and the Statistical Body Bank are unchanged.

See:
- `RELEASE_NOTES_V0.8.25.7.md`
- `SOLVER_V2_PROOF_1.6_V0.8.25.7.md`
- `SOLVER_V2_INSPECTOR_1.2_V0.8.25.7.md`
- `CHANGESET_V0.8.25.7.md`

### v0.8.25.8 hotfix
Use v0.8.25.8 instead of v0.8.25.7 for Solver V2 Proof 1.6. It restores four missing Proof UI/runtime helpers that prevented the Proof UI from initializing/starting on Safari. Solver science is unchanged.
