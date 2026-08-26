# SOLVER V2 PROOF 1.3 · v0.8.25.3

## Ziel

Proof 1.3 ist kein neuer Solveransatz. Er repariert die letzte verbleibende Konfundierung des Proof-Harness: Ein absichtlich weit entfernter Startseed darf nicht allein deshalb als instabil gelten, weil das Testprofil weniger Trust-Region-Reise erlaubt als die Startdistanz praktisch erfordert.

## Evidenz aus Proof 1.2

Der gültige Quick-Lauf hatte:

- Testvalidität: PASS.
- 4 Round-trip-Ziele, keine Duplikate.
- 8 vorvalidierte, deutlich entfernte Seeds.
- Best-Fit über die vier Ziele: 1.2832 gewichtete Protocol Units RMS und 0.9261 cm RMSE.
- 2/4 Ziele erreichten WARN; zwei weitere lagen knapp bzw. mäßig außerhalb.
- Seed-Akzeptanz nur 25 % und mittlere Derived-Seed-Streuung 4.0131 cm.
- Direction B: 8/8 Seeds verbessert, aber nur 2/8 finale Fits akzeptiert.
- Conflict-Control korrekt geflaggt.

Wichtig: Die History aller acht Round-trip-Seeds verbesserte sich bis zum letzten verfügbaren Schritt weiter. Vier weit entfernte Seeds hatten eine maximale normierte Source-Differenz von 0.53104, 0.53673, 0.54208 bzw. 0.64848. Das Proof-1.2-Quick-Budget konnte für eine einzelne Core-Variable theoretisch nur 0.4148 zurücklegen.

## Konvergenzregel 1.3

### Phase A — unverändert

Quick: 4 Deep-gerankte Pässe × 8 DOFs.

Standard: 6 × 10.

Deep: 8 × 12.

Jeder Pass nutzt weiterhin einen neuen lokalen Real-Mesh-Jacobian, Reliability-Gewichtung, regularisierte Least-Squares-Richtung, Trust-Region-Caps und Real-Mesh-Line-Search.

### Phase B — jetzt adaptiv

Wenn der Fit nach Phase A weiterhin FAIL ist, wird Direction B nicht mehr nur einmalig ausgeführt. Stattdessen:

1. semantisch/strukturelle Kandidatenwahl ohne Deep-Zahlenvektor;
2. frischer Real-Mesh-Jacobian;
3. regularisierter Schritt mit 88 % der normalen Trust-Region-Caps;
4. Real-Mesh-Line-Search;
5. erneute Bewertung der 24 Zielmaße, Holdouts und Plausibilität;
6. Wiederholung bis ACCEPTED, STALLED oder BUDGET.

Quick/Standard: maximal 5 B-Pässe. Deep: maximal 6. Zwei aufeinanderfolgende nicht akzeptierte Rescue-Schritte gelten als Stall. Conflict-Controls bekommen weiterhin nur einen B-Pass, damit ein absichtlich widersprüchlicher Zielvektor nicht unnötig lange aggressiv überoptimiert wird.

## Neue Diagnostik

Jeder Solver-Record enthält zusätzlich:

- `fallback.passesAttempted`
- `fallback.passesImproved`
- `fallback.stopReason` = `accepted | stalled | budget`
- `fallback.budgetLimited`
- `fallback.lastRelativeImprovementPct`
- `convergence.basePassesAttempted`
- `convergence.rescuePassesAttempted`
- `convergence.theoreticalMaxCoreTravel`
- `convergence.theoreticalMaxLocalTravel`

History-Zeilen enthalten `accepted`, `alpha`, `deltaWeightedRms`, `relativeImprovementPct` und `lambda`.

## Wissenschaftliche Interpretation

Ein FAIL nach `stalled` spricht deutlich stärker gegen die aktuelle lokale inverse Architektur als ein FAIL nach `budget` bei noch klarer Verbesserung. Ein PASS/WARN muss weiterhin die unveränderten Mess-, Seed-, Holdout-, Rig- und Plausibilitätskriterien erfüllen. Das größere Reisebudget senkt keine Qualitätsgrenze.
