# Solver V2 Proof 1.5 · v0.8.25.6

## Architektur

Proof 1.5 ist kein weiterer Candidate-Ranking-Patch. Er implementiert den im Morph Observatory bereits vorgesehenen hierarchischen/coarse-to-fine Solver.

Stufen:

1. `structural-rig`
2. `global-mass`
3. `shoulder-hip-frame`
4. `regional-composition`
5. `segment-landmark`
6. `local-measure`
7. optional `final-wide`

Alle Stufen optimieren weiter gegen den kompletten 24er Residualvektor. Die aktuelle Stufe erhält erhöhte Gewichtung; bereits abgeschlossene Stufen werden als hochpriorisierte Residualgruppen geschützt. Dadurch werden frühere Lösungen nicht hart eingefroren, aber spätere Kompensationen dürfen sie nicht beliebig zerstören.

## Candidate Policy

Deep/Morph Observatory liefert weiterhin Rollen, Regionen, Coupled-Axis-Information und eine semantische Vorauswahl. Für die ausgewählten DOFs wird ein **fresh real-mesh Jacobian** berechnet. Repaired-row numerical Deep vectors bleiben null/excluded.

## Multistart

`TEST VALID` bewertet weiterhin ausschließlich die vorab erzeugten Proof-Seeds. Erst danach entstehen target-abhängige Solver-Starts:

- `original`
- `stat-canonical`
- `blend`

Alle werden real gemessen. Bei weiterem FAIL wird ein zweites Basin durch eine verkürzte Hierarchie geprüft. Das ist bewusst von der Proof-Seed-Validität getrennt.

## Scientific Boundary

Statistische Vorinformation darf keine ungewöhnliche, aber reale Zielmessung überschreiben. Sie dient als weiche Regularisierung/Initialisierung. Holdout-, Rig-, Plausibilitäts- und Conflict-Control-Auswertung bleiben unverändert nachgeschaltet.
