# Sammy v0.8.25.6 — Solver V2 Proof 1.5 + Inspector 1.1

Aktiver Testpfad in `LAB → SOLV`:

`TEST VALID → STAT Canonical Multistart → RIG → MASS → FRAME → COMP → SEG → LOCAL → optional FINAL`.

Die Hierarchie entspricht der bereits im Morph Observatory dokumentierten Zielarchitektur. Frühere Stufen werden als priorisierte Constraints geschützt statt hart eingefroren.

## Statistik

`solver-v2-statistical-body-bank-v1.json` enthält 8 beobachtete ANSUR-II-Train+Validation-Medoids pro Geschlecht. Der held-out Testsplit wird nicht genutzt. Weight-Ridge und RFM/FFMI-Proxy dienen nur der Initialisierung/Regularisierung; die 24 direkten Zielmaße bleiben maßgeblich.

## Inspector

Inspector 1.1 zeigt Restart-Auswahl, statistische Zentren, Stage-Timeline und antippbare 3D-Replays samt ANSUR Residualfarben. Einzelne Maßzeilen wechseln weiterhin in den autoritativen ANSUR24-PROT-v2 MeasurementState.

## Empfohlener nächster Lauf

Zuerst **Quick**. Nach Abschluss FULL JSON und Blind AUDT exportieren. Standard erst, wenn Quick die Hierarchie/Multistart-Frage belastbar beantwortet.

Details:
- `RELEASE_NOTES_V0.8.25.6.md`
- `SOLVER_V2_PROOF_1.5_V0.8.25.6.md`
- `SOLVER_V2_STATISTICAL_PREFIT_1.0_V0.8.25.6.md`
- `SOLVER_V2_INSPECTOR_1.1_V0.8.25.6.md`
- `CHANGESET_V0.8.25.6.md`
