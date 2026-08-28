# SOLVER SHAPE LAYER 1.0 · v0.8.26.6

## Zweck
v0.8.26.6 setzt die Evidenz aus dem Morph↔Messebene Alignment Lab 1.0 erstmals als **separate Solver-Shape-Schicht** um. Die kanonischen ANSUR24-PROT-v2-Operatoren und Zielwerte bleiben unverändert. Shape-Bänder sind zusätzliche Optimierungsmerkmale für die sichtbare Avatarform und werden nicht als ANSUR-Messungen umbenannt.

Der Test verwendet ausschließlich die fünf bereits verbrauchten Real-ANSUR-Fokusfälle. Es werden keine neuen held-out Personen konsumiert; die 902 Zeilen der späteren Prediction-Endreserve bleiben unangetastet.

## Quelle und Plane Lock
- Quelle: letzter vollständiger `sammy-morph-measure-alignment-v1`-Lauf oder importierte vollständige Alignment-JSON.
- Pro Körper wird zunächst die fertige Repair-Ausgangsform geladen.
- Kanonisches ANSUR24 wird frisch vollständig gemessen.
- Danach werden vier räumliche Frames einmal auf der Ausgangsform fixiert: Brust, Taille/Bauch, rechter Oberschenkel, rechter Oberarm.
- Alle Shape-Layer-Probes desselben Körpers benutzen exakt diese Frames. Ein Morph darf seine eigene Messreferenz nicht mitverschieben.

## Shape-Features
### Thorax
- `Chest Circ · locked source plane`: Offset 0 der auf der Ausgangsform gelockten kanonischen ANSUR-Ebene, hohes Gewicht, 1.5 cm Dead Zone.
- `Chest Width · Shape Band`: Mittel der festen Offsets +2/+4/+6 cm.
- `Chest Depth · Shape Band`: Mittel der festen Offsets +2/+4/+6 cm.
- Shape-Band-Toleranz: Männer 1.6 cm, Frauen 1.9 cm; bei Frauen niedrigeres Gewicht, weil die kanonische Brust im Alignment bereits meist gut war.

Der Brustumfang bleibt im Shape-Objective bewusst an der **gelockten kanonischen Ausgangsebene**. Die echte dynamische ANSUR24-Messung wird nach der Torso-Stufe separat vollständig neu berechnet und ist der Regression-Guard. Breadth/Depth dürfen die bestätigte versetzte Morphwirkung nutzen.

### Taille / Bauch
- Waist Circumference / Width / Depth bei Offset 0 der gelockten kanonischen Ausgangsebene; die echte dynamische ANSUR24-Messung bleibt separat.
- `Upper Abdomen Width · Envelope`: Mittel von +2/+4/+6 cm; nur eine Obergrenze. Sie soll seitliche Wellen/Bulges verhindern, ohne eine neue ANSUR-Breite zu behaupten.
- Envelope-Cap = Ziel-Waist-Breadth + 3.0 cm mit 0.75 cm Dead Zone.

### Abdominal Projection
Der MakeHuman/Anny-Morph `stomach-pregnant-incr` wird solverintern ausschließlich als **Abdominal Projection** bezeichnet.

Er ist:
- positive-only `0..1`,
- kein Standard-Waist-Regler,
- nur verfügbar, wenn Taillenumfang >0.6 cm zu klein **und** Waist Depth >0.45 cm zu klein ist,
- außerdem nur, wenn die Taille nicht bereits >0.5 cm zu schmal ist.

Damit kann er die im Alignment nachgewiesene fast reine Tiefenprojektion nutzen, ohne eine schmale Taille als falschen Ersatz nach vorne zu drücken.

### Upper Thigh
- `Upper Thigh · Band Max`: Maximum des festen Bands −2/0/+2/+4/+6/+8/+10/+12 cm.
- Zielwert bleibt numerisch der beobachtete Thigh-Circumference-Wert, aber das Feature ist ausdrücklich ein sichtbarer Shape-Proxy und **nicht** die kanonische ANSUR-Furrow-Messung.
- 2.0 cm Dead Zone.

### Upper Arm
- `Upperarm Belly · Band Max`: Maximum −2/0/+2/+4/+6/+8 cm.
- Zielwert ist Upperarm Circumference als weiches Formsignal; wegen ANSUR `Biceps Circumference, Flexed` nur Gewicht 0.55 und 2.0 cm Dead Zone.

## Kandidaten
Torso:
- Dorsi
- Pectoral
- V-Shape
- Torso Horizontal
- Torso Depth
- Bust Circ
- Underbust Circ
- Waist Circ
- Stomach Tone
- Abdominal Projection, nur konditional

Thigh:
- direct Thigh Circ
- Upperleg Fat
- Upperleg Muscle
- Upperleg Horizontal
- Upperleg Depth

Upperarm:
- direct Upperarm Circ
- Upperarm Fat
- Upperarm Muscle
- Upperarm Horizontal

Die Bezeichnungen Horizontal/Depth bestimmen **nicht** die mathematische Richtung; die lokale Wirkung wird frisch am gelockten Mesh-Jacobian gemessen.

## Optimierung
- 3 Stufen: Torso → Thigh → Upperarm.
- max. 4 / 3 / 2 lokale Iterationen.
- jede Iteration baut einen frischen finite-difference Jacobian auf den Shape-Features.
- ridge-regularisierte Least-Squares-Lösung.
- Trust: lokale Morphs max. ca. 0.38 pro Iteration, Abdominal Projection 0.28.
- echte Mesh-Line-Search: 1.00 / 0.62 / 0.38 / 0.22 / 0.12 des berechneten Schritts.
- kein Core-DOF und keine ±115/130-%-Extrapolation in diesem Test. Ziel ist ausschließlich die Frage, ob die bereits vorhandenen lokalen Morphs durch eine passendere Shape-Schicht sinnvoller werden.

## Kanonische Regression Guards
1. Vor der Shape-Schicht vollständige ANSUR24-Neumessung.
2. Nach Torso vollständige ANSUR24-Neumessung.
3. Torso wird komplett zurückgerollt bei:
   - neuem Plausibility-Hard-Fail,
   - Critical RMSE > +0.28 cm,
   - Critical Max > +0.60 cm,
   - Chest/ Waist Circumference > +0.65 cm schlechter und danach >2 cm Restfehler.
4. Nach Thigh+Upperarm erneute vollständige ANSUR24-Neumessung mit demselben Guard relativ zum akzeptierten Torso-Checkpoint.
5. Bei finaler Regression wird exakt auf den akzeptierten Torso-Checkpoint zurückgerollt.

## Entscheidung
`USEFUL`:
- 5/5 gespeichert,
- mittlere Shape-Score-Verbesserung >=15%,
- typische Körper im Mittel >=10%,
- keine weibliche Critical-RMSE-Regression >0.25 cm.

`PARTIAL`:
- >=5% mittlere Shape-Verbesserung,
- keine weibliche Regression.

Sonst `NO-BENEFIT`.

Die Entscheidung ist ein Implementierungs-/Produktdiagnose-Gate, kein Ersatz für den späteren 10er Real-ANSUR-Sanity-Lauf.
