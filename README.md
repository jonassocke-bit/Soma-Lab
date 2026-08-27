# Sammy v0.8.26.0 — Real ANSUR Stress Gate 1.0

Der validierte Proof-1.6-Solver bleibt eingefroren. v0.8.26.0 testet ihn erstmals gegen 10 tatsächlich beobachtete held-out ANSUR-II-Messprofile (4 typisch, 6 Randfälle), mit adaptivem Far-Seed-Re-Test, Checkpoint/Resume und zwei Blind-Holdout-Maßen. Die 10 verwendeten Personen werden aus der späteren Few-Measure-Endvalidierung entfernt; 902 Testpersonen bleiben unangetastet.

Siehe:
- `RELEASE_NOTES_V0.8.26.0.md`
- `REAL_ANSUR_STRESS_GATE_1.0_V0.8.26.0.md`
- `NEXT_PHASE_AFTER_REAL_ANSUR_STRESS_V0.8.26.0.md`
- `CHANGESET_V0.8.26.0.md`
- `BUILD_REAL_ANSUR_STRESS_ASSETS_V0.8.26.0.py`

---

# Sammy v0.8.25.9 — Proof 1.6 Performance + Surface Quality + Result Review 1.3

Der validierte Proof-1.6-Solver aus v0.8.25.8 bleibt wissenschaftlich unverändert. v0.8.25.9 reduziert Render-/UI-Last während langer Solverläufe, ergänzt einen exakten laufbezogenen ANSUR24-Messcache und exportiert echte Laufzeit-/Jacobian-Diagnostik.

Zusätzlich gibt es eine **nicht-gatende experimentelle Torso Surface-Continuity-Diagnose** und im Blind Audit den Qualitäts-Tag „Torso-Übergang kantig“. Der bisherige Proof Inspector heißt in der normalen Ansicht **ERGEBNIS PRÜFEN** und zeigt zuerst nur Übersicht, Ziel↔Ergebnis und die verständlich benannte Entstehung des Körpers. Technische Forschungsdetails bleiben eingeklappt verfügbar.

Siehe:
- `RELEASE_NOTES_V0.8.25.9.md`
- `SOLVER_V2_PERFORMANCE_SURFACE_V0.8.25.9.md`
- `SOLVER_V2_RESULT_REVIEW_1.3_V0.8.25.9.md`
- `NEXT_PHASE_ANSUR_STRESS_AND_PREDICTION_V0.8.25.9.md`
- `CHANGESET_V0.8.25.9.md`

---

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

## Aktueller Forschungsstand · v0.8.26.1
Der model-generated Proof 1.6 bleibt die eingefrorene inverse Solver-Baseline. Real-ANSUR Stress Gate 1.0 hat jedoch gezeigt, dass reale held-out Messvektoren noch systematische Repräsentations-/Mappingprobleme offenlegen. Das neue **REAL ANSUR REPAIR · REPRESENTABILITY LAB 1.0** diagnostiziert diese Fehler auf fünf bereits verbrauchten Fällen, ohne neue ANSUR-Testpersonen oder die 902er Few-Measure-Reserve zu konsumieren. Few-Measure Prediction folgt erst nach dem daraus abgeleiteten gezielten Repair und einem erneuten Real-ANSUR-Gate.
