# Sammy v0.8.26.5 — Morph ↔ Messebene Alignment Lab 1.0

## Zweck
Dieser Lauf prüft eine klar getrennte Hypothese: Ein vorhandener Anny-Morph kann seine größte geometrische Wirkung einige Zentimeter neben der kanonischen ANSUR-Messebene entfalten. Dann kann ein Solver den Zahlenwert an der Protokollebene treffen und trotzdem eine sichtbare Ausbeulung direkt daneben erzeugen.

## Wissenschaftliche Trennung
- `ANSUR24-PROT-v2` bleibt unverändert und weiterhin kanonische Referenz.
- Das Alignment Lab erzeugt **keine neue ANSUR-Definition**.
- Es scannt ausschließlich eine diagnostische `Solver Shape`-Schicht um die kanonische Ebene.
- Pro Ausgangskörper wird die kanonische Ebene zuerst fest gelockt. Die anschließenden Morph-Probes dürfen die Referenzebene nicht mitverschieben.

## Quelle
- genau die fünf bereits verbrauchten Pragmatic-Repair-Fälle,
- bevorzugt deren fertige v0.8.26.4-Repair-Form,
- keine neue ANSUR-Testzeile,
- Prediction-Reserve bleibt 902.

## Regionen
### Brust / Thorax
Band: -6 bis +6 cm um die kanonische Chest-Point-Ebene.
Metriken: Umfang, Breite, Tiefe.
Probes: Dorsi, Pectoral, V-Shape, Torso Horizontal, Torso Depth, Bust Circ, Underbust Circ; bei Frauen zusätzlich Breast Distance, sofern vorhanden.

### Taille / Bauch
Band: -8 bis +8 cm um Omphalion/Navel.
Metriken: Umfang, Breite, Tiefe.
Probes: Waist Circ, Torso Horizontal, Torso Depth, Stomach Tone und testweise `stomach-pregnant-incr` unter dem neutralen Namen **Abdominal Projection**.
Die Abdominal-Projection-Probe berichtet zusätzlich `Depth / Width`-Wirkverhältnis.

### Oberschenkel
Band: -4 bis +12 cm entlang Hip→Knee ab der kanonischen Gluteal-Furrow-Ebene.
Metrik: Umfang.
Probes: Thigh Circ, Upperleg Fat, Muscle, Horizontal Scale, Depth Scale.

### Oberarm
Band: ±8 cm entlang der Oberarmachse ab der kanonischen Biceps-Point-Ebene.
Metrik: Umfang.
ANSUR bleibt Flexed-Referenz; der Shape-Band-Vergleich ist deshalb ausdrücklich diagnostisch.

## Auswertung
Für jedes Zielmaß werden protokolliert:
- Fehler an der kanonischen Ebene,
- beste Zielnähe innerhalb des Nachbarbands,
- Offset dieser Ebene,
- Verbesserung in Prozent.

Für jeden Morph werden protokolliert:
- Probe-Schritt,
- Ableitung in cm pro Slider-Einheit auf jeder Ebene,
- Offset des maximalen Wirkungsbetrags,
- Verhältnis der Maximalwirkung zur Wirkung an der kanonischen Ebene.

Zusätzlich wird je Region ein gewichtetes Morph-Wirkzentrum und dessen Streuung berechnet. Große Streuung bedeutet: eher `Envelope/Band` als eine einzelne verschobene Ebene.

## Wichtig
Dieser Lauf ändert Solver V2, Proof 1.6, Reliability, Statistical Prefit oder ANSUR-Messoperatoren nicht. Eine neue Solver-Shape-Ebene wird erst dann eingeführt, wenn Zielnähe und Morph-Wirkzentrum auf mehreren Körpern konsistent zusammenfallen.
