SAMMY v0.8.24.18 · MORPH OBSERVATORY v1.4 · DEEP GATE

Basis: v0.8.24.17 FULL / Atlas v2.9

Geänderte Dateien:
- app.js
- index.html

Deep-Gate-Korrekturen:
1. Deep verwendet für lokale Morphs alle vier Kontexte je Geschlecht: neutral, heavy/soft, heavy/muscular, light/low-muscle; Neutral-Mid bleibt reiner Diagnose-Track.
2. Weiblich-spezifische Brust/Cupsize/Firmness-Morphs verwenden im Deep alle vier weiblichen Kontexte.
3. Deep-Paarinteraktionen werden in allen vier Kontexten je Geschlecht geprüft (pairRefs 4 statt 2).
4. topSection/profileSegments werden für Morphs ohne semantisch erwartete Extremitäten-Section korrekt als N/A/null geführt.
5. Pair-sectionInteraction liefert bei Paaren ohne relevantes Extremitätensegment N/A statt zufällige Arm-/Bein-Sections (z.B. Torso Depth × Horizontal).
6. Cross-Sex Minimum-Effect-Gate: <0.10 cm maximale Messwirkung und <2 mm strukturelle Rigwirkung => weak/inconclusive statt künstlich divergent.
7. Taxonomie-Schema auf v1.4 / Cross-Sex v1.3 angehoben.

Nicht geändert:
- Boot/Runtime-Start
- PROT-v2 Messdefinitionen
- Section-v2.1 Geometrie
- Atlas-v2.9 Rendering/PROT-Zoom
- Solver24

Deep-Ziel:
Ein einziger vollständiger Deep-Lauf mit 5 Levels, vollständigen Composition-Kontexten, 54 Paarhypothesen je Mann/Frau-Track und Interaktionstests in allen vier Kontexten pro Geschlecht. Danach FULL JSON + kompletter Atlas v2.9 als Basis für Solver V2.
