# BODY BANK SOLVER 1.1 · Top-3 Local Fit + Bidirectional Controller Probing · v0.8.29.4

## Ausgangslage

Der 16er Family-/Near-Neighbor-Holdout aus v0.8.29.3 blieb trotz harter Familien- und Nahnachbar-Ausschlüsse auf GO:

- Neutral-Median: `0.514685`
- Retrieval-Median: `0.435545`
- Single-Seed Local-Fit-Median: `0.303705`
- Retrieval besser als neutral: `11/16`
- Local Fit verbessert Retrieval: `11/16`
- Local Fit endet besser als neutral: `14/16`

Damit ist die Body-Bank-Architektur belastbar genug für den nächsten kleinen Ausbau. Gleichzeitig zeigte der Trace einen kritischen Punkt: der direkte Brust-Morph `measure-bust-circ-incr` hatte je nach Körperkontext sowohl positive als auch negative lokale Messableitungen. Ein Morphname darf daher niemals die erwartete Wirkrichtung im Solver bestimmen.

## Änderungen in Solver 1.1

### 1. Bidirektionales Probing

Jeder zugelassene Local-Fit-Controller wird am konkreten Seed und im aktuellen Körperkontext in beide Richtungen getestet:

- `+epsilon`
- `-epsilon`

Gemessen wird die tatsächliche lokale Änderung des Zielmaßes. Nur daraus werden mögliche Korrekturschritte abgeleitet. Der Solver darf also auch bei einem `*-incr`-Morph in die negative Rohwert-Richtung gehen, falls dies lokal die benötigte Messrichtung ergibt.

Der Trace speichert unter anderem:

- beide Probe-Rohwerte,
- beide gemessenen Probe-Ausgaben,
- lokale Ableitungen in cm / Morph-Einheit,
- die gewählte Probe-/Ableitungsquelle,
- mögliche Vorzeichenwechsel zwischen den beiden lokalen Ableitungen,
- Rollback-Gründe.

Die bisherigen lokalen Bounds bleiben unverändert.

### 2. Top-3 Local Fit statt Single Seed

Nach dem Trusted-Retrieval werden die Retrieval-Ränge `#1`, `#2` und `#3` unabhängig lokal gefittet. Jeder Kandidat startet wieder exakt von seinem auditierten Seed.

Danach gewinnt das Ergebnis mit dem kleinsten zulässigen finalen Geometrie-Score. Bei Gleichstand wird der kleinere lokale Abstand bevorzugt.

Der manuelle Solver-Button heißt deshalb jetzt:

`2 · Top-3 lokal fitten`

Die Top-5-Karten bleiben als Vorschau anklickbar. Die Solverentscheidung testet aber automatisch die ersten drei Retrieval-Seeds.

### 3. Human-Audit und Solver-Eignung getrennt

Ein visuell akzeptierter Body-Bank-Node bleibt `trusted`, auch wenn eine konkrete technische Mesh-Messung für Solverzwecke offensichtlich fehlerhaft ist.

Neu ist deshalb die explizite Trennung:

- `trusted` / `HUMAN_ACCEPTED` = visuelle Plausibilitätsinformation,
- `solverEligible` = die für diesen Solver benötigten technischen Messungen bestehen den breiten Measurement-Sanity-Gate.

Ein solver-ineligible Körper wird aus der aktuellen Retrieval-Shortlist verworfen, verliert aber nicht sein Human-Audit-Wissen.

### 4. Local Global Gate bleibt konservativ

Der Local Fit darf weiterhin nur steuern:

- kanonische Rest-Mesh-Statur,
- Brust,
- Taille,
- Hüfte/Gesäß.

Gewicht bleibt Retrieval-/Diagnose-Prior und ist kein Local-Fit-Ziel. Cross-Region-Rettung bleibt verboten. Ein verändertes Ergebnis wird nur behalten, wenn:

1. der technische Measurement-Gate weiterhin besteht,
2. der Geometrie-Score nicht schlechter als beim auditierten Seed ist.

Jeder veränderte Gewinner bleibt `local-unaudited` und wird an `BANK -> ACTIVE` übergeben.

## Neuer Proof v1.3

Der nächste Proof umfasst `24` geschlechtsbalancierte, diverse Family-Holdouts im Bereich 140–205 cm.

Pro Ziel werden ausgeschlossen:

- exakter Zielkörper,
- komplette `familyId`,
- Core-Rezeptnachbarn mit Distanz `<= 0.16`.

Verglichen wird:

`Neutral -> Retrieval -> Single-Seed Local Fit -> Top-3 Local Fit`

Dabei stammen Single-Seed und Top-3 aus exakt derselben Retrieval-Shortlist. Das isoliert den Zusatznutzen der Top-3-Strategie.

### GO-Gate

- Retrieval-Median < Neutral-Median,
- Top-3-Median <= Single-Seed-Median,
- Top-3-Median <= Retrieval-Median.

Zusätzlich werden Anzahl der Top-3-Zusatzgewinne und Top-3-vs-Neutral-Erfolge berichtet.

## Nicht geändert

- keine neuen anatomischen DOFs,
- keine größeren lokalen Bounds,
- keine freie Weight-/Muscle-Optimierung,
- kein Kopf-/Head-Fat-Modell,
- keine Änderung an ANSUR-Messdefinitionen,
- keine globale Ableitung von Audit-Rejections.
