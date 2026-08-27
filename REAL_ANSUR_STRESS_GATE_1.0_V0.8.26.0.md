# REAL ANSUR STRESS GATE 1.0 · v0.8.26.0

## Ziel

Nach dem validierten model-generated Proof 1.6 wird erstmals ein Zielvektor verwendet, der **nicht aus Sammys eigenem Morphraum erzeugt wurde**. Zehn echte, beobachtete ANSUR-II-Zeilen aus dem held-out Testsplit werden mit denselben 24 ANSUR24-PROT-v2-Zielmaßen gelöst.

Die Kernfrage lautet: **Ist ein real beobachteter ANSUR-Messvektor im Sammy-Bodyspace repräsentierbar, ohne den erfolgreichen Solverpfad neu zu erfinden?**

## Eingefrorene Baseline

Unverändert gegenüber v0.8.25.9:

- `sammy-solver-v2-proof-v1.6`
- Statistical Canonical Prefit aus ANSUR Train+Validation
- Hierarchie: Structural Rig → global mass → shoulder/hip frame → regional composition → segment/landmark → local measure
- Fresh-wide nur als letzte Residualkorrektur
- bounded Post-Solve Polish, maximal 2 Runden
- ANSUR24-PROT-v2 MeasurementStates/Operatoren
- Repair-v1.6-Policy und Reliability-Gewichte

## Stress-Suite

| # | Profil | Sex | Alter | Größe | Gewicht | Größe %-Rang | Gewicht %-Rang | Frame %-Rang | Beinratio %-Rang |
|---:|---|:---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Typisch · Mann | ♂ | 33 | 173.5 cm | 90.7 kg | 39.6 | 66.6 | 59.9 | 57.6 |
| 2 | Typisch · Mann · älter | ♂ | 41 | 176.5 cm | 88.2 kg | 58.2 | 60.4 | 27.6 | 65.6 |
| 3 | Typisch · Frau | ♀ | 23 | 163.8 cm | 67.0 kg | 58.5 | 55.5 | 57.2 | 46.5 |
| 4 | Typisch · Frau · älter | ♀ | 44 | 165.3 cm | 67.6 kg | 65.9 | 57.5 | 38.8 | 35.5 |
| 5 | Randfall · sehr groß · Mann | ♂ | 48 | 189.0 cm | 102.4 kg | 97.9 | 87.8 | 78.5 | 34.3 |
| 6 | Randfall · sehr klein · Frau | ♀ | 21 | 150.3 cm | 64.3 kg | 2.3 | 41.8 | 28.8 | 61.2 |
| 7 | Randfall · schwer · Mann | ♂ | 25 | 176.5 cm | 118.1 kg | 58.2 | 97.9 | 16.1 | 77.0 |
| 8 | Randfall · leicht · Frau | ♀ | 42 | 152.3 cm | 48.0 kg | 4.3 | 2.3 | 59.9 | 75.9 |
| 9 | Randfall · breiter Frame · Mann | ♂ | 26 | 174.0 cm | 91.6 kg | 43.9 | 69.3 | 97.9 | 91.2 |
| 10 | Randfall · lange Beine · Frau | ♀ | 19 | 161.4 cm | 54.6 kg | 45.8 | 10.7 | 99.0 | 98.0 |

Die sechs Randfälle sind **beobachtete Personen**. Es werden keine unabhängigen Extremwerte künstlich zu einem möglicherweise unmöglichen Körper kombiniert.

## Adaptiver Ablauf

1. Jede der 10 Personen wird einmal rekonstruiert.
2. Alle 6 `edge`-Profile erhalten zwingend einen zweiten deterministischen, weit entfernten Core-Seed.
3. Ein `typical`-Profil erhält ebenfalls einen zweiten Seed bei FAIL, >3 high-reliability Observer-Units oder Plausibility-Hard-Fail.
4. Der zweite Seed durchläuft dieselbe Statistical-Canonical-/Blend-Screening- und Solver-Pipeline wie der erste. Damit wird die **Robustheit der Produktionsarchitektur**, nicht ein nackter lokaler Optimierer isoliert getestet.
5. Nach jedem fertigen Seed und nach jeder Person wird der IndexedDB-Run persistiert.

## Blind-Holdout

Nicht als 24 Solverziele verwendet:

- `torso_height` = Schulter → Schritt
- `upperleg_height` = Oberschenkelhöhe

Beide liegen in der ANSUR-Testzeile vor und werden nach dem Solve gegen die am finalen Sammy-Mesh gemessenen Werte verglichen.

`weightkg` wird als zusätzlicher Kontext gespeichert. Der derzeitige Statistical Prefit darf den realen Wert **nicht direkt lesen**; exportiert wird nur der Fehler der aus den 24 Maßen abgeleiteten statistischen Weight-Schätzung.

## Stress-Gate v1

### 24-Maß-Repräsentierbarkeit PASS

- 10/10 Fälle vollständig
- ≥80 % non-fail
- ≥60 % PASS
- alle 4 typischen Profile non-fail
- ≥4/6 Randfälle non-fail
- Gesamt-RMSE ≤0,90 cm
- weighted RMS ≤1,35 Observer-Units
- max high-reliability ≤4u
- 0 Plausibility-Hard-Fails

### Blind-Holdout

- Median-RMSE ≤1,5 cm: gut
- ≤2,5 cm: beobachten
- >2,5 cm: kritisch

### Seed-Re-Test

- mittlere abgeleitete Seed-Streuung ≤1,2 cm: gut
- ≤2,0 cm: beobachten
- >2,0 cm: kritisch

Ein primärer Repräsentierbarkeits-FAIL ergibt Gesamt-FAIL. Ein primärer PASS wird auf WARN zurückgestuft, wenn Blind-Holdout oder Re-Test-Stabilität kritisch sind.

## Prediction-Split-Schutz

Verbrauchte Testzeilen: `[129, 114, 773, 664, 140, 790, 358, 757, 493, 745]`.

`ansur-prediction-final-reserve-v1.json` enthält danach **902** bisher unbenutzte Testpersonen. Diese Datei ist die vorgesehene unabhängige Reserve für den späteren Vergleich `24 echte Maße` vs. `7 Eingaben` vs. `5 Eingaben`.
