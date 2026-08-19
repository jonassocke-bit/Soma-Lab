# Sammy v0.7.2

Semantic Measurement / Landmark iteration.

- Bakes the supplied 2026-08-19 Measurement Calibration v2 export as the fresh-install factory baseline.
- Calibration offsets now scale with current stature instead of remaining absolute centimeter shifts across differently sized random bodies.
- Chest breadth/depth/circumference share one chest plane; waist breadth/depth/circumference share one Omphalion/waist plane.
- Neck circumference and neck-base circumference use planes perpendicular to the current Neck1→Neck2 axis.
- Right-leg slices are isolated by anatomical side instead of the old ±16 cm rectangle.
- Calf circumference searches for the maximum right-calf section; ankle circumference searches for the minimum ankle section.
- Upper-arm circumference is now a Sammy geometric maximum on the right upper arm; a new forearm maximum circumference is added. Both remain clearly separated from pose-dependent ANSUR flexed measures.
- Torso height reuses the same Crotch landmark instead of owning an independent crotch offset.
- Visible semantic landmarks can be toggled in MEAS.
- Random Person and Random Extreme live inside the MEAS bubble menu, regenerate Anny bodies in T-pose, switch to all measurement overlays, and recalculate the full measurement set immediately.

The proven Axis16 → transported native-Anny basis → exact Anny FK/LBS path is otherwise left untouched.
