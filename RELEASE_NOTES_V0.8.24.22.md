# SAMMY v0.8.24.22 — MEAS Stability Gate v1.3

Basis: v0.8.24.21. Kein Bootstrap-, Atlas-, Section-, PROT-Definitions- oder Solver24-Umbau.

## Ergebnis Gate v1.2
- Neck, Neck Base, Thigh und Tibiale bleiben stabil.
- Shoulder-Path selbst ist topologisch plausibel (`pathToChord` ca. 1.01–1.06), aber zwei Shoulder-Length-Stressfälle bleiben deutlich außerhalb der Invarianzgrenze.
- Die Deep-Geometrie zeigt zugleich: In beiden Fällen bewegt sich die Schulteroberfläche nur minimal, während der alte Acromion-Operator den nächstgelegenen *Vertex* zum RightArm-Joint auswählt. Damit kann der Acromion-Punkt zwischen diskreten Schulter-Vertices springen.

## Acromion v0.8.24.22
- Acromion bleibt semantisch der zur Armwurzel nächstgelegene Punkt der `shoulder`-Oberfläche.
- Die Auswahl erfolgt jetzt kontinuierlich auf Dreiecksflächen statt diskret auf dem nächstgelegenen Vertex.
- Primär werden Dreiecke verwendet, deren drei Vertices zur Shoulder-Region gehören; 2/3-Region-Triangles dienen nur als Fallback an Regiongrenzen.
- Dadurch bleiben PROT-Landmark und echte Meshoberfläche erhalten, ohne Vertex-Branch-Sprünge.

## Gate v1.3
- Die bisherigen 12 Stressfälle bleiben erhalten.
- `biacromial_breadth` und `upperarm_length` werden zusätzlich erfasst, weil beide denselben Acromion-Landmark verwenden.
- Im männlichen Upperarm-Length-Stressfall muss zusätzlich Biacromial Breadth stabil bleiben.
- Im weiblichen Upperarm-Shoulder-Muscle-Stressfall müssen zusätzlich Biacromial Breadth und Upperarm Length stabil bleiben.
- Shoulder-Path-Ratio-Guard bleibt erhalten.

## Deep MEAS Patch v1.3
Nach bestandenem Gate werden jetzt 7 Maße billig über die gespeicherten Deep-Referenzen und Single-Samples neu gemessen:
- biacromial_breadth
- neck_circumference
- neck_base_circumference
- thigh_circumference
- tibiale_height
- shoulder_length
- upperarm_length

Rig, Mesh, Sections und Atlas werden nicht wiederholt. Alte Deep-Interaction-Residuals dieser 7 Maße bleiben für Solver V2 ausgeschlossen.
