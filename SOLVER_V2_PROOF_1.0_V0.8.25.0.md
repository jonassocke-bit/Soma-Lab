# Solver V2 Proof 1.0 — technische Notiz

## 1. Problemtrennung

Der Proof verändert ausschließlich die Ebene **Solver/Optimierung + Proof-UI**. Messdefinition, geometrische Mesh-Messung und ANSUR↔Sammy-Mapping bleiben unverändert. Damit kann ein Solverfehler nicht durch stilles Nachjustieren des Messoperators „gelöst“ werden.

## 2. Datenquellen

### Morph Observatory Deep
Verwendet werden sex-spezifische Morph-Metadaten:
- Rolle (`structural / rig`, `local surface`, `distributed volume`, …)
- Top-Maße / Regionen
- Rig-Strukturwirkung
- Kontextabhängigkeit
- Cross-Sex-Status
- `coupled-axis candidate`-Paare

### Repair v1.6 Boundary
Für sieben reparierte Maße wird der alte Deep-Zahlenvektor beim Kandidatenranking auf 0 gesetzt. Alte Deep-Interaction-Residuals dieser Maße werden nicht gelesen. Semantische Region/Rolle darf weiterhin zur Kandidatenwahl dienen. Der lokale numerische Einfluss wird ausschließlich im aktuellen Build frisch gemessen.

## 3. Variablenraum

Nur Slider mit aktueller Solver-Policy `role=solver` werden berücksichtigt. Gender und Age sind bekannte Kontexte und keine Optimierungsvariablen. Male Cupsize wird ausgeschlossen. Morph-Observatory-`coupled-axis candidate`-Paare werden als gemeinsamer Solver-DOF behandelt, sofern ihre Grenzen kompatibel sind.

## 4. Iteration

Pro Pass:
1. aktuelles Shape am echten Mesh anwenden
2. 24 ANSUR24-PROT-v2-Maße über 10 MeasurementStates bestimmen
3. Kandidaten hierarchisch auswählen
4. lokale Jacobian-Matrix frisch messen
5. wichtigste Kandidaten zweiseitig messen und Secant-/Nichtlinearitäts-Mismatch erfassen
6. reliability- und observer-error-normalisiertes regularisiertes Least-Squares lösen
7. Trust-Step begrenzen
8. Line Search mit 1.00 / 0.55 / 0.30 / 0.15
9. Plausibilitätsguard und Shape-Regularisierung berücksichtigen
10. Kandidaten im nächsten Pass neu wählen

Bei deutlicher Nichtlinearität wird der jeweilige Trust-Step enger begrenzt.

## 5. Direction B

Nur wenn der normale Deep-gerankte Pfad nach den verfügbaren Pässen klar im FAIL-Bereich bleibt, wird einmal eine semantische Rescue-Richtung getestet. Sie ignoriert den Deep-Zahlenvektor für das Ranking, priorisiert stattdessen Worst-Measure-Familie, strukturelle Rolle, Surface-Rolle und Core-DOFs. Danach wird erneut eine vollständige frische Jacobian-Matrix gemessen.

Interpretation:
- Direction A gut → Deep-Hierarchie + lokaler Inverse-Ansatz tragfähig.
- A schlecht, B verbessert deutlich → primär Ranking/Taxonomie-Kopplung prüfen.
- A und B schlecht → lokale Konditionierung, Mess-Identifizierbarkeit oder inverse Architektur prüfen.

## 6. Persistenz

Schema: `sammy-solver-v2-proof-v1`

Der bestehende Solver-IndexedDB wird wiederverwendet. Gespeichert werden:
- Run-Konfiguration
- serialisierte Solver-Map aus Deep
- Blindziel-Metadaten
- nach jedem Seed ein vollständiger Case-Record
- Cursor für Resume
- Summary
- separate `solver-v2-proof-best` Records für AUDT

Damit benötigt ein Resume den ursprünglichen Browser-Deep-Lauf nicht mehr, sobald der Proof einmal angelegt wurde.

## 7. Exporte

- `Sammy_SOLVER_V2_PROOF_Summary_<mode>_<runId>.json`
- `Sammy_SOLVER_V2_PROOF_FULL_<mode>_<runId>.json`
- `Sammy_SOLVER_V2_PROOF_BODY_AUDIT_<timestamp>.json`

FULL enthält Seed-History, Candidate-IDs, Nichtlinearitätsdiagnostik, Direction-B-Status, Holdouts, Rig und Lösungsshapes und ist deshalb der bevorzugte Debug-Export bei WARN/FAIL.
