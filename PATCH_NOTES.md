SAMMY v0.8.24.10 PATCH

Basis: v0.8.24.9
Geänderte Dateien:
- app.js
- index.html

MORPH OBSERVATORY v1.3 · PROFILE/SECTION FIX v2
- 25/50/75-%-Querschnitte werden nicht mehr über SOMA-Rig-Head-Positionen im Rest-Mesh zentriert.
- Stattdessen wird pro Extremitätenregion die tatsächliche Low-LOD-Mesh-Ausdehnung verwendet:
  - Ober-/Unterarm entlang der T-Pose-X-Achse
  - Ober-/Unterschenkel entlang der Y-Achse
- Schnittkanten müssen zur jeweiligen Mesh-/Skin-Region gehören; dadurch sollen andere Körpersegmente nicht mehr als Ersatzquerschnitt einspringen.
- Adaptiver Region-Slab bleibt nur als Fallback.
- topSection wird nur noch aus dem semantisch passenden Segment des Morphs gewählt (z. B. lowerarm-Morph -> lowerarm, calf/lowerleg -> lowerleg).
- profileCoverage zählt jetzt nur Morphs, für die ein Profil semantisch erwartet wird, und weist Coverage zusätzlich pro Segment aus.
- Pair sectionInteraction wird auf die zum Paar passenden Extremitätensegmente begrenzt.
- Alte 0.8.24.8/0.8.24.9 Observatory-Runs werden nicht als aktuelle v1.3-Analyse fortgesetzt; für die neuen Section-Werte ist ein neuer Quick nötig.

ATLAS
- Atlas v2.5 Display-Rest-Delta-Hotfix aus v0.8.24.9 bleibt enthalten.

Nicht verändert:
- Solver24
- PROT-v2
- ANSUR24-Messdefinitionen
