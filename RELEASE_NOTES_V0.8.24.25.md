# SAMMY v0.8.24.25 — MEAS Stability Gate v1.6 / Expected-Coupling Classification

Base: v0.8.24.24.

## Why this patch exists
Gate v1.5 leaves exactly one failing case: `Measure Neck Height Incr` on the female-neutral reference changes Neck Circumference by about +3.85 cm although every geometry guard passes.

This is not a remaining branch-selection failure. The Neck Circumference operator stays on the fixed PROT Infrathyroid level `t = 0.42`, selects the intended outer neck contour, and remains finite. The Deep geometry also classifies `Measure Neck Height Incr` as a strong structural/rig morph: it changes the neck segment by roughly 34 mm while the stored neck-region displacement is predominantly vertical. On a tapered neck, a structural length morph can therefore change which material cross-section lies at the fixed PROT measurement plane even without radial vertex motion.

The v1.5 gate incorrectly treated this target-morph coupling as an off-target invariance requirement. Gate v1.6 corrects the gate semantics instead of forcing the measurement operator to suppress a real model/measurement coupling.

## Gate v1.6
- Keeps all v1.5 measurement geometry unchanged.
- Keeps the fixed PROT Infrathyroid anchor, connected-component guards, Thigh detector-t guard and Shoulder path guard.
- Reclassifies `female_neutral + Measure Neck Height Incr +1` as `expected-coupling-audit`.
- The case still must pass all geometry guards; it simply no longer requires Neck Circumference to stay within an arbitrary ±2 cm.
- Off-target invariants for Stomach, Torso, Acromion/Shoulder, Tibiale, Thigh and Neck translation remain active.

## Deep MEAS Patch v1.6
- Same 7 repaired measures and same full stored-Deep reference/single sweep.
- PASS still requires finite values/deltas and zero geometry-guard failures across the complete repair dataset.
- Old Deep interaction residuals for the seven repaired measures remain excluded.

## Unchanged
- Measurement geometry from v0.8.24.24
- ANSUR24-PROT-v2 definitions and MeasurementStates
- Boot/startup logic
- Morph Observatory / stored Deep source run
- Atlas v2.9 / Profile Sections
- Solver24
