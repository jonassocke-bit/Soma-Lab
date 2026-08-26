# Solver V2 Proof 1.1 — technische Notiz

## Abgrenzung

Proof 1.1 ist ein **Test-Harness-Fix** auf Basis von v0.8.25.0. Keine Messdefinition und kein MeasurementState wird verändert. Die numerische Solverarchitektur bleibt Deep-Hierarchie → fresh real-mesh Jacobian → reliability-normalisierte regularisierte Trust-Region-Schritte → optional Direction B.

## Testvaliditäts-Pipeline

### 1. Target generation

Für jedes versteckte Round-trip-Target wird ein gleichgeschlechtlicher / gleichaltriger Neutral-Basiskörper real über ANSUR24-PROT-v2 vermessen. Der deterministisch erzeugte Kandidat muss anschließend gleichzeitig erfüllen:

- finite 24 Maße;
- keinen harten geometrischen Plausibilitätsbruch;
- Mindestdistanz zur Baseline im normalisierten Solver-Parameterraum;
- Mindestdistanz zur Baseline in real gemessenen cm und reliability-gewichteten Protocol Units;
- mindestens drei aktive Solvervariablen;
- reliability-aware ANSUR-Delta-Prior;
- keine Near-Duplicate-Distanz zu bereits akzeptierten gleichgeschlechtlichen Targets.

Nach 40 erfolglosen Kandidatenversuchen wird **nicht** ersetzt oder neutralisiert, sondern `TARGET_GENERATION_INVALID` ausgelöst.

### 2. Reliability-aware target prior

Für die Generatorprüfung wird pro Maß der Z-Score des Kandidaten mit dem Z-Score des **gleichgeschlechtlichen, gleichaltrigen Sammy-Basiskörpers** verglichen.

Verwendet werden nur Maße mit Reliability ≥ 0.8. Bewertet werden gewichtete ΔZ-RMS, maximales |ΔZ| und neu erzeugte extreme Ausreißer bei zuvor nicht-extremer Baseline. Absolute bereits vorhandene Modell↔ANSUR-Offsets bleiben im Export sichtbar, blockieren aber nicht allein die Erzeugung.

### 3. Seed preflight

Seed-Kandidaten sind deterministisch und werden vor dem Solver real vermessen. Round-trip-Seeds müssen:

- mindestens 0.10 normalisierte Parameter-RMS vom Source entfernt sein;
- mindestens 1.25 reliability-gewichtete Protocol Units Initial-RMS besitzen;
- mindestens 0.55 cm Initial-RMSE besitzen;
- zu bereits ausgewählten Seeds mindestens 0.075 normalisierte Parameter-RMS Abstand halten;
- den Mesh-Hard-Guard bestehen.

Nur vorvalidierte Shapes werden im Target persistiert und später vom Solver verwendet.

### 4. Global test validity

`sammySolverV2ProofValidateTest()` prüft vor Stage `solving`:

- erwartete Target- und Seed-Anzahl;
- Target-generation-valid;
- aktive Source-Variablen;
- same-sex pairwise target diversity;
- keine Near-Duplicates;
- vollständige Seed-Preflights.

Fehler erzeugen Stage `invalid` und Summary-Gate `invalid`. Solverkennzahlen dürfen dann nicht interpretiert werden.

## Solver selbst

Die v0.8.25.0-Solverrichtung bleibt bewusst unverändert, damit der nächste Quick-Lauf die Testreparatur und nicht zugleich eine neue Optimiererarchitektur evaluiert.

- Deep numerische Interaction-Residuals der sieben Repair-v1.6-Maße bleiben AUS.
- Acromion-abhängige Maße werden im lokalen Jacobian frisch über v0.8.24.26 gemessen.
- Candidate ranking A bleibt Deep-taxonomiegestützt.
- Direction B bleibt semantisch/strukturell gerankt und benutzt ebenfalls ausschließlich fresh real-mesh Jacobians.

## Direction-B-Reporting

`fallback` besitzt in v1.1:

```text
attempted
improved
finalFitAccepted
```

`improved` bedeutet nur: Objective nach Direction B ist kleiner. `finalFitAccepted` bedeutet: der abschließende Fitstatus ist PASS oder WARN. Das verhindert die Fehlinterpretation eines weiterhin schlechten, aber verbesserten Seeds als „accepted“.

## AUDT

Stage `solver-v2-proof-audit` speichert je Target Best-Fit und Far-Seed-Rekonstruktion. Der Far Seed ist der Seed mit dem größten `initialFit.weightedRmsProtocolUnits`. Beide bleiben im AUDT blind; Targettyp, Seedtyp und Zielmaße werden dem Nutzer während der Bewertung nicht offengelegt.

## Entscheidungslogik für den nächsten Quick-Lauf

1. **PROOF INVALID** → Test-Harness noch nicht belastbar; keine Aussage zum Solver.
2. **TEST VALID + Solver FAIL/WARN/PASS** → erstmals interpretierbare inverse Evidenz.
3. Erst wenn Quick valid ist, lohnt sich Standard.
