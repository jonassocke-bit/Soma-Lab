## v0.8.4 Solver-Whitelist Calibration

- Calibration Lab scannt jetzt nur noch den aus Quick + Deep Schritt 1 abgeleiteten Body-Solver-Raum (mit aktuellem Anny-Pack ca. 61 statt 202 logische Slider).
- Ausgeschlossen aus der automatischen Kalibrierung: kompletter Kopf/Gesicht, Hände, Füße, Unterschenkel/Knie sowie reine Manual-/Special-Parameter. Die Morphs bleiben in FORM vollständig verfügbar.
- `stomach-pregnant` ist Special und wird nie als normaler Körpermaß-Solverparameter verwendet. Phenotype/Firmness bleiben manuell.
- Sichere Redundanzen werden nicht erneut gescannt: `upperlegs-height` (Measure Upperleg Height bleibt), `lowerarm-scale-horiz` (Measure Lowerarm Length bleibt), `upperarm-scale-depth/vert` (semantische Armumfang-/Muscle-/Fat-Regler bleiben).
- Global Sampling/Validation verwendet dieselbe Solver-Whitelist; ausgeschlossene Core-Parameter wie Firmness werden dort nicht mehr zufällig verändert.
- Eigene IndexedDB `sammy-calibration-lab-v084`, damit alte 202-Slider-Läufe nicht versehentlich fortgesetzt werden.
- Brust bleibt auf dem in v0.8.3 bestätigten Nipple-Morph-Landmark; Intro-Kamera bleibt 1 s vor Clipende.

## v0.8.3 Nipple Landmark + Early Intro Camera

- Brustumfang/-breite/-tiefe nutzen für Männer und Frauen dieselbe semantische Messebene aus Annys `nipple-point-incr` / `nipple-size-incr` Morph-Vertices.
- Die frühere lokale Bust-Peak-Suche wurde als aktive Messlogik entfernt; Legacy-Chest-Offets verschieben die neue Nipple-Ebene nicht.
- Sichtbare MEAS-Landmarks zeigen die erkannten linken/rechten Nipple-Patches.
- Die Kamera beginnt ca. 1,0 s vor Ende des Greeting-Clips in Richtung Bearbeitungs-/Baumodus zu fahren, also noch während Sammy winkt.
- Calibration Lab / L/R-Kopplung / Pair-Screening bleiben ansonsten unverändert.

# Sammy v0.7.3

Measurement Calibration v2.

- MEAS camera composition shifted so the complete T-pose sits higher above the bottom sheet.
- Calibration is UNISEX by default. Male/female rows become overrides only after an explicit sex switch; UNI returns to common calibration.
- Existing v0.7.0 calibration is migrated automatically, and the supplied calibration export is baked as the factory migration seed.
- 28 visible calibration/control measures: the earlier Body-Lab ANSUR-linked/derived set, its MakeHuman diagnostic extras, plus stature and Crotch Height.
- Selected-row calibration controls now expand directly beneath that measure: position, symmetric breadth/depth correction where relevant, review buttons, comment, reset, and info.
- Chest/waist/hip/shoulder breadth corrections move both endpoints symmetrically.
- Bubble edge insertion now previews while dragging and pushes neighboring bubbles apart, including insertion between two docked bubbles. Fling/velocity and safe-area clamping remain enabled.

The proven Axis16 -> transported native-Anny basis -> exact Anny FK/LBS path remains frozen.


## v0.7.3 – MEAS validation round 2
- adult-only Anny age mapping (shape 0.70–1.00, displayed approximately 16/19–70 years)
- anatomical search windows for upper arm, forearm, calf, ankle and buttock/hip extrema
- separate Natural Waist minimum alongside ANSUR Omphalion waist
- brighter/clickable measure overlays and optional landmark labels
- Random Person / Random Extreme restricted to adult age shapes


## v0.8.0 Calibration Lab
- basiert direkt auf der funktionierenden v0.7.3; Startup/Loader/Anny/SOMA/Rig/FORM/ANIM bleiben unverändert
- Oberarm-Maximum weiter distal; Halsumfang höher; Halsbasis dynamisch am Hals→Trapez-Übergang
- mehrstufiger Live-Kalibrierungslauf: Referenzen → Einzelslider → Relevanz → Interaktionen → Global Sampling → Validierung
- Quick / Standard / Deep in derselben App; LIVE ist Standard, Turbo optional
- Fortschritt/Records werden nach jedem Test in IndexedDB gespeichert und sind fortsetzbar
- strukturierter `sammy-calibration-lab-v1` JSON-Export mit stabilen Slider-/Maß-IDs, Rohwerten, cm-Maßen, Interaktionsresiduen und Validierungsdaten


## v0.8.1 Calibration Lab R2
- auf v0.8.0 aufgebaut; Startup/Loader/Anny/SOMA/Rig/FORM/ANIM unverändert
- weiblicher Brustumfang sucht dynamisch das Umfangsmaximum innerhalb der Brustzone; Breite/Tiefe teilen dieselbe Ebene
- Hip Breadth ist vom Buttock-Maximum entkoppelt und sucht höher in der oberen Becken-/Hüftzone
- alle passenden `l-`/`r-` Anny-Morphs werden im Calibration/Solver-Raum als ein logischer symmetrischer L+R-Slider behandelt
- Standard: alle plausiblen Sliderpaare werden einmal billig gescreent; nur Paare über dem Nichtlinearitäts-Schwellwert erhalten den tiefen Interaction-Scan
- Quick screent nur die stärksten Kandidaten, Deep screent alle Kandidaten auf mehr Referenzen/Kombinationen
- Redundanzkandidaten werden anhand ähnlicher 30-dimensionaler Wirkungssignaturen markiert, aber noch nicht automatisch entfernt
- getrennter Summary- und FULL-JSON-Export; FULL behält Solver-Rohdaten, Summary bleibt für schnelle Analyse kompakt

## v0.8.2 Calibration Lab R3

- Weiblicher Brustumfang: erster deutlicher lokaler Umfangs-Peak beim Scan von der natürlichen Taille nach oben; Achsel-/Schultermaximum kann nicht mehr gewinnen.
- Neuer Sammy-Hüftumfang auf exakt derselben höheren Beckenebene wie Hip Breadth; Gesäßumfang bleibt getrennt am Buttock-Maximum.
- Oberarm-/Bizepsumfang auf engen mittleren Oberarmbereich begrenzt (Schulteransatz und Ellenbogen ausgeschlossen).
- Calibration Lab R2-Strategie (symmetrische L/R-Logik, Pair-Screening, Deep-only-if-needed) bleibt unverändert.
