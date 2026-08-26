# Solver V2 Proof 1.2 — Active-Subspace Testvalidität

## Problem in Proof 1.1

Der synthetische Target-Generator verändert bewusst nur einen Teil der verfügbaren Solver-DOFs. `sammySolverV2ProofParameterRms()` normiert aber über die komplette sex-spezifische Solver-Map. Dadurch hängt der harte Abstandsschwellenwert von der Zahl **unveränderter** Variablen ab: je größer die Map, desto kleiner wird derselbe physische Morph-Abstand.

Für einen Test auf „ist dieser Zielkörper wirklich nicht der Neutral-Körper?“ ist das die falsche Normierung.

## Neue Distanzfunktion

`sammySolverV2ProofParameterDistance(a,b,variables)` liefert:

- `globalRms`: bisherige Vollraum-RMS;
- `activeRms`: RMS über alle DOFs mit `|Δ / range| >= 0.035`;
- `activeCount`;
- `maxAbsNormalizedDelta`;
- `totalCount`.

Der Vollraumwert bleibt nützlich, um extrem kleine Gesamtdifferenzen zu erkennen. Der eigentliche Nichttrivialitätsnachweis kommt jedoch aus dem aktiven Unterraum plus der **realen Mesh-Maßdistanz**.

## Target gate

Ein Target wird nur akzeptiert, wenn gleichzeitig:

1. `activeCount >= 3`;
2. globaler und aktiver Parameterabstand die Typ-spezifischen Minima erfüllen;
3. alle 24 Zielmaße finite sind;
4. Mesh-Plausibilität den bestehenden Guard besteht;
5. die real gemessene Distanz zur gleichgeschlechtlichen / gleichaltrigen Neutral-Baseline groß genug ist;
6. der reliability-aware ANSUR-Delta-Prior besteht;
7. kein gleichgeschlechtliches Near-Duplicate zu einem bereits akzeptierten Target entsteht.

Es gibt weiterhin **keinen Fallback-Körper**.

## Seed gate

Seed↔Source und Seed↔Seed verwenden ebenfalls global + active RMS. Zusätzlich bleiben die realen Initialfit-Grenzen von 1.25 weighted Protocol Units und 0.55 cm RMSE zwingend. Damit kann kein parametertechnisch anderer, aber messäquivalenter Fast-Ziel-Seed den Proof trivialisieren.

## Warum nicht einfach den globalen Grenzwert komplett entfernen?

Der globale Wert bleibt als schwacher Sanity-Guard und als Exportmetrik erhalten. Er verhindert Sonderfälle, in denen eine große aktive Änderung nur an sehr wenigen DOFs vorliegt, aber der restliche Parameterraum praktisch identisch ist. Die Kombination aus globalRMS + activeRMS + activeCount + realer 24-Maßdistanz ist robuster als eine einzelne Norm.

## Diagnose bei erneutem Invalid

`TARGET_GENERATION_INVALID` und `SEED_GENERATION_INVALID` schreiben die Reject-Zähler direkt in die Fehlermeldung. Damit ist der nächste iPhone/Safari-Lauf diagnostisch eindeutig:

- `tooCloseInParameterSpace` → Parameter-Distanzproblem;
- `meshPlausibility` → geometrischer Formguard;
- `tooCloseInMeasureSpace` → Morph ist parametrisch anders, aber anthropometrisch zu ähnlich;
- `anthroDeltaPrior` → Kandidat driftet zu stark gegenüber der Sammy-Baseline;
- `nearDuplicate` → Target-Diversität reicht nicht;
- Seed-Analoga entsprechend.

Keiner dieser Fälle wird automatisch „repariert“ oder als Solverergebnis interpretiert.

## Solver-Abgrenzung

Proof 1.2 ändert bewusst **nicht** den inversen Solver. Erst wenn der Quick-Lauf `TEST VALID` erreicht, sind Solver-Fit, Seed-Konvergenz, Direction B, Holdouts und AUDT wieder interpretierbare Evidenz.
