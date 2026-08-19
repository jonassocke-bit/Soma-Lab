# Sammy v0.7.1

Measurement Calibration v2.

- MEAS camera composition shifted so the complete T-pose sits higher above the bottom sheet.
- Calibration is UNISEX by default. Male/female rows become overrides only after an explicit sex switch; UNI returns to common calibration.
- Existing v0.7.0 calibration is migrated automatically, and the supplied calibration export is baked as the factory migration seed.
- 28 visible calibration/control measures: the earlier Body-Lab ANSUR-linked/derived set, its MakeHuman diagnostic extras, plus stature and Crotch Height.
- Selected-row calibration controls now expand directly beneath that measure: position, symmetric breadth/depth correction where relevant, review buttons, comment, reset, and info.
- Chest/waist/hip/shoulder breadth corrections move both endpoints symmetrically.
- Bubble edge insertion now previews while dragging and pushes neighboring bubbles apart, including insertion between two docked bubbles. Fling/velocity and safe-area clamping remain enabled.

The proven Axis16 -> transported native-Anny basis -> exact Anny FK/LBS path remains frozen.
