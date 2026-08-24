SAMMY v0.8.24.13 — BOOT ROLLBACK + PROFILE SECTION v2.1 + ATLAS v2.5

Basis:
- app.js wurde bewusst auf den pre-Section-Stand v0.8.24.9 zurückgesetzt (v0.8.24.8 war auf iPhone/Safari nachweislich startfähig).
- Atlas v2.5 Display-Rest-Delta bleibt enthalten.

Boot-Sicherheit:
- Kein dynamic import und kein neuer Section-Code wird beim App-Start geparst/ausgeführt.
- Profile Section v2.1 ist eine separate klassische JS-Datei und wird erst beim Klick auf MORF Start nachgeladen.
- index.html zeigt bei einem echten Startfehler zusätzlich Dateiname + Zeile + Spalte.

Profile Section v2.1:
- 25/50/75% aus realer Low-LOD Meshregion-Ausdehnung.
- Arme entlang T-Pose-X, Beine entlang Y.
- Nur region-eigene Triangles/Vertices dürfen in den Schnitt eingehen.
- topSection wird auf das semantisch passende Segment beschränkt.
- profileCoverage enthält expected/complete + bySegment.
- Pair sectionInteraction wird auf die zu den beiden Morphs passenden Segmente beschränkt.

Unverändert:
- Solver24 / PROT-v2 / ANSUR-Messoperatoren.
