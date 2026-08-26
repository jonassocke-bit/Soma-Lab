# SAMMY v0.8.24.24 — MEAS Stability Gate v1.5 / PROT Infrathyroid Anchor Fix

Base: v0.8.24.23.

## Why this patch exists
Gate v1.4 reduced the full-repair failures to two Neck Circumference cases: `Neck Trans Up` on the female heavy/soft reference and `Measure Neck Height` on the female neutral reference. Both cases passed the connected-component guard, but the tape level itself drifted because the Infrathyroid surface proxy was re-projected back onto the Neck1→Neck2 axis.

The PROT landmark implementation already defines the Infrathyroid level at 42% from Neck1 to Neck2. On sparse/deformed meshes the sampled front-neck proxy can sit several millimetres above/below that canonical level. Reusing its projected `t` moved the measurement plane under vertical neck translation/length morphs and created false circumference changes even though the atlas shows predominantly vertical neck motion.

## Measurement geometry change
- Neck Circumference now uses the canonical PROT axis level `t = 0.42` directly.
- The sampled Infrathyroid surface proxy is retained only as audit metadata (`sampledLandmarkT`) and no longer controls the tape plane.
- Existing strict-neck region filtering and `outer-centered-largest-v1` connected-component selection remain unchanged.
- Stability metadata now reports `anchorSource = prot-neck-axis-42pct`.

## Gate v1.5
- Keeps all 20 Gate v1.4 stress cases and their existing magnitude invariants.
- Adds an explicit `infrathyroid_anchor_t` geometry guard requiring the Neck Circumference operator to remain on PROT `t = 0.42` for every tested shape.
- Global Deep MEAS Repair guards now include the same Infrathyroid anchor check on every repaired row.

## Deep MEAS Patch v1.5
- Still remeasures the same 7 targets across the stored Deep references + single samples.
- Export status remains PASS only when all values/deltas are finite and all geometry guards pass.
- No old Deep interaction residual is re-enabled for the seven repaired measures.

## Unchanged
- Boot/startup path
- Morph Observatory sampling and stored Deep source run
- Atlas v2.9 / Profile Sections
- ANSUR24-PROT-v2 measurement definitions and MeasurementStates
- Neck Base, Thigh, Tibiale, Shoulder/Acromion fixes from v0.8.24.23
- Solver24
