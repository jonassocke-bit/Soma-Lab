# Sammy v0.8.20.3 · Influence Lab

## Scope

The accepted PROT/MEAS geometry is unchanged. This build starts the next phase: determine how Sammy's available logical sliders/parameters affect the frozen 24 ANSUR-compatible mesh measures.

## 5-phase run

1. Reference bodies — 2/4/6 bodies depending on Quick/Standard/Deep.
2. Five-level slider sweep — every retained logical solver slider is tested at exactly five levels. Symmetric L/R morphs are changed together.
3. Influence matrix — per measure: effect range, signed slope, linear fit R², Primary/Secondary/Minor ranking, and nonlinearity flag.
4. Interaction pass — only slider pairs that influence overlapping measures are screened; only non-additive pairs are deep-tested.
5. Multi-body stability / holdout validation — deterministic mixed bodies test whether the local influence model generalizes away from the reference bodies.

Standard is the recommended first complete run: 4 reference bodies × 5 levels, adaptive interactions, 1,200 global bodies, 220 holdouts.

## Measurement-Lab prior

Older completed Measurement-Lab calibration runs remain in IndexedDB. They are not mixed into the new data. After phase 3 the app compares overlapping old/new effects and reports direction agreement and median slope ratio. This uses the old work as a prior without treating the old measurement definitions as current truth.

## Output

- On-screen 24-row influence overview with the top three slider effects per measure.
- Primary / Secondary / Minor influence class.
- `↝` marker for low linear R² / likely non-linear effects.
- Summary JSON and full run JSON; full runs remain resumable in IndexedDB.

## Mobile guard

Browser page zoom by double tap is disabled in app mode (`viewport maximum-scale=1` plus `touch-action: manipulation`). Three.js canvas gestures remain handled by the canvas/OrbitControls path.
