# SAMMY v0.8.19.0 · ANSUR Protocol / Pose Integration Audit

## Scope

Incremental change from v0.8.18.1. Measurement definitions, Appendix-G values, Landmark regions and the 24-target selection were not redefined. This release changes the pose implementation and diagnostics.

## Implemented

- Exactly 2 FBX-derived base poses: Standing and Sitting.
- 11 existing protocol states re-expressed as base + modifiers + conditions.
- 14 deterministic pose modifiers.
- 4 optional utility/future preview states: WBX, technical A-pose, seated arms-on-lap, seated right-hand-on-chest.
- Standing foot-separation constraint solved via public-joint FK rather than a fixed hip angle.
- Standing right-hand fist removed by left-to-right finger-pose mirror with neutral-open fallback.
- Sitting trunk/neck correction plus reproducible 90° forearm setup.
- Sitting seat + footrest visual aids.
- PROT preview controls do not contribute to audit completion.
- Protocol session now restores the previous relative pose, not only Euler slider state.
- Safari empty-image resource error fixed.
- Diagnostics version now matches app version.

## Structural checks

- `node --check app.js`: PASS.
- `ansur-protocol-v1.json`: valid JSON.
- 24 measures: every referenced pose exists.
- Every pose references an existing base pose and existing modifier IDs.
- Both FBX source files exist in repository root.
- All referenced protocol images exist.

## Manual acceptance still required

The FBX-derived posture must be visually inspected on the live Anny/SOMA mannequin on iPhone/Safari, especially:

1. Standing neck/head correction and Frankfurt suitability.
2. Mirrored right finger posture.
3. Standing foot-contact appearance after the joint-distance solver.
4. Sitting trunk/head correction.
5. Sitting knee/foot alignment and seat/footrest relationship.
6. Derived modifiers (hands-on-hips, wrist 90°, hand-on-chest, WBX) across random body shapes.

These are deliberately PROT audit items and are not silently promoted to production MEAS/R5.
