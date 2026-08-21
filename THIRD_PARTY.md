# Third-party runtime note

v0.5.4 dynamically loads `@comfyorg/fbx-exporter-three` 1.0.1 only when the
Mixamo Bridge export button is pressed.

Package: @comfyorg/fbx-exporter-three
License: MIT
Purpose: browser-side binary FBX serialization of a Three.js SkinnedMesh,
Skeleton and Bones.

The library is not bundled into this ZIP; it is loaded on demand from esm.sh.

## ANSUR II public anthropometric data · BODY SPACE v0.8.12

`ansur-bodyspace-pca-v1.json` is a derived visualization dataset computed from the public 2012 U.S. Army Anthropometric Survey (ANSUR II) working databases published by the U.S. Army / Natick Soldier Research, Development and Engineering Center (NSRDEC): 4,082 male and 1,986 female subjects. The app bundle contains only the derived three-dimensional PCA coordinates plus the transform metadata required for later projection; it does not include the original demographic fields or participant Subject IDs.

Public database information: Defense Centers for Public Health – Aberdeen, Anthropometric Database / ANSUR II.

## ANSUR II public anthropometric data · Prediction Lab v0.8.13
`ansur-prediction-trainval-v1.json` and `ansur-prediction-test-v1.json` are compact, physically separated derived numerical datasets built from the same public ANSUR II male/female CSV sources used for BODY SPACE. It contains only sex code, deterministic split code, age, weight and the subset of body dimensions required for the ANSUR prediction research. The original subject IDs and non-anthropometric demographic fields are not bundled into this derived file.
