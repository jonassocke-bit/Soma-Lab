# Sammy v0.8.23.0 · MASS + COMPOSITION v1

## Ziel

Solver24 bleibt ein 24-Maß-Solver. `weightkg` wird **Kontext / weiche Massenbedingung**, kein 25. ANSUR-Maß. Ein bekanntes Nutzer-/ANSUR-Gewicht hat Vorrang; fehlt es, wird Gewicht aus den 24 ANSUR-Maßen + Alter + Geschlecht geschätzt.

## Gewichtsmodell

- Datenbasis: `ansur-prediction-trainval-v1.json`.
- Training ausschließlich Split `train`; Validation ausschließlich Split `validation`; reservierter Testsplit bleibt unangetastet.
- Modell: geschlechtsspezifische standardisierte lineare Ridge-Regression auf Alter + 24 Maßen.
- Validation:
  - Männer: RMSE 1.676 kg, MAE 1.285 kg, R² 0.9859, 98.7 % innerhalb ±5 kg.
  - Frauen: RMSE 1.301 kg, MAE 1.017 kg, R² 0.9840, 100 % innerhalb ±5 kg.
- Für den Solver wird ein absichtlich breiter Unsicherheitsboden verwendet: 5 kg bei geschätztem Gewicht, 4 kg bei bekanntem Gewicht, weil zusätzlich das Mesh-Volumenmodell noch nicht extern kalibriert ist.

## Mesh-Masse

`currentRestLow` wird über die Dreieckstopologie als signiertes Tetraedervolumen integriert. Vor Nutzung als Solver-Constraint läuft ein Topologie-Audit: Boundary Edges, Non-Manifold Edges und Orientierungs-Konflikte müssen 0 sein. Andernfalls bleibt Volumen rein diagnostisch und die Mass-Row wird automatisch deaktiviert.

Aus dem Zielvektor wird über RFM ein schwacher Fettanteils-Proxy berechnet. Für die Volumen↔Masse-Abbildung wird daraus eine Zwei-Komponenten-Dichte aus 0.9007 kg/L (Fett) und 1.1000 kg/L (fettfreie Masse) gebildet. Das ist **keine klinische Körperfettmessung**; äußeres Meshvolumen und physiologisches Plethysmographie-Volumen sind nicht identisch. Deshalb bleibt der Masseneinfluss weich und wird vollständig exportiert.

## Composition Proxy / Muscle

RFM = `64 - 20*(stature/waist) + 12*sex` (sex: Mann 0, Frau 1). Aus Zielgewicht + RFM wird ein FFMI-Proxy gebildet und gegen die ANSUR-Trainverteilung eingeordnet. Dieser Percentile-Wert verschiebt nur das Regularisierungszentrum des rohen `core:muscle` in einem komprimierten Bereich 0.25…0.75; Sigma 0.22.

Wichtig: `core:muscle` wird **nicht** als Muskelanteil interpretiert. Der bestehende Influence-Prior zeigt, dass der Slider gleichzeitig Taille, Gesäß, Oberschenkel und Arme verändert. Lokale `*-muscle-*` / `*-fat-*` Morphs erhalten nur eine geringe, richtungsabhängige Penalty-Modulation. Direkte 24-Maß-Residuals bleiben autoritativ.

## Solver

- `core:weight` und `core:muscle` werden bei aktivem Mass-Kontext immer in den lokalen Kandidatensatz aufgenommen.
- Der reale ANSUR24-PROT-v2 Jacobian bleibt maßgeblich.
- Zusätzlich wird lokal die Ableitung der Mesh-Masse nach jedem Kandidaten gemessen.
- Die Mass-Row ist mit 0.75 relativ skaliert.
- Ein Masseschritt darf den 24-Maß-RMSE in einer Line-Search um höchstens 0.12 cm verschlechtern.
- Fit-Gate zeigt Massestatus separat als experimentellen Diagnosekanal; Massestatus erzeugt in v1 **keinen zusätzlichen Hard Fail**.

## Stress-Audit

Die acht vorhandenen realen ANSUR-Donors bekommen jetzt ihr echtes Gewicht zurück:

- Männer: 88.9, 86.7, 75.7, 100.0 kg
- Frauen: 60.1, 80.5, 74.5, 68.8 kg

Der bestehende 8 × 2 Stresslauf bleibt damit direkt mit v0.8.22.0 vergleichbar. Wichtigste Abnahme: männliche Arm-Flags, Forearm/Biceps-Residuals, Brust/Taille-Regression sowie Mass Residual.

## Wissenschaftliche Grenzen

- RFM ist ein populationsbasierter Adipositas-Schätzer, keine individuelle DXA-Messung.
- FFMI aus RFM ist nur ein Composition Proxy.
- Das Außenhaut-Volumen muss gegen reale 3D-Scan-/Plethysmographie-Volumina noch empirisch kalibriert werden.
- Flexed Biceps/Forearm modellieren weiterhin keine echte Max-Effort-Muskeldeformation.
- Falls Gewicht/Mass-Constraint korrekt wird, der Unterarm aber systematisch zu klein bleibt, ist das ein starker Hinweis auf fehlende regionale Arm-DOFs/Shape-Space und nicht mehr auf fehlende Gesamtmasse.
