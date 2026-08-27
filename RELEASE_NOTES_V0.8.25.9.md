# Sammy v0.8.25.9 — Proof 1.6 Performance + Surface Quality + Result Review 1.3

## Ausgangspunkt

Der validierte Quick-Lauf von v0.8.25.8 hat Proof 1.6 erstmals mit `PASS` abgeschlossen (0.4334 cm RMSE, 0.549 weighted Protocol Units, 100 % Seed-Akzeptanz, 0.762 cm mittlere Seed-Streuung, 100 % Conflict-Erkennung). Dieser Build verändert deshalb **nicht** die erfolgreiche Solverarchitektur, die Gate-Grenzen oder die ANSUR24-PROT-v2-Messoperatoren.

v0.8.25.9 adressiert drei praktische Probleme des ersten PASS-Builds:

1. sehr lange Laufzeit / starke Geräteerwärmung auf iPhone,
2. visuell teilweise kantig wirkende Torso-Übergänge,
3. zu technische und unübersichtliche Inspector-Oberfläche.

## Performance-Pass ohne Solver-Mathematikänderung

Während eines Solver-V2-Proofs wird das normale 60-fps-WebGL-Rendering weitgehend unterdrückt. Ein langsamer Heartbeat hält Safari sichtbar responsiv, ohne den GPU-Renderpfad permanent laufen zu lassen.

Zusätzlich gibt es einen exakten Shape→ANSUR24-Messcache. Nur **numerisch identische** Shape-Zustände dürfen eine bereits vollständig berechnete 24-Maß-Messung wiederverwenden. `applyAnnyParams()` wird trotzdem ausgeführt; das Rig/Shape bleibt damit synchron. Der Cache verändert weder Kandidaten noch Jacobian-Mathematik.

Der Proof exportiert neue reine Performance-Diagnostik:
- Gesamtlaufzeit,
- Anzahl und Zeit von Shape-Anwendungen,
- exakte Messcache-Hits/Misses,
- Jacobian-Aufrufe und Jacobian-Zeit,
- unterdrückte Renderframes / Heartbeat-Frames.

Diese Werte beeinflussen **kein** PASS/WARN/FAIL-Gate.

## Torso Surface Continuity v1 — Diagnose, noch kein Gate

Jede fertige normale Solver-Rekonstruktion erhält zusätzlich eine experimentelle Torso-Oberflächen-Diagnose. Sie untersucht mehrere Rest-Mesh-Querschnitte zwischen Hüfte und Brust auf abrupte Änderungen von Breite und Tiefe.

Status:
- `ok`
- `attention`
- `high`

Wichtig: Die Schwellen sind zunächst empirisch und werden mit Blind-AUDT-Beobachtungen kalibriert. Der Wert ist `gate:false` und beeinflusst Solverobjective, Proof-Fit und Gate **nicht**.

Im Blind Audit gibt es deshalb zusätzlich den unabhängigen Qualitäts-Tag **„Torso-Übergang kantig“**. Er kann auch bei einem ansonsten mit ✓ bewerteten Körper gesetzt werden.

## Ergebnis prüfen · Result Review 1.3

Der bisherige Proof Inspector wird im normalen UI als **ERGEBNIS PRÜFEN** dargestellt und ist standardmäßig geschlossen.

Die normale Nutzeransicht besteht aus:
1. kurzer Ergebnisübersicht,
2. `Körper vergleichen`: Ziel / Ergebnis / Solver-Start + optional ANSUR-Farben,
3. `Entstehung ansehen`: verständliche Stufenbezeichnungen von Start bis Polish.

Restart-Scores, Stat-Archetypen, Seed-Galerie, Familienresiduen und vollständige 24-Maß-Debugdaten bleiben erhalten, liegen aber unter **Technische Details**.

## Wissenschaftliche Grenze

Unverändert gegenüber v0.8.25.8:
- Proof-Schema `sammy-solver-v2-proof-v1.6`,
- ANSUR24-PROT-v2 Definitionen und MeasurementStates,
- Target-/Seed-Validity,
- Reliability-Gewichte,
- Repair-v1.6-Policy,
- Statistical Body Bank,
- hierarchischer Solve,
- Canonical Multistart,
- bounded Polish,
- Proof 1.6 PASS/WARN/FAIL-Grenzen.

Der erste v0.8.25.9-Quick ist deshalb ein **Regression-/Performance-Test**: wissenschaftliches Ergebnis soll reproduziert werden, während Laufzeit und thermische Last sinken.

## Bereits vorbereitete Few-Measure-Datenbasis

Die vorhandenen ANSUR-Prediction-Datasets bleiben unverändert. Sie definieren bereits `default5 = stature + weightkg + chest_circumference + waist_circumference + buttock_circumference`; Geschlecht und Alter sind freier Kontext. v0.8.25.9 integriert dieses Modell noch **nicht** in den Solver — die Produktionsmaske folgt nach Stress- und held-out Real-ANSUR-Validierung.
