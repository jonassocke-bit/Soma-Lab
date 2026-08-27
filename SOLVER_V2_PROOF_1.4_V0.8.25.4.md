# SOLVER V2 PROOF 1.4 · v0.8.25.4

## Forschungsfrage

Nach Proof 1.3 ist die inverse Richtung klar besser als der alte Solver24-Pfad, aber noch nicht seedstabil. Proof 1.4 verändert nicht erneut die Messungen oder den Basissolver. Er beantwortet eine engere Frage:

> Stallt Solver V2, weil Direction B am aktuellen Zustand die falschen/zu wenigen DOFs auswählt, oder weil selbst ein breiter frisch gemessener lokaler Raum keinen guten Abstieg mehr bietet?

## A/B/C-Trennung

### Direction A — Deep-ranked

Unverändert. Deep liefert sex-spezifische Rollen, Regionen und Coupled-Axis-Hierarchie. Für reparierte Maße werden alte numerische Deep-Interaction-Residuals nicht verwendet. Alle tatsächlich gewählten DOFs erhalten einen aktuellen realen Mesh-Jacobian.

### Direction B — Semantic Fresh Rescue

Unverändert aus Proof 1.3. Bei weiterem FAIL folgen mehrere kompakte semantische Fresh-Jacobian-Pässe. B ist günstig und bleibt der normale Rescue-Pfad.

### Direction C — Fresh-Wide Rescue

Neu. C wird nur nach einem weiterhin fehlschlagenden B-Pfad aktiviert und niemals für Conflict-Controls.

Der Wide-Pool ist absichtlich größer als der normale Kandidatensatz. Core-Achsen werden garantiert exponiert; dominante Restmaß-Familien liefern direkte semantische Kandidaten. Für den gesamten Pool wird dann **ein neuer one-sided Real-Mesh-Jacobian** gemessen. Erst auf Basis dieses gemessenen Jacobians erfolgt die finale Spaltenauswahl.

Fresh-column score pro DOF ist im Kern:

`|J_w^T r_w| / ||J_w||`

mit reliability-/Observer-Error-normalisierten Residuen und Jacobian-Spalten, zusätzlich moderat um Parameter-Penalty und noch verfügbare Range korrigiert.

Damit ist C kein weiterer Deep-Ranker. Der lokale Zahlenbeweis kommt vom aktuellen Meshzustand.

## Sicherheitsregeln

- C kann einen Zustand niemals verschlechtern: übernommen wird nur eine echte Objective-Verbesserung nach Mesh-Line-Search.
- C benutzt kleinere Trust-Steps als der Basispfad.
- C ist auf wenige Pässe begrenzt.
- Conflict-Controls behalten den bisherigen bewusst begrenzten Pfad und bekommen keine Wide-Eskalation.
- `directionC.trigger`, Pool-IDs, frisch ausgewählte IDs, Column-Scores, Passverbesserung und Stop-Grund landen im FULL JSON.

## Neue Ergebnisfelder

Pro Seed:

- `directionC.attempted`
- `directionC.improved`
- `directionC.finalFitAccepted`
- `directionC.trigger`
- `directionC.passesAttempted`
- `directionC.passesImproved`
- `directionC.stopReason`
- `directionC.budgetLimited`
- `directionC.lastRelativeImprovementPct`

History-Phase:

- `fresh-wide-rescue`

Pro C-History-Zeile:

- `widePoolIds`
- `candidateIds`
- `freshColumnScores`
- reale Fit-/Objective-Verbesserung

Summary aggregiert C-versuchte, C-verbesserte und C-final akzeptierte Seeds sowie Wide-Pass-Zähler.

## Interpretation nach Quick

1. **C akzeptiert die bisherigen v1.3-Problemseeds und die derived Seed-Streuung fällt deutlich:** Ranking-/Candidate-Coverage war der Hauptfehler. Danach Standard.
2. **C verbessert, aber Seed-Streuung bleibt mehrere cm oder einzelne Seeds bleiben weit außerhalb:** nächster Schritt ist keine weitere Candidate-Tuning-Runde, sondern eine echte Architekturänderung (strukturell gestuft / canonical multi-start / stärkere Identifizierbarkeitsregularisierung).
3. **C keine Verbesserung:** Candidate-Ranking als Hauptursache ist weitgehend ausgeschlossen; direkt Architektur überarbeiten.
