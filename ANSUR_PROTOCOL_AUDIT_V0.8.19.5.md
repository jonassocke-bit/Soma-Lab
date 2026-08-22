# SAMMY ANSUR PROTOCOL AUDIT · v0.8.19.5

## Scope
UI/review-layer update only. Existing strict MEAS region masks and native pose constraints are preserved.

## Implemented
- Unified header icons: previous, info, comment, correct, incorrect, random, next.
- Next is pinned to the far right.
- Info reference crop toggles on tap.
- Comments persist per landmark and measure; rows show a speech-bubble icon only when a comment exists.
- Landmark tab does not render measure geometry.
- Landmark markers are green/red/neutral by audit status; selected marker is larger with a white outline.
- Measure lines are thicker; selected line is ~2× normal radius.
- Measure rows and selected 3D label show an italic ANSUR reference mean plus the live mesh value.
- Reference population: full bundled ANSUR II public prediction dataset (6068 records), same sex, closest stature window. Starts at ±1 cm and expands to ±1.5/2/3/5 cm until at least 25 records are available.
- PROT panel is compactable to header-only.
- Bottom scroll footer retains measure/region/name toggles and Audit/Diagnostic exports.

## Static checks
- app.js passes `node --check`.
- index.html contains no duplicate IDs.
- 24 protocol measure IDs are present in the bundled ANSUR reference columns.
- GitHub package remains flat and below 100 files.
