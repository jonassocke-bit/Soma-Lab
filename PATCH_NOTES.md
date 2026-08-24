SAMMY v0.8.24.6 PATCH
Basis: v0.8.24.5 FULL

Geänderte Dateien:
- app.js
- index.html

MORPH OBSERVATORY v1.2
- Rig-Klassifikation nutzt jetzt parent-relative Joint/Bone-Änderung, Segmentlängen und Schulter-/Hüftgelenk-Breite statt maxJoint-Drift allein.
- Kleine Joint-Drifts werden als incidental behandelt; lokal dominante Morphs werden nicht mehr wegen ~5 mm Drift automatisch structural/rig.
- Quick/Standard: Kontextabhängigkeit = nicht geprüft (statt irreführend 0).
- Neutral/Mid-Shape bleibt Mesh/Rig/Profile/Atlas-Diagnostik; keine ANSUR24-Auswertung, keine Pair-/Interaktionshypothesen.
- Limb-Profile 25/50/75 %: Vertex-Selektion auf anatomische Region + Seite umgestellt; der bisher zu strikte dominant-bone==start-joint Filter wurde entfernt.

ATLAS v2.3
- Signed Mesh Delta direkt auf sichtbaren Meshflächen: Rot = entlang Referenz-Normale nach außen, Blau = nach innen.
- Alte rote Projektions-/Kontur-Heatmap wird nicht mehr verwendet.
- Front/Side/Back verwenden denselben Darstellungsmaßstab; Side wird nicht mehr separat größer gefittet.
- Feste gemeinsame Bodenreferenz bleibt erhalten.
- Rig-Inset rechts unten; Rot erst ab 8 mm parent-relativer Strukturänderung. Absolute Joint-Drift wird separat nur als Zahl gezeigt.
- Neuer Export „Alle Atlanten ZIP“: alle verfügbaren Mann/Frau/Neutral-Atlas-JPEGs + manifest.json in einer ZIP; Abbruch durch erneuten Klick möglich.
- Atlasbilder bleiben außerhalb der FULL-JSON.

Solver24/PROT-v2 wurden nicht verändert.
