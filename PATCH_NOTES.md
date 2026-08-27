# PATCH NOTES · v0.8.25.6

## SOLVER V2 PROOF 1.5

- ersetzt A/B/C als Hauptpfad durch die bereits geplante Hierarchie;
- führt statistical canonical prefit + real-mesh restart screening ein;
- adaptive zweite Basin-Prüfung nur bei normalem Round-trip FAIL;
- frühere Stufen = protected constraints, kein hartes Freeze;
- fresh-wide nur noch FINAL Finisher;
- Target-/Seed-Validity, Measurement Geometry, Repair Policy, Reliability und Proof-Grenzen unverändert.

## INSPECTOR 1.1

- STAT Card;
- Solver-Start anzeigen;
- Stage-Shape/Fit-Snapshots;
- Timeline-Replay im 3D-Viewport;
- 10-Phasen-Liveleiste;
- alte Proof-v1.4-FULL-JSONs bleiben importierbar.

## STATISTICAL BODY BANK 1.0

- 8 ANSUR train+validation observed-row medoids je Geschlecht;
- kein held-out test split;
- Weight Ridge + schwacher RFM/FFMI Muscle Context;
- keine Überschreibung direkter Zielmaße.
