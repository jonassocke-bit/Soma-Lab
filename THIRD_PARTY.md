# Third-party runtime note

v0.5.4 dynamically loads `@comfyorg/fbx-exporter-three` 1.0.1 only when the
Mixamo Bridge export button is pressed.

Package: @comfyorg/fbx-exporter-three
License: MIT
Purpose: browser-side binary FBX serialization of a Three.js SkinnedMesh,
Skeleton and Bones.

The library is not bundled into this ZIP; it is loaded on demand from esm.sh.
