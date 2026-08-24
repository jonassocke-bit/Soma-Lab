SAMMY v0.8.24.12 · BOOT-SAFE PROFILE ENGINE + ATLAS v2.5

Basis/Strategie:
- Bootstrap-Position auf die nachweislich funktionierende v0.8.24.9/v0.8.24.0-Struktur zurückgesetzt.
- Der Profile/Section-v2-Code liegt nicht mehr im großen app.js-Startmodul, sondern in morph-sections-v2.js.
- morph-sections-v2.js wird erst beim Klick auf MORF Start dynamisch geladen. Ein Profile-Fehler kann den normalen Sammy-Start daher nicht mehr blockieren.

Profile/Sections:
- 25/50/75%-Schnitte aus realen Low-LOD-Regionsextents.
- Armsegmente entlang der T-Pose-X-Achse, Beinsegmente entlang Y.
- Nur regionseigene Dreieckskanten tragen zum Schnitt bei.
- Left/Right werden separat geschnitten und danach gemittelt.
- Adaptive Slab-Fallbacks + kompakte Debugdaten bei Fehlschlag.
- topSection/Pair-Section-Auswertung aus v1.3 bleibt auf semantisch passende Segmente begrenzt.

Atlas:
- Atlas v2.5 Display-Rest-Delta bleibt enthalten.
- Rot = Rest-Mesh nach außen, Blau = nach innen; pose-synchron auf demselben Displaymesh.

Boot-Diagnose:
- index.html markiert Import/Parse/Promise-Startfehler direkt im Splash, statt endlos nur „Körpermodell wird vorbereitet …“ zu zeigen.

Unverändert:
- Solver24
- ANSUR24-PROT-v2
- Mass/Composition
