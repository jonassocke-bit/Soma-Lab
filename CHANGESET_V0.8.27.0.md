# Changeset v0.8.27.0

- neuer offener `BODY FIT MINIMAL · PROTOTYPE 1.0`-Block oben im SOLV-Panel
- bisheriger Solver V2 / Real-ANSUR-Bereich als Forschungsarchiv nach unten verschoben/eingeklappt
- 5-Maße-Maske: Größe, Gewicht, Brust, Taille, Gesäß/Hüfte + Gender/Alter
- ANSUR train+validation nur noch als kNN64-Prior für Schulter, Schritthöhe, Taille-/Hüftbreite
- kleiner direkter Body-Fit statt 24-Maß-Inverssolver
- Volumen↔Gewicht-Rückkopplung mit permanent sichtbarer Avatar-Massenschätzung
- Frauenbrust von Anfang an separat: Auto + A–H, Unterbrust/Bust-Geometrie, Cup-Morph-Volumenproxy
- intuitive Makroregler für Fülle, Muskel, Bauchprojektion, Gesäß, Oberschenkel, Oberarme
- Export `Sammy_BODY_FIT_*.json` mit Inputs, Prior, Trace, Mesh-/Massenschätzung, Cupdaten und finaler Shape
- keine Änderung an den historischen ANSUR24-/Solver-V2-Forschungsalgorithmen
