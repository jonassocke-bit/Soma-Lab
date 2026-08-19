# Sammy v0.6.2

UI/polish release on top of the iPhone-tested v0.6.1 start/animation path.

## Start presentation

The Standing Greeting remains bundled.

Changes:

- the splash stays in front until the **first greeting frame has already been
  applied**;
- the greeting camera is farther out and intentionally shows head + torso +
  enough body to read the pose, rather than the previous extreme close-up;
- the compact "BEGRÜSSUNG" loading toast is closed once the greeting finishes.

### Subtle smile

Sammy now tries to apply a small smile using **semantic Anny local modifiers**.
It searches the loaded Anny pack for modifiers containing `smile` or explicit
mouth/lip-corner-up semantics and uses only a low value.

If the installed Anny pack contains no semantic smile modifier, Sammy leaves the
face neutral. There is deliberately no arbitrary vertex-warp hack.

## Skeleton mode

The body is now replaced temporarily by a flat, unlit, FrontSide-only ghost
material (~16% opacity). This reduces the layered/dark transparent interior
look.

The stable-topology head-shell filter is also more aggressive about suppressing
inward-facing head triangles. The goal is to keep the live skeleton readable
without showing the internal mouth/head cavity.

The normal body material and original mesh index are restored when the skeleton
view is disabled.

## Animation mini player

The Animation panel can now be dragged down to about one control row.

Below ~138 px it snaps to an 86 px **mini player** containing:

- previous animation;
- play/pause;
- next animation.

Dragging the top grip upward expands the full panel again. The chosen height is
persisted.

## Animation library

The file picker now supports multiple `.fbx`, `.npy` and `.npz` files.

- the first successfully imported animation starts immediately;
- all imported animations appear in a list lower in the panel;
- tapping a row activates and plays it;
- `×` removes an animation;
- long-press a row and drag it vertically to reorder the list;
- previous/next in the mini player follows this order.

The library is intentionally in-memory for v0.6.2. Persisting large FBX-derived
motion arrays to IndexedDB is a separate next step so storage quotas and cache
eviction can be handled explicitly.

## Frozen technical path

The proven Axis16 → transported native-Anny bone basis → exact Anny FK/LBS
retarget path is unchanged.
