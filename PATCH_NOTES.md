SAMMY v0.8.24.16 · Atlas v2.8 · PROT-State Debug + Leg Section Pose Sync

Basis
- v0.8.24.15
- Bootstrap / PROT / Solver24 / Morph-Observatory analysis logic are not restructured.
- Existing v0.8.24.13/14/15 completed Observatory runs remain load-compatible for Atlas testing.

Changed files
- app.js
- index.html

1) Leg section pose-sync fix
- v2.7's section guard compared section/triangle intersection points to the nearest LOW-LOD VERTEX.
- On coarse leg triangles a perfectly valid intersection can lie ~35–50 mm from the nearest vertex, creating false SECTION CHECK FAILs.
- v2.8 removes that invalid nearest-vertex criterion.
- The posed LOW mesh is now taken directly from the ACTUAL displayed geometry:
  - LOW display: direct geometry copy.
  - MID display: exact lod_mid_to_low mapping from displayed MID vertices back to LOW vertices.
  - old secondary skinning code remains fallback only.
- Section pose-sync is therefore validated against the same geometry that is actually on screen.

2) PROT is now the measurement reference in the Atlas
- Sections remain a Morph-Observatory diagnostic in fixed T-pose.
- The ANSUR measurement is no longer misleadingly projected onto the T-pose as though it used that pose.
- For relevant male/female atlases, a separate PROT strip is added per MIN/REF/MAX state.
- The strip applies the actual ANSUR24-PROT-v2 MeasurementState and renders the canonical measure there.
- Limb mapping:
  upperarm -> upperarm_circumference -> arm_flexed_forward
  lowerarm -> forearm_circumference -> arm_flexed_forward
  upperleg -> thigh_circumference -> thigh_special
  lowerleg -> calf_circumference -> lowerleg_10cm
- Breast morphs prioritize chest_breadth -> chest_breadth_measure.
- Torso morphs use their leading chest-related PROT measure when present.
- Neutral remains geometric only and gets no PROT strip.

3) Manifest diagnostics
- Stores section pose source, PROT measure id/value/state/view/surface rule/unresolved caveats.
- Bulk export schema/version updated to sammy-morph-atlas-v2.8.

No new Quick is required for this Atlas-only validation patch.
Recommended checks using the existing completed run:
- male Lowerleg Scale Depth
- male Upperleg Scale Depth
- male Lowerarm Muscle
- male Upperarm Muscle / Scale Vert
- female Breast Dist

Expected result
- 25/50/75 leg sections render instead of false ~35–50 mm SECTION CHECK FAILs.
- PROT strip visibly uses the protocol pose rather than the T-pose.
