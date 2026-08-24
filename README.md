# Sammy v0.8.24.1 — MORPH OBSERVATORY v1.1

Inkrementelles Observatory-Update auf Basis von v0.8.24.0. **Solver24 und ANSUR24-PROT-v2 bleiben unverändert.**

Neu in MORF:

- **Sex Split zuerst:** Mann und Frau werden vollständig getrennt klassifiziert; erst danach folgt ein Cross-Sex-Vergleich.
- **Neutral / Mid-Shape:** `gender=0.5` als rein geometrischer Diagnose-Track; keine Mittelung in Mann/Frau. Female Breast/Cupsize/Firmness bleiben female-only.
- **Quick ist Default:** zuerst 3-Level-Smoke-Test; danach bei erfolgreicher Prüfung **Groß / Deep** mit 5 Levels und mehr Weight/Muscle-Kontextkörpern.
- **Pair-Kandidaten je Track:** Coupled-axis/Redundant/Alternatives werden nicht mehr aus einem gepoolten Mann/Frau-Effekt abgeleitet.
- **Atlas v2:** 3×3 Min/Referenz/Max × Front/Side/Back bleibt erhalten, jetzt mit 20-Graustufen-Mannequin, roter geometrischer Surface-Delta-Kontur und kompaktem SOMA-Skelett daneben. Bewegte Joints/Bones werden rot markiert.
- **Kompakter Export:** Atlas bleibt ein einzelnes JPEG on demand; keine Bilder oder Rohvertex-Deltas im JSON.

Details und Quick-Abnahmeliste: `MORPH_OBSERVATORY_V0.8.24.1.md`.
