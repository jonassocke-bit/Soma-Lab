# Sammy v0.8.22.0 — ANSUR24-PROT-v2

## Kernänderung
Solver24 misst die 24 ANSUR-Ziele nicht mehr gesammelt in einer T-Pose. Die Maße werden in 10 reproduzierbaren MeasurementStates gebündelt und pro Kandidatenkörper auf dem realen Mesh gemessen.

## Implementiert
- 10 MeasurementStates: Standing, Sitting, Chest Breadth, Waist-Hand-Chest, Hip-Arms-Away, Wrist-90, Thigh-Special, Lower-Leg-10cm, Arm-Relaxed-Palm-Forward, Flexed-Arm.
- Crotch Height: +1.0 cm definierte ANSUR-Postkorrektur.
- Biacromial Breadth: Sitting + Koronalprojektion Acromion L/R statt beliebiger 3D-Distanz.
- Chest Depth: Right Chest Point anterior → Rücken auf derselben Höhe.
- Chest Breadth: eigener Full-Inspiration-State + expliziter Rib-Cage-Weichteilproxy; Atemvolumen wird nicht erfunden.
- Biceps/Forearm: Flexionspose wird geriggt; max-effort Muskelbulging/Faustdeformation bleibt als ungelöste Protokollbedingung markiert.
- Allowable Observer Error pro Maß wird als `protocolUnits = |error| / allowance` im Fit-Gate und Export geführt. Die Allowances werden ausdrücklich nicht als σ behandelt.
- Legacy Influence24 v1 bleibt historisch und wird nur noch als Kandidaten-Ranking-Hinweis verwendet; der v1 Prior-Kick ist deaktiviert. Der lokale Jacobian misst immer v2 real am Mesh.
- Solver24-Run/Summary werden als `ANSUR24-PROT-v2` gespeichert.

## Absichtlich noch nicht enthalten
Gewicht/Masse-Constraint und der Conditional Shape Prior über 3D-Form. Diese folgen erst nach dem v2-Protokoll-Diagnosetest, damit Messdefinitions- und Prior-Effekte getrennt bleiben.

## Erster Test
1. App neu laden, LAB → SOLV öffnen.
2. `Stress` wählen.
3. Den 8×2 ANSUR-Diagnoselauf starten.
4. Summary/FULL exportieren.
5. Besonders `protocol.rmsUnits`, `protocol.maxUnits`, Chest Breadth/Depth, Crotch Height, Biacromial sowie Biceps/Forearm vergleichen.
6. AUDT visuell prüfen; PROT bleibt für die poseweise Geometriekontrolle maßgeblich.

Hinweis: Die alte Influence-Deep/Addendum-Datenbasis wird nicht gelöscht und nicht als v2 umetikettiert.
