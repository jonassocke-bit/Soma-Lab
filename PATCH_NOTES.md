# SAMMY v0.8.24.7 · MORPH OBSERVATORY PROFILE HOTFIX

Basis: v0.8.24.6

Geänderte Dateien:
- `app.js`
- `index.html`

## Zweck
Reparatur der im v0.8.24.6-Quick weiterhin vollständig leeren Morph-Observatory-Querschnitte (`topSection: null`, Sections 25/50/75 % = null).

## Änderungen
- Section-Extractor arbeitet primär mit echter Low-LOD-Triangle/Plane-Intersection an der SOMA-Segmentachse statt nur mit Vertices in einem breiten Slice.
- Anatomischer Segmentfilter + geometrischer Zylinder um die jeweilige Arm-/Beinachse verhindern, dass gegenüberliegende Extremität oder Rumpf in den Schnitt geraten.
- Adaptive Slab-Fallback nur dann, wenn die Low-LOD-Triangulierung an einer Schnittebene zu wenige Schnittpunkte liefert.
- Kompakte Fehlerdiagnostik wird nur bei weiterhin fehlgeschlagenen Sections unter `raw.sections.<segment>._debug` persistiert.
- `profileCoverage` wird pro male/female/neutral Track in die Taxonomie geschrieben, damit nach einem Quick sofort sichtbar ist, ob der Extractor tatsächlich arbeitet.
- Section-Delta und Pair-Interaction ignorieren Debug-Metadaten explizit.

## Erwarteter Quick-Test
Nach einem neuen Quick sollte `analysis.byTrack.<track>.profileCoverage.morphsWithSection` deutlich > 0 sein; bei funktionierender Geometrie im Regelfall für fast alle Morphs. `topSection` sollte insbesondere bei Lower/Upper Arm/Leg Morphs nicht mehr `null` sein.

Solver24, PROT-v2, Atlas v2.3 und Solver-Policies wurden nicht verändert.
