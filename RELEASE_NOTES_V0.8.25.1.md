# SAMMY v0.8.25.1 — SOLVER V2 PROOF 1.1

## Zweck

Proof 1.1 repariert **ausschließlich den Entscheidungstest** von v0.8.25.0. Der Solver-V2-Inverspfad, die ANSUR24-PROT-v2-Messdefinitionen, die v0.8.24.26-Messgeometrie, Deep-Taxonomie und Repair-v1.6-Policy werden nicht neu entworfen.

Der Quick-Lauf von v0.8.25.0 war als Solverbeweis ungültig, weil die synthetische Zielerzeugung nach erfolgloser ANSUR-Plausibilitätsprüfung still auf den neutralen Basis-Körper zurückfiel. Dadurch waren mehrere versteckte Targets identisch und Seed 1 bereits exakt am Ziel. Proof 1.1 macht eine solche Situation technisch unmöglich.

## Harte Proof-Validität vor der Solverwertung

Vor dem ersten Solve wird jetzt ein eigener `testValidity`-Block erzeugt. Nur `valid: true` erlaubt die eigentliche Solverbewertung.

Geprüft werden:

- **kein neutraler Target-Fallback** — findet die Zielerzeugung keinen gültigen Körper, endet der Lauf mit `TARGET_GENERATION_INVALID` / `PROOF INVALID`;
- **nontriviale Targets** — jedes Round-trip-Target muss eine Mindestdistanz zum gleichgeschlechtlichen, gleichaltrigen Sammy-Basiskörper in Parameterraum **und** real gemessenen 24 Zielmaßen besitzen;
- **aktive Variablen** — ein versteckter Target-Körper muss tatsächlich veränderte Core-/Local-DOFs enthalten;
- **Target-Diversität** — gleichgeschlechtliche Targets werden paarweise auf Near-Duplicates geprüft;
- **Seed↔Source-Distanz** — jeder Round-trip-Seed muss im Parameterraum ausreichend weit vom unbekannten Source-Körper entfernt sein;
- **kein nahezu perfekter Startseed** — jeder Round-trip-Seed muss vor dem Solve bereits einen Mindestfehler in cm und reliability-gewichteten Protocol Units besitzen;
- **Seed-Diversität** — mehrere Seeds eines Targets dürfen nicht praktisch identisch sein.

Der Summary-Export enthält dafür `summary.testValidity.targetGeneration`, `targetDiversity`, `seedSourceDistance` und `duplicateDetection`. Testvalidität ist ein **Prerequisite-Gate**: ohne PASS gibt es niemals Solver-WARN oder Solver-PASS.

## Reliability-aware ANSUR-Prior für die synthetische Zielerzeugung

Der absolute ANSUR-Z-Score des aktuellen Sammy-Basiskörpers wird nicht mehr als harte Voraussetzung für die Target-Erzeugung verwendet. Das hatte v0.8.25.0 blockiert, weil bereits der unveränderte Sammy-Basiskörper bei einigen noch systematisch abweichenden/PROT-sensitiven Maßen hohe absolute Z-Scores trägt.

Proof 1.1 verwendet stattdessen einen **reliability-gewichteten Delta-Prior relativ zum gleichgeschlechtlichen und gleichaltrigen Sammy-Basiskörper**. Bereits vorhandene systematische Sammy↔ANSUR-Offsets werden dadurch nicht fälschlich als Target-Generator-Fehler behandelt; neue starke Abweichungen gegenüber dieser Baseline bleiben begrenzt. Reduced-reliability-Maße werden nicht als harte Generator-Treiber verwendet.

Das ändert **nicht** die Solver-Fitmetrik. Dort bleiben die 24 realen ANSUR24-PROT-v2-Residuals und die bestehende Reliability-Policy maßgeblich.

## Seeds

Seeds werden vor dem Solver vollständig am realen Mesh vermessen und erst danach in `target.seedShapes` persistiert. Ein Seed wird verworfen, wenn er:

- Source-äquivalent ist,
- einem bereits gewählten Seed zu ähnlich ist,
- einen harten Mesh-Plausibilitätsbruch erzeugt oder
- bei einem Round-trip-Target schon vor dem Solve nahezu perfekt trifft.

Dadurch ist Resume deterministisch: ein unterbrochener Lauf verwendet exakt dieselben vorvalidierten Seeds.

## Direction B — eindeutige Begriffe

Die alte Bezeichnung `fallbackAcceptedSeeds` war missverständlich. Proof 1.1 trennt nun:

- `fallbackAttemptedSeeds` — Direction B wurde ausgeführt;
- `fallbackImprovedSeeds` — Direction B verbesserte das Objective;
- `fallbackFinalFitAcceptedSeeds` — der **abschließende** Fit ist nach Direction B tatsächlich nicht FAIL.

Eine bloße Verbesserung wird damit nicht mehr als akzeptierter Solverfit bezeichnet.

## Blind Audit

AUDT erhält bei Solver V2 Proof 1.1 pro Round-trip-Target blind:

- den Best-Fit und
- zusätzlich die Rekonstruktion des Seeds mit dem größten initialen Messfehler, sofern dies ein anderer Seed ist.

Damit bewertet das visuelle Audit nicht mehr nur den möglicherweise günstigen Best-Seed.

## Schema / Resume

- App: `0.8.25.1`
- Proof-Schema: `sammy-solver-v2-proof-v1.1`
- Summary-Schema: `sammy-solver-v2-proof-summary-v1.1`
- Testvalidität: `sammy-solver-v2-proof-test-validity-v1.1`

Der Schema-Bump ist absichtlich: der ungültige v0.8.25.0-Quick-Lauf wird nicht als fortsetzbarer Proof-1.1-Lauf geladen.

## Empfohlener Test

1. `LAB → SOLV` öffnen.
2. Deep-Quelle prüfen/importieren; kein neuer Deep-Lauf nötig.
3. **Quick** wählen und starten.
4. Der Lauf muss zuerst sichtbar durch Target-Generation und Seed-Preflight gehen. Falls `PROOF INVALID` erscheint, **nicht** Standard starten; Summary/FULL exportieren.
5. Wenn Quick `TEST VALID` erreicht und vollständig fertig wird: `Summary JSON`, `FULL JSON` und anschließend den neuen blinden AUDT exportieren.
6. Erst nach Auswertung dieses validierten Quick-Laufs entscheiden, ob Standard sinnvoll ist.
