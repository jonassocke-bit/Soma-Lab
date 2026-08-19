# Sammy v0.7.0

Quality/UI correction built on v0.6.5.

## Multi-animation import fixed

The diagnostic JSON identified the concrete failure: `sammyRenderAnimationLibrary()`
called an undefined `escapeHtml`, so imported entries existed (the count could rise)
but rendering the rows threw a ReferenceError. v0.7.0 adds the missing escaping helper
and makes batch import robust per file. All selected FBX/NPY/NPZ files are parsed first;
the first successful entry is then activated and played. One failed file no longer aborts
the rest of the batch.

The diagnostics version field was also stale (`0.6.3`) and now reports `0.7.0`.

## Animation controls

The previous/Play-Pause/next transport row is now visible at all animation-panel
heights, not only in compact mode. The duplicate Stop/Resume button was removed.
Skeleton remains a separate full-width action.

When the panel is collapsed to its minimum height, the panel becomes significantly
more transparent while the transport controls stay readable.

## Bubble physics

Bubbles retain the repeatable edge/group snap logic from v0.6.5 and add inertial
release behavior:

- release in the middle: a spring-like pull visibly accelerates the bubble to an edge;
- flick/throw: the measured release velocity influences direction and travel;
- positions are clamped every animation frame to viewport + iPhone safe areas;
- landing runs the normal edge/group resolver, so bubbles can snap together again;
- an already grouped chain can be flicked/slid along its current edge;
- grabbing a moving bubble immediately cancels its inertia.

## Frozen infrastructure

The transported native-Anny retarget path, exact Anny FK/LBS, calibrated camera
behavior and greeting path are unchanged.


## v0.7.0 - Measurement Calibration v1

The new `MEAS` bubble opens a dedicated anthropometric calibration workspace.
Opening it stores the current pose and camera, switches the body to the internal
Axis16/SOMA T-pose, and frames the complete body from the front. Closing the
panel restores the exact previous pose and camera; a previously running user
animation is resumed.

The first calibration set contains the ANSUR-II variables/targets used in the
previous body-engine planning: stature, biacromial breadth, chest circumference,
chest breadth/depth, waist circumference/breadth/depth, buttock circumference,
hip breadth and crotch height. No unverified hip-depth variable is added.

Circumferences are generated from exact triangle/plane intersections. Sammy then
uses the convex hull of the planar section as a tape-measure path, so narrow
concavities such as breast cleavage or the gluteal cleft are bridged instead of
being followed by the tape.

Every adjustable measure has a single position slider. Lines are deliberately
not draggable in 3D. Calibration is stored separately for male and female Anny
endpoints, with independent offsets, review status and comments. Each row shows
an info button plus the *other* sex symbol for direct A/B switching while the
selected measurement and camera remain unchanged.

The Export button writes `sammy-measure-calibration-v1` JSON containing both sex
calibrations, measure definitions, comments/status, last measured snapshots,
current shape state and geometry/debug metadata. This is intended to be sent
back and baked into the next Sammy version.

ANSUR naming is aligned with the public ANSUR-II database. The in-app explanatory
texts are concise paraphrases linked to the Measurer's Handbook
NATICK/TR-11/017 and remain explicitly reviewable during calibration.
