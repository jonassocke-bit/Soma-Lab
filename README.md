# Sammy v0.6.4

Small calibration/polish release on top of v0.6.2.

## Camera calibration button

A small `CAM` button is shown in the top-right corner after startup.

It opens a live camera readout containing:

- camera position X/Y/Z;
- camera Euler rotation X/Y/Z in degrees;
- OrbitControls target X/Y/Z;
- orbit distance (the practically relevant "zoom" value for the current
  perspective-camera setup);
- `camera.zoom`;
- field of view.

The values update live while the panel is open and can be copied with one tap.
This is intended to make future start/edit camera calibration exact rather than
iterative screenshot guessing.

## Splash

- Splash now displays the Sammy version.
- Fade-out is longer and eased (~1.05 s).
- The old compact startup toast is suppressed while the splash is active; the
  splash itself carries the loading-stage text.
- Error toasts can still appear immediately.

## Smile

The user identified the correct Anny modifier:

`mouth angles up = 0.8`

v0.6.4 uses exactly that semantic modifier (case/spacing tolerant) and no longer
tries to guess among several smile/corner candidates. If the modifier is absent,
the face remains neutral and a warning is logged.

## Frozen infrastructure

Animation retarget, transported native-Anny bone basis, exact Anny FK/LBS,
greeting import, animation library and skeleton mode remain unchanged.
