# SAMMY v0.8.24.23 — MEAS Stability Gate v1.4 / Full-Repair Sweep Fix

Base: v0.8.24.22.

## Why this patch exists
The first full Deep MEAS Repair (2,888 reference/single rows, 7 repaired measures) was finite and export-complete, but a sweep over the complete repair table exposed branch switches that the 12-case Gate v1.3 did not exercise. Examples included a Neck loop collapsing on an extreme neck-up state, Neck Base selecting a small secondary contour under torso/bust changes, and Thigh re-projecting the detected gluteal-furrow sample to a different longitudinal `t`.

## Measurement geometry changes
- Neck Circumference and Neck Base Circumference now use `outer-centered-largest-v1` component selection. Axis containment remains a plausibility cue, but cannot force a tiny centered fragment to win over the larger plausible anatomical contour.
- The connected-slice engine records candidate circumferences, center offsets and the selected policy for audit/debugging.
- Thigh Circumference now uses the detector's own normalized gluteal-furrow `t` (`0.075..0.155`) instead of re-projecting the approximate sampled mesh point. Both detector `t` and projected `t` remain in metadata.
- Shoulder Harness / continuous Acromion from v0.8.24.22 is unchanged. Its result benefits indirectly from the stable Neck Base contour because Trapezius is derived from the same slice.

## Gate v1.4
- Keeps all Gate v1.3 cases.
- Adds stress cases discovered only by the complete 2,888-row repair sweep: Neck-up/Neck-height, Neck Base under torso-depth and bust extremes, Thigh under valgus/vertical scaling, and the female-heavy-soft minimum-height shape.
- Every tested shape now has geometry guards for:
  - Neck outer-component selection,
  - Neck Base outer-component selection,
  - Thigh landmark `t` range,
  - Shoulder path/chord sanity.

## Deep MEAS Patch v1.4
- Still remeasures only the same 7 affected targets across the stored Deep references + single samples.
- Export status is `PASS` only when all values/deltas are finite **and** all geometry guards pass on every repaired row.
- Summary now includes `geometryGuardFailures`, `allGeometryGuardsSane`, and the observed Thigh landmark-`t` range.

## Unchanged
- Boot/startup path
- Morph Observatory sampling / completed Deep source run
- Atlas v2.9
- Profile Sections
- ANSUR24-PROT-v2 definitions / MeasurementStates
- Solver24
- Interaction rows from the old Deep remain excluded for these 7 repaired measures unless separately remeasured.
