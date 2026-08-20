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
