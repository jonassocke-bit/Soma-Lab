# SAMMY v0.8.25.2 — SOLVER V2 PROOF 1.2

## Anlass

Der erste Runtime-Test von v0.8.25.1 stoppte korrekt als `PROOF INVALID`, aber bereits beim ersten Typical-Target mit `TARGET_GENERATION_INVALID` nach 40 Kandidaten. Die Validierung war damit fail-safe, der Parameterraum-Abstand des Target-Generators jedoch zu streng definiert.

## Ursache

Proof 1.1 verwendete `sammySolverV2ProofParameterRms()` als harten Mindestabstand. Dieser RMS wird über **alle** Solvervariablen des sex-spezifischen Deep-Mappings gebildet. Der Target-Generator verändert absichtlich nur eine kleine Teilmenge aus Core- und Local-DOFs. Bei rund 40–50 verfügbaren Variablen wird eine reale Änderung an 5–10 DOFs dadurch numerisch verdünnt. Ein plausibler, eindeutig nicht-neutraler Körper konnte deshalb `minParamRms = 0.10` verfehlen, bevor seine 24 Mesh-Maße überhaupt bewertet wurden.

Das ist ein Test-Harness-Fehler, kein Beleg gegen den Solver und kein Grund, die Messgeometrie zu ändern.

## Proof 1.2

Parameterabstand wird nun zweigleisig erfasst:

- `globalRms`: RMS über die gesamte Solver-Map; bleibt als dimensionsabhängige Diagnose erhalten.
- `activeRms`: RMS nur über Variablen mit mindestens 3.5 % normalisiertem Unterschied zwischen den beiden Shapes.
- `activeCount`: Anzahl dieser tatsächlich unterschiedlichen Variablen.

Target-Generation verlangt weiterhin mindestens drei aktive Variablen, reale Mindestdistanz in den 24 ANSUR24-PROT-v2-Maßen und alle bestehenden Mesh-/ANSUR-Delta-/Duplicate-Gates. Der globale RMS bleibt ein kleiner zusätzlicher Schutz, ist aber nicht mehr der dominierende Gate-Wert.

### Neue Target-Grenzen

Typical:
- global parameter RMS >= 0.045
- active parameter RMS >= 0.12
- real measure distance >= 1.55 reliability-gewichtete Protocol Units
- real measure RMSE >= 0.65 cm

Edge:
- global parameter RMS >= 0.065
- active parameter RMS >= 0.18
- real measure distance >= 2.10 Protocol Units
- real measure RMSE >= 0.90 cm

### Seed-Preflight

Dasselbe Dimensionsproblem konnte auch Seed↔Source- und Seed↔Seed-Abstände treffen. Proof 1.2 prüft daher auch dort globalen und aktiven Parameterabstand getrennt. Die real gemessenen Initialfehler bleiben unverändert zwingend.

## Bessere Fehlerdiagnose

Wenn Target- oder Seed-Erzeugung erneut scheitert, enthält die sichtbare Fehlermeldung jetzt die Reject-Zähler, z. B. `meshPlausibility=...`, `anthroDeltaPrior=...` oder `tooCloseInMeasureSpace=...`. Dadurch ist ein weiterer Invalid-Lauf direkt klassifizierbar, ohne die Schutzgates blind zu lockern.

## Nicht geändert

- ANSUR24-PROT-v2 Messdefinitionen
- v0.8.24.26 Messgeometrie / Acromion-Operator
- Deep-Morph-Taxonomie und Repair-v1.6-Policy
- Solver-V2 Jacobian / Optimierer / Direction A/B
- Reliability-Gewichtung der Zielmaße
- Conflict-Control und blindes AUDT

## Schema

- App: `0.8.25.2`
- Proof: `sammy-solver-v2-proof-v1.2`
- Summary: `sammy-solver-v2-proof-summary-v1.2`
- Test validity: `sammy-solver-v2-proof-test-validity-v1.2`

Der Schema-Bump verhindert ein Resume des v1.1-Invalid-Laufs als Proof 1.2.
