# Sammy v0.6.1

Polish release on top of the iPhone-proven Sammy v0.6.0 animation/retarget path.

## Bundled start greeting

The supplied `Standing Greeting.fbx` is included as `standing-greeting.fbx`.
It uses the current Mixamo/XBotContract65 skeleton and is parsed by Sammy with
the same proven Axis16 import path as user animations.

Startup flow:

1. full-screen Sammy splash hides asset loading;
2. Anny/SOMA Mid + morphable Sammy initialize;
3. the greeting clip is prepared locally;
4. splash fades out;
5. greeting plays exactly once;
6. the clip blends with quaternion slerp into frame 0, used for the initial
   editing stance for now;
7. camera glides from upper-body greeting framing to the editing view.

The greeting does not occupy the user's animation slot.

## Skeleton view

- exact-Anny pose now refreshes the debug skeleton every animation frame;
- skeleton gets the same Anny display/ground Y offset as the surface;
- skeleton lines and joints render through the body;
- body automatically switches to about 18% opacity;
- normal material is restored when skeleton view is closed;
- transparent mode uses FrontSide rendering;
- an additional stable-topology head-shell filter suppresses strongly
  inward-facing triangles inside the head region, intended to remove the
  distracting inner mouth/head cavity from the transparent view.

## Camera infrastructure

v0.6.1 adds smooth camera tween presets:
- greeting: upper body;
- edit: full body.

The same infrastructure can later be reused for torso/waist/leg/head
measurement editing.

## Frozen infrastructure

The successful Axis16 → transported native-Anny frame → exact Anny FK/LBS
retarget path is otherwise unchanged.
