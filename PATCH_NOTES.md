SAMMY v0.8.24.19 · MEASUREMENT STABILITY GATE v1

Basis
- v0.8.24.18 FULL / Morph Observatory v1.4 / Atlas v2.9
- Deep source run used for stress-case selection: morphobs-2026-08-25T18-38-29-505Z-byuqx

Geänderte Dateien
- app.js
- index.html

Nicht verändert
- ANSUR/PROT definitions and MeasurementStates
- Morph Section v2.1 engine
- Atlas v2.9
- Solver24 policy / objective
- Deep Rig/Mesh/Profile data

Measurement geometry stabilization
1. Neck Circumference
   - connected-component plane slice around the neck axis
   - neck + neckBase skin partitions may jointly close the tape loop
   - infrathyroid level remains the canonical PROT landmark level
2. Neck Base Circumference
   - discrete largest-drop branch selection replaced by a soft/regularized transition search
   - reviewed +1.6 cm vertical audit correction remains preserved
3. Thigh Circumference
   - Gluteal Furrow search uses a smoothed/regularized posterior transition instead of one largest one-step drop
   - strict RIGHT_THIGH slice and connected-component selection
4. Tibiale Height
   - landmark is stabilized on the medial proximal RIGHT_CALF partition with a weighted local surface point
   - prevents jumps to another leg surface branch
5. Shoulder Length
   - PROT Harness path retained
   - local ray hits receive continuity/deviation guards with a deterministic local-surface fallback

MORF · new MEAS Gate
- 12 targeted stress cases selected from the completed Deep run
- specifically reproduces the old ~9 cm thigh jumps, ~1.8 cm tibiale jumps,
  ~5.8 cm neck-base jumps, ~2–4 cm shoulder jumps and male-heavy-soft neck null
- exports Sammy_MEASURE_STABILITY_GATE_*.json

MORF · Deep MEAS Patch
- available after a PASS gate
- remeasures only 5 corrected operators for stored male/female Deep references + single-morph records
- does NOT recompute Rig, Mesh, Profiles, Atlas or the full Deep interaction grid
- exports Sammy_DEEP_MEASURE_REPAIR_<sourceRunId>.json
- old interaction residuals for these 5 repaired measure rows are explicitly marked unusable for Solver V2
