# Sammy v0.8.24.1 · MORPH OBSERVATORY v1.1

## Zweck

Inkrementelles Update auf Basis von v0.8.24.0. Solver24, ANSUR24-PROT-v2 und die bestehende Messpipeline bleiben unverändert. Dieses Update verbessert ausschließlich die Morph-Beobachtung und ihre visuelle/semantische Trennung vor dem späteren hierarchischen Solver.

## 1. Sex Split zuerst

Die automatische Taxonomie wird nicht mehr aus gemeinsam gepoolten männlichen und weiblichen Samples erzeugt.

Für jeden Morph entstehen zuerst getrennte Track-Analysen:

- `male`
- `female`
- `neutral` als interpolierter `gender=0.5` Mid-Shape **nur zur geometrischen Diagnose**

Erst danach erzeugt `crossSex` einen Vergleich. Dieser darf Unterschiede sichtbar machen, aber nie Mann/Frau zu einer gemeinsamen Morphwirkung mitteln.

### Neutral-Lock

Neutral ist **kein drittes anthropometrisches Geschlecht** und wird nicht zur Kalibrierung eines männlichen oder weiblichen Effekts benutzt. `Cupsize`, `Firmness` und Breast-Morphs bleiben weiblich-spezifisch und werden im Neutral-Track nicht gesweept.

## 2. Quick zuerst, Groß/Deep danach

Der Default ist jetzt **Quick**.

Quick:
- 3 Levels
- neutrale männliche, weibliche und Mid-Shape-Referenz
- Pair-Hypothesen separat je Track
- maximal 6 Paarhypothesen je Track
- dient als Smoke-/Semantiktest für die neue Pipeline

Groß / Deep:
- 5 Levels
- zusätzliche Weight/Muscle-Kontexte getrennt für Mann/Frau
- mehr Paarchecks und Kontextabhängigkeitsprüfung
- soll erst nach erfolgreicher Quick-Sichtprüfung gestartet werden

## 3. Atlas v2

Der bestehende 3×3-Aufbau bleibt erhalten:

- Zeilen: Min / Referenz / Max
- Spalten: Front / Side / Back

Neu pro Zelle:

1. **Mannequin** auf ungefähr 20 Graustufen quantisiert.
2. **Rote Surface-Delta-Kontur**: binäre, geometrisch aus Vertexverschiebungen abgeleitete Markierung gegenüber der Referenz; keine pseudo-präzise Farb-Heatmap.
3. **Kompaktes SOMA-Skelett** direkt daneben.
4. Joints/Bones ab ca. 0,75 mm Bewegung werden rot, unveränderte Struktur bleibt grau.
5. `RIG max` und Worst-Joint bleiben numerisch lesbar.

Der Atlas wird weiterhin nur on demand erzeugt und als kompaktes JPEG exportiert. Bilder und Rohvertex-Deltas werden nicht im Summary/FULL-JSON gespeichert.

## 4. Track-spezifische Pair-Hypothesen

Coupled-axis-, redundant-, composition-alternative- und same-region-Kandidaten werden jetzt innerhalb eines Tracks vorgeschlagen. Ein Paar wird also nicht deshalb gekoppelt oder redundant, weil ein gemittelter Mann/Frau-Effekt ähnlich aussieht.

Depth/Horizontal bleibt weiterhin:
- getrennte Raw-DOFs,
- aber als `coupled-axis candidate` prüfbar,
- ohne vorzeitige Solver-Fusion.

## 5. Cross-Sex-Vergleich

Für Morphs, die bei Mann und Frau vorliegen, werden u. a. verglichen:

- Rollen-/Klassenübereinstimmung
- Cosine Similarity der 24 ANSUR-Wirkungsvektoren
- Verhältnis der maximalen Rigwirkung
- Übereinstimmung des stärksten Zielmaßes

Status:
- `stable`
- `divergent`
- `sex-specific`

Neutral wird nur zusätzlich angezeigt, nicht in die Stabilitätsentscheidung eingemittelt.

## 6. Was absichtlich unverändert bleibt

- Solver24 v0.8.23-Verhalten
- ANSUR24-PROT-v2 MeasurementStates
- Production-MEAS/PROT
- bestehende Exclusion-/Solver-Policies, einschließlich Lower-Leg-Ausschlüssen
- Raw Weight × Muscle wird nicht physiologisch umgedeutet

## Quick-Abnahme vor Groß/Deep

- [ ] App startet als v0.8.24.1 ohne Bootfehler.
- [ ] MORF steht standardmäßig auf Quick.
- [ ] Referenzen zeigen Mann, Frau und neutralen Mid-Shape getrennt.
- [ ] Ergebnis-Tabs Mann/Frau/Neutral/Vergleich funktionieren.
- [ ] Breast/Cupsize/Firmness erscheinen nicht im Neutral-Track.
- [ ] Pair-Kandidaten enthalten einen `track` und werden je Track geprüft.
- [ ] Summary/FULL enthalten `analysis.byTrack` und `analysis.crossSex`.
- [ ] Atlas v2 lässt Mann/Frau/Neutral getrennt wählen.
- [ ] Atlas zeigt Mannequin + SOMA-Skelett nebeneinander.
- [ ] Referenzzeile hat keine rote Delta-Kontur.
- [ ] Lokale Soft-Tissue-Morphs zeigen wenig/keine rote Rigbewegung.
- [ ] Strukturelle Morphs markieren die tatsächlich bewegten Joints/Bones rot.
- [ ] Atlas-JPEG bleibt außerhalb des JSON.
- [ ] iPhone/Safari: keine Mehrfachdownloads/Bildflut; ein Atlas = ein JPEG.

Wenn dieser Quick-Lauf sauber ist, ist der nächste sinnvolle Schritt ein **Groß / Deep**-Lauf und erst danach die Ableitung der neuen Solver-Hierarchie.
