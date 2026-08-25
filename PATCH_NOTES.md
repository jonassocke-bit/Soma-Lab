SAMMY v0.8.24.15 PATCH

Basis
- v0.8.24.14
- normaler Bootstrap / App-Start nicht verändert
- Profile Section v2.1 Analyse nicht verändert
- Solver24 / PROT / ANSUR-Messoperatoren nicht verändert

Geänderte Dateien
- app.js
- index.html

Atlas v2.7
1. Pose-synchrone Sections
- 25/50/75%-Sections werden für die Anzeige nicht mehr aus dem unposierten LOW-Rest-Mesh projiziert.
- Nach der festen Measurement-T-Pose wird zusätzlich eine LOW-LOD-Posekopie aus currentPoseWorld + exakten Anny-Rest-Inversen + denselben LOW-Skinweights berechnet.
- Die sichtbaren Section-Ringe werden auf dieser LOW-Posekopie geschnitten.
- Die numerischen A/B/Umfang-Werte im Text bleiben aus dem Rest-Mesh, damit Analysewert und Darstellung sauber getrennt bleiben.

2. Export-Guard
- Jede sichtbare Section wird gegen Vertices desselben anatomischen Segments geprüft.
- Liegt eine Section >35 mm vom erwarteten Segment entfernt, wird sie nicht gezeichnet und als SECTION CHECK FAIL im Atlas/Manifest markiert.
- Damit sollen schwebende Arm-/Bein-Sections nicht mehr unbemerkt exportiert werden.

3. Thorax/Brust Debug
Bei Brust-/Torso-Morphs bzw. chest-relevanten Top-Maßen werden zusätzlich die aktuellen kanonischen Messgeometrien eingeblendet:
- weiß gestrichelt: chest_circumference
- grün: chest_breadth
- orange: chest_depth
- Werte stehen kompakt unten in der Kachel.
Neutral bleibt ohne ANSUR-Overlay.

4. Bestehendes bleibt
- Rot = Rest-Mesh nach außen, Blau = nach innen
- Skelett separat rechts unten
- feste T-Pose
- Bulk-Atlas-ZIP
- vorhandene v0.8.24.13/14 Observatory-Runs werden weiter geladen; kein neuer Quick nur für den Atlas nötig.
