# Solver V2 Performance + Surface Quality — v0.8.25.9

## Performance-Instrumentierung

`sammy-solver-v2-performance-v1` wird nur für Solver-V2-Proofs geführt. Die Messung beginnt direkt vor dem Proof und wird nach den Seed-Läufen vor der Summary persistiert.

### Maßnahmen

- WebGL-Renderunterdrückung während Compute-Phasen; Heartbeat ca. alle 420 ms.
- Live-DOM-Ausgaben werden gebündelt (ca. 220 ms), wichtige Abschluss-/Fehlermeldungen bleiben sofort sichtbar.
- Das schwere Result Review wird während eines laufenden Proofs nicht nach jedem Seed komplett neu aufgebaut; ein vollständiger Refresh erfolgt nach Abschluss.
- Exakter Shape-Key ohne Rundung; nur identische numerische Shape-Zustände dürfen ANSUR24-Messungen wiederverwenden.
- Maximal 192 Einträge im laufbezogenen Cache; Cache wird zu Beginn und Ende eines Proofs gelöscht.
- Jacobian-Aufrufe werden zeitlich instrumentiert, ohne die bestehende Funktion zu verändern.

### Regression-Grenze

Die folgenden Solver-Kernfunktionen bleiben byte-/funktionsidentisch zu v0.8.25.8:
- Fit Metrics,
- Objective,
- Hierarchie-Kandidatenselektion,
- Hierarchie-Solve-Step,
- Hierarchie-Line-Search,
- RunHierarchy,
- Statistical Canonical Shape,
- Polish-Rounds,
- Proof Summary,
- Proof BuildRun,
- ANSUR24-V2 Compute.

`sammySolverV2ProofApplyShape` ist absichtlich erweitert (exakter Cache), `sammySolverV2ProofSolveSeed` nur um die nicht-gatende Surface-Diagnose.

## Surface Continuity v1

Die Diagnose verwendet das aktuelle LOW-Rest-Mesh und 17 horizontale Torso-Querschnitte zwischen Hips und Chest. Für Breite und Tiefe wird die normierte zweite Differenz benachbarter Querschnitte ausgewertet.

Die aktuellen Schwellen (`ok <= 4.5`, `attention <= 8`, `high > 8`) sind **experimentelle Debug-Schwellen**. Sie sind noch nicht als anthropometrisch validierte Grenzwerte zu interpretieren.

AUDT liefert die menschliche Kalibrierung über den Qualitäts-Tag `torso-transition-angular`. Erst wenn genügend markierte/ungekennzeichnete Fälle vorliegen, darf entschieden werden, ob und wie Surface Continuity später als weiche Regularisierung oder Guard in den Solver eingeht.
