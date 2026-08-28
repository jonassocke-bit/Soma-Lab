# CHANGESET v0.8.26.4

## Geändert

### `app.js`
- Version 0.8.26.4.
- SolverMap v2 / Architektur `solver-v2-hierarchical-canonical-polish-routing-v2`.
- Keine vorzeitige Fusion von Depth/Horizontal Raw-DOFs.
- Rückwärtskompatible Aufspaltung alter coupled-axis SolverMaps.
- Repair-v1.6-Maße: stale vector + stale topMeasure hints aus Solver-Ranking entfernt.
- Fehlende direkte Wrist/Ankle/Calf/Lowerleg-Zielmorphs werden fresh-only ergänzt.
- Explizite anatomische 24-Maß-Routingmatrix.
- Vollsolver Candidate/Fallback/Wide/Hierarchy-Auswahl auf Routing + sichere Static-Hints umgestellt.
- PRA 1.2: 5→3 fresh candidate selection, predictive residual landing, persistent locks, fair scheduler, state-local stalls, capacity diagnosis, best-checkpoint rollback.
- Adaptive ±1.15/±1.30 nur für tatsächlich bound-blocked lokale DOFs; Core niemals extrapoliert.
- Coarse PRA stages wieder strikt normal-bound.
- Composition settle respektiert individuelle kritische Locks.
- Morph-family synonyms und Required-Target-Filter korrigiert.

### `index.html`
- Version/cache 0.8.26.4.
- PRA 1.2 UI/Erklärung auf Architecture Audit, Anatomical Routing und Predictive Residual aktualisiert.
- Stress-Hinweis korrigiert: Proof-1.6 Objective/Gates bleiben, aber neue Runs verwenden routing-v2 DOF-Architektur.

### Dokumentation
- `SOLVER_V2_ARCHITECTURE_AUDIT_1.0_V0.8.26.4.md`
- `REAL_ANSUR_PRAGMATIC_REPAIR_1.2_V0.8.26.4.md`
- `NEXT_PHASE_AFTER_SOLVER_AUDIT_V0.8.26.4.md`
- `RELEASE_NOTES_V0.8.26.4.md`
- `BUILD_TEST_V0.8.26.4.txt`
- `BUILD_MANIFEST_V0.8.26.4.json`
- `FILES_CHANGED_V0.8.26.4.txt`
- README / PATCH NOTES aktualisiert.

## Nicht geändert

ANSUR24-Geometrie, MeasurementStates, Reliability, FitMetrics, Proof Objective, Statistical Body Bank, Prediction Splits/Reserve und Real-ANSUR-Stresssuite.
