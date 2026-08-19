# Sammy v0.6.5

Camera/bubble behavior correction built on v0.6.4.

## Exact calibrated cameras

The three user-supplied camera setups are now used **directly** as reference
values instead of being re-derived from guessed bounding-box percentages:

- Standing Greeting
- normal editing view
- Animation panel view

Both camera position and `OrbitControls.target` are preserved, so the supplied
pan / camera height is part of the preset. FOV is fixed to 32° and camera zoom
to 1.0 for these presets.

For different mannequin sizes, only the **vertical Y coordinates** of camera
position and orbit target are scaled with current rest-body height relative to
the canonical default body. X/Z remain the calibrated offsets, matching the
requested behavior.

The CAM panel now also reports current body height, the captured camera reference
height, and the resulting Y scale.

## Animation camera return

Opening Animation stores the *actual current camera state* immediately before
the panel opens. Leaving Animation (closing it or switching directly to another
menu) smoothly restores exactly that saved camera position/target/zoom/FOV.
It no longer forces the generic editing-start preset.

## Bubble grouping

Bubble grouping is now inferred geometrically every time from edge + proximity,
rather than relying on a one-time group state. Therefore bubbles can:

- snap together;
- be dragged together along an edge;
- detach by pulling one away / to another edge;
- later be brought back and snap together again repeatedly.

Viewport and iPhone safe-area clamping from v0.6.4 remains active for single
bubbles and groups.

## UI

Only one panel can be open at a time. The normal greeting/start status box stays
hidden; only actual startup errors may surface as a toast above the app.
