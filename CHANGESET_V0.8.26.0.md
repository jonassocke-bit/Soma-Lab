# CHANGESET · v0.8.26.0

## Geändert
- `app.js`: Real ANSUR Stress Gate 1.0, adaptive Re-Tests, Checkpoint/Resume, Stress Summary/FULL Export, Stress-AUDT-Queue; Appversion.
- `index.html`: einfache Real-ANSUR-Stress-Oberfläche im SOLV-Panel; Audit-Hinweis; Appversion/Cache-Buster.
- `style.css`: mobile Stress-Gate-Resultate und kompakte Statuskarten.
- `README.md`, `PATCH_NOTES.md`: neue Phase dokumentiert.

## Neu
- `solver-v2-real-ansur-stress-suite-v1.json` — 10 deterministisch ausgewählte beobachtete held-out ANSUR-II-Testpersonen.
- `ansur-prediction-final-reserve-v1.json` — 902 vom Stress-Gate unangetastete Testpersonen.
- `REAL_ANSUR_STRESS_GATE_1.0_V0.8.26.0.md`
- `NEXT_PHASE_AFTER_REAL_ANSUR_STRESS_V0.8.26.0.md`
- `RELEASE_NOTES_V0.8.26.0.md`
- `BUILD_REAL_ANSUR_STRESS_ASSETS_V0.8.26.0.py` — reproduziert Suite und 902er-Reserve deterministisch aus dem unveränderten ANSUR-Testasset.
- `BUILD_TEST_V0.8.26.0.txt`, `BUILD_MANIFEST_V0.8.26.0.json`, `FILES_CHANGED_V0.8.26.0.txt`

## Bewusst unverändert
- ANSUR24-PROT-v2 Messoperatoren/MeasurementStates
- Solver V2 Proof 1.6 Fit-/Objective-Mathematik
- Jacobian-Berechnung
- Statistical Canonical Prefit
- Hierarchie und Kandidatenauswahl
- bounded Polish
- Reliability/Repair-v1.6
- Proof-1.6-Gates
- Statistical Body Bank und Train+Validation-Daten
