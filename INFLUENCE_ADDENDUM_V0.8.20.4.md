# Sammy v0.8.20.4 · PROT-24 Overlay + Influence Addendum

## Scope
This is a narrow calibration follow-up to the accepted v0.8.20.2/0.8.20.3 geometry. No landmark or measurement algorithm was changed.

## 1. INFL viewport
The Influence Lab no longer draws the generic 31-measure Measurement-Lab overlay. It draws only the frozen `ANSUR24-PROT-v1` target set.

For reviewed PROT display geometry, the viewport uses `sammyProtocolStrictMeasureGeometry()` where available (including reviewed neck-plane display tilt/offset); otherwise it falls back to the same canonical result line returned by `sammyComputeAllMeasures()`.

Turbo still suppresses live lines for speed.

## 2. Solver whitelist correction
The v0.8.20.3 Deep run excluded four semantic morphs because broad region exclusions ran first:

- `local:measure-wrist-circ-incr`
- `local:measure-ankle-circ-incr`
- `local:measure-calf-circ-incr`
- `local:measure-lowerleg-height-incr`

All four directly correspond to frozen target dimensions and are now explicitly retained before the hands/feet/lower-leg exclusion rules. `local:measure-knee-circ-incr` stays excluded because Knee Circumference is not one of the 24 targets.

## 3. Addendum run
`INFL → Addendum · 4 Ziel-Slider` reuses the best completed canonical base run in IndexedDB (Deep preferred). It does not repeat the 19,632-record Deep run.

The addendum:

- reuses the base reference bodies and base single-effect matrix;
- runs only the four newly retained sliders at 5 levels on the base reference bodies;
- screens only interaction pairs that touch one of those four sliders;
- deep-tests at most 36 non-additive patch pairs;
- runs 160 compact mixed global samples and 50 holdouts, forcing a patch slider into every mixed sample;
- stores the addendum as a separate run linked by `baseRunId`.

With a six-reference Deep base, the fixed single sweep is 120 mesh tests. Even if all possible patch interactions survive relevance filtering, the complete addendum is capped at roughly 868 tests, far below the previous 19,632-record Deep run.

The addendum is intentionally marked `solverEligible:false`: it is not a standalone replacement for the Deep base. Solver Matrix v1 must merge base + addendum rather than accidentally training on the small patch dataset alone.

## Audit / safety
- `ANSUR24-PROT-v1` remains frozen.
- No accepted PROT landmark/measure geometry is modified.
- Existing v0.8.20.3 Deep records remain untouched.
- Old Production-Solver discovery explicitly ignores addendum-only runs.
