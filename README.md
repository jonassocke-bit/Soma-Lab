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
