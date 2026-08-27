# Sammy v0.8.26.2 — Real ANSUR Pragmatic Repair 1.0

## Ziel
v0.8.26.2 setzt die Produktdefinition bewusst pragmatischer: Sammy soll einen für Harness-/Design-Ideation brauchbaren, plausiblen Avatar liefern. Die 24 ANSUR-Maße bleiben Forschung/Diagnose, aber nicht jedes pose- oder protokollabhängige Maß ist ein Release-Blocker.

## Neuer kurzer Repair-Lauf
`REAL ANSUR REPAIR · PRAGMATIC REPAIR 1.0` startet direkt an fünf bereits fertigen Real-ANSUR-Stress-Lösungen. Es werden keine neuen ANSUR-Testzeilen konsumiert und keine neuen Morph-Assets erzeugt.

Der Repair testet:
- gemeinsame frische Thorax-Richtung aus vorhandenen Dorsi/Pectoral/V-Shape/Bust/Underbust/Shoulder-Distance-DOFs;
- selektive lineare lokale Morph-Extrapolation zunächst bis ±1.15;
- nur in der letzten Escape-Stufe bis ±1.30;
- Core-Achsen bleiben in ihren originalen 0..1-Bounds;
- Produktgewichtung für Schulter/Torso/Hauptumfänge;
- `Forearm Circumference, Flexed` bleibt nahezu rein diagnostisch und darf das Ruhemesh nicht aufblasen;
- moderater Composition-Settle Richtung statistischem Muskelzentrum nur, wenn produktrelevante Maße praktisch nicht schlechter werden.

## Wichtig
Der erfolgreiche Proof-1.6-Solver, ANSUR24-PROT-v2, MeasurementStates, Repair-v1.6, Statistical Prefit und die 902er Prediction-Reserve werden durch diesen Mini-Test nicht verändert. Die Repair-Logik wird erst nach einem positiven 5-Körper-Ergebnis in einen letzten 10er Real-ANSUR-Sanity-Lauf befördert.

## Entscheidung nach dem Lauf
- `USEFUL`: gleiche begrenzte Repair-Logik einmal in 10 bekannten Real-ANSUR-Fällen bestätigen, dann Few-Measure Prediction.
- `PARTIAL`: nur die tatsächlich hilfreichen Repair-Komponenten behalten; kein neuer großer Solverzweig.
- `NO-BENEFIT`: Body-Lab nicht weiter auf Laborperfektion treiben; aktuelle Avatar-Baseline + Few-Measure Prediction + Benutzerkorrekturen.
