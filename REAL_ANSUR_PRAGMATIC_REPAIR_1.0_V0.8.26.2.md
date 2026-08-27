# REAL ANSUR PRAGMATIC REPAIR 1.0 · v0.8.26.2

## Produktannahme
Sammy ist kein medizinischer Scanner und kein vollautomatischer Maßschnitt-Generator. Ziel ist ein anthropometrisch brauchbarer, visuell plausibler Körper als Anhaltspunkt für Harness-/Design-Ideation. Relevante Torso-/Schultergrößen sollen gut getroffen werden; poseabhängige oder für das Produkt wenig relevante ANSUR-Maße dürfen größere Restfehler besitzen.

## Quelle
Fünf bereits verbrauchte Fälle aus Real ANSUR Stress Gate 1.0:
- `typical-male-a`
- `typical-male-b`
- `edge-male-heavy`
- `typical-female-a`
- `edge-female-short`

Keine neue held-out Testperson wird verwendet. Die 902er Prediction-Reserve bleibt unberührt.

## Produktkritische Maße
Priorisiert werden:
- Stature
- Biacromial Breadth
- Chest Circumference
- Waist Circumference
- Buttock Circumference
- Waist Back Length
- Shoulder Length

Formunterstützend u. a. Chest Breadth/Depth, Waist Breadth/Depth, Hip Breadth, Crotch/Tibiale/Thigh. Chest Breadth bleibt reduziert, weil die ANSUR↔Oberflächen-Brücke Full Inspiration / Rib-Cage-Kompression / Gewebe-Ausschluss nicht vollständig reproduziert.

`Forearm Circumference, Flexed` erhält im Pragmatic Repair nur sehr geringes Produktgewicht. Der aktuelle Ruhemesh-/Posezustand simuliert Maximalanspannung und Faustdeformation nicht.

## Repair-Stufen
### THORAX
Frischer lokaler Jacobian über vorhandene DOFs:
- `torso-muscle-dorsi-incr`
- `torso-muscle-pectoral-incr`
- `torso-vshape-incr`
- `measure-bust-circ-incr`
- `measure-underbust-circ-incr`
- `measure-shoulder-dist-incr`

Damit wird eine virtuelle kombinierte Thorax-Richtung getestet, statt sofort ein neues Morph-Asset anzulegen.

### FRAME
Schulter-/Rahmenkorrektur über Shoulder-Distance, V-Shape, Proportions und den bestehenden gekoppelten Torso-Scale.

### SOFT
Nur bei relevantem Umfangsdefizit oder dem schweren Randfall: Waist/Hips/Buttock/Upperleg-Fat/Upperleg-Scale/Upperarm-Fat + Muscle. Ziel ist regionale Masse statt pauschaler Muskelkompensation.

### ESCAPE
Nur wenn nach den vorherigen Stufen produktkritische Fehler groß bleiben. Ausgewählte **lineare lokale** Morphs dürfen bis ±1.30 reichen. Core-Regler werden nie über ihre Originalgrenzen extrapoliert.

Außerhalb ±1 liegende lokale Werte werden in der Repair-Objective zusätzlich bestraft. Eine extrapolierte Lösung bleibt nur erhalten, wenn die produktbezogene Objective und die kritischen Maße tatsächlich besser werden.

## Composition Settle
Liegt `core:muscle` deutlich oberhalb des statistischen Zentrums, werden 25 % und 50 % Rückweg zum Prior real am Mesh getestet. Eine weniger muskulöse Variante wird nur akzeptiert, wenn kritischer RMSE, kritischer Maximalfehler und Produkt-Score praktisch stabil bleiben.

## Mini-Gate
Kein 24/24 Observer-Error-Gate. `USEFUL` verlangt insbesondere:
- deutliche mittlere Verbesserung der typischen Körper,
- bessere Gesamt-Produktmetriken,
- keine weibliche Kontroll-Regression >0.30 cm im kritischen RMSE.

Die endgültige visuelle Beurteilung erfolgt durch direkten Vorher↔Repair-Vergleich in der App.
