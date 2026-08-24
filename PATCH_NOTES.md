# SAMMY v0.8.24.8 · Atlas Rest-Delta Hotfix

Basis: v0.8.24.7 (Profile/Section Hotfix bleibt vollständig erhalten).

Geändert:
- Atlas v2.4 bestimmt Rot/Blau jetzt ausschließlich aus dem ungeskinnten Rest-Mesh-Delta gegenüber der Referenz.
- Rot = signed normal displacement nach außen, Blau = nach innen.
- Die so ausgewählten Face-IDs werden anschließend auf dem pose-synchronen Display-Mesh gerendert.
- Kleine Rig-/Skinning-Mitbewegungen können dadurch nicht mehr großflächig als Surface-Expansion erscheinen.
- Front/Side/Back, feste Bodenreferenz, Skelett-Inset rechts unten, 8-mm-Rig-Schwelle und Bulk-Atlas-ZIP bleiben erhalten.
- Bulk-Atlas-Manifest und Dateinamen sind auf Atlas v2.4 aktualisiert.

Nicht geändert:
- Solver24 / PROT-v2 / Messdefinitionen.
- Profile-/Section-Algorithmus aus v0.8.24.7.

Testfälle:
1. Buttocks Volume Incr: Farbe sollte primär Gesäß/Becken/oberer Oberschenkel betreffen, nicht Rücken und ganze Beine.
2. Breast Dist / Cupsize: lokale Brustfärbung; Rig praktisch neutral.
3. Height: Surface-Farbe zurückhaltender als bei lokalen Volumenmorphs; strukturelle Änderung primär im Rig sichtbar.
4. FULL JSON: profileCoverage/topSection separat kontrollieren, um den v0.8.24.7 Section-Fix zu validieren.
