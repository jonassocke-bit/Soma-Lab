# Sammy v0.8.25.6 · SOLVER V2 PROOF 1.5 · HIERARCHICAL CANONICAL MULTISTART

## Warum dieser Build

Proof 1.4 hat gezeigt, dass ein frisch gemessener breiter Candidate-Pool einen festgefahrenen Seed retten kann, aber mindestens ein Edge-Far-Seed trotz sinnvoller Fresh-Jacobian-Richtungen in einem schlechten Basin bleibt. Deshalb wird die Hauptarchitektur nicht nochmals nur breiter gerankt.

Dieser Build setzt die bereits im `MORPH_OBSERVATORY_V0.8.24.0.md` geplante Hierarchie um:

**Structural Rig → globale Masse → Schulter/Hüfte → regionale Composition → Segmentlängen/Landmarkpositionen → lokale reine Maßkorrektur.**

Frühere Stufen werden nicht blind hart eingefroren. Spätere Stufen dürfen begrenzt auf frühere Variablen zurückgreifen, müssen deren priorisierte Residualgruppen aber innerhalb eines Schutzkorridors halten.

## Statistical Body Bank / Canonical Prefit

Neu ist `solver-v2-statistical-body-bank-v1.json`:

- ausschließlich aus `ansur-prediction-trainval-v1.json`;
- 5.156 ANSUR-II Train+Validation-Zeilen;
- **keine** Nutzung von `ansur-prediction-test-v1.json`;
- 8 beobachtete Medoid-Archetypen pro Geschlecht;
- Clusterprofil aus Größe, Gewicht und relevanten proportions-/segmentbezogenen Quotienten;
- ANSUR II bleibt eine militärische Referenzpopulation, kein universelles ziviles Populationsmodell.

Aus den 24 Zielmaßen wird zusätzlich die bereits vorhandene sex-spezifische Weight-Ridge aus `mass-composition-v1.json` genutzt. RFM/FFMI verschiebt weiterhin nur schwach das Regularisierungszentrum von `core:muscle`; `core:muscle` wird nicht als physiologischer Muskelanteil interpretiert.

Statistik ist **nur Initialisierungskontext**. Kein direktes Zielmaß wird ersetzt, geglättet oder auf Populationsmittel zurückgezogen.

## Canonical Multistart

Nach unverändertem `TEST VALID` werden bei normalen Round-trip-Zielen drei Startzustände auf dem echten Mesh bewertet:

1. der vorvalidierte Proof-Seed,
2. ein target-spezifischer Statistical Canonical Body,
3. ein Blend aus Proof-Seed und Canonical Body.

Der beste plausible Start geht durch die Stufen. Bleibt dieser Pfad FAIL, wird ein zweites bereits gescreentes Basin einmal kurz durch dieselbe Hierarchie geschickt. Conflict-Controls erhalten absichtlich **keine** statistische Rettung.

## Hierarchischer Solve

Jede Stufe verwendet Semantik/Deep nur zur Vorauswahl. Die tatsächlich gewählten DOFs werden danach erneut mit dem echten v0.8.24.26-Mesh und allen autoritativen MeasurementStates vermessen.

Die sieben Repair-v1.6-Maße behalten ihre bisherigen Regeln: alte numerical Deep interaction residuals bleiben ausgeschlossen.

Ein fresh-wide Solve bleibt nur als **FINAL Residual Finisher**, falls die gestufte Lösung weiterhin FAIL ist. Er ist nicht mehr die Hauptarchitektur.

## Inspector 1.1

Der Inspector aus v0.8.25.5 wurde nochmals durchgegangen und erweitert:

- STAT-Card mit vorhergesagtem Gewicht, Muscle-/Proportions-Center und nächsten ANSUR-Archetypen;
- Darstellung aller Restart-Kandidaten inklusive gewähltem Basin;
- neuer `Solver-Start`-Button;
- Phasenleiste `TEST → STAT → RIG → MASS → FRAME → COMP → SEG → LOCAL → FINAL`;
- jede gespeicherte Stufe enthält einen Shape-Snapshot und ein 24-Maß-Fit-Snapshot;
- Stufen in der Timeline sind antippbar und werden direkt im 3D-Viewport replayt;
- alte Proof-v1.4-FULL-JSONs bleiben im Inspector lesbar;
- fertige Körper, ANSUR-Farboverlay und exakte Einzel-MeasurementState-Ansicht bleiben erhalten.

## Unverändert

- ANSUR24-PROT-v2 Messdefinitionen;
- v0.8.24.26 Messgeometrie;
- Target-Generator und TEST-VALID-Gates aus Proof 1.2;
- Reliability-Gewichte;
- Repair-v1.6-IDs;
- Konfliktziel-Logik;
- bestehende PASS/WARN-Grenzen, damit die Proofs vergleichbar bleiben.
