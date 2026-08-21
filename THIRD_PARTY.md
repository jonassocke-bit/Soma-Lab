# Third-party runtime note

v0.5.4 dynamically loads `@comfyorg/fbx-exporter-three` 1.0.1 only when the Mixamo Bridge export button is pressed.

Package: @comfyorg/fbx-exporter-three  
License: MIT  
Purpose: browser-side binary FBX serialization of a Three.js SkinnedMesh, Skeleton and Bones.

The library is not bundled into this ZIP; it is loaded on demand from esm.sh.

## ANSUR II public anthropometric data · BODY SPACE / Prediction Lab

`ansur-bodyspace-pca-v1.json`, `ansur-prediction-trainval-v1.json` and `ansur-prediction-test-v1.json` are derived numerical datasets computed from the public 2012 U.S. Army Anthropometric Survey (ANSUR II) working databases published by the U.S. Army / Natick Soldier Research, Development and Engineering Center (NSRDEC): 4,082 male and 1,986 female subjects.

The BODY SPACE file contains derived 3D PCA coordinates/transform metadata plus a compact sex-specific physical-weight locator for projecting the current Sammy body into the same PCA space. The prediction files contain only the fields required for the statistical research. Original Subject IDs and unrelated demographic fields are not bundled.

The prediction split is deterministic and sex-stratified: 4,247 train, 909 validation and 912 test persons. The test partition is physically separate so Run A cannot load it.

Public database information: Defense Centers for Public Health – Aberdeen, Anthropometric Database / ANSUR II.

## Sammy-only ANSUR→DIMENSIONS bridge · v0.8.14

`ansur-dimensions-bridge-v1.json` is **not** ANSUR source data. It is a compact derived model built from Sammy's corrected 6,000-body calibration corpus to provide seven Sammy-only/proxy dimensions needed by the frozen 31-measure R5 construction path. The bridge uses sex-specific input-domain alignment and bounded outputs to avoid edge-case extrapolation. These seven values are explicitly excluded from ANSUR truth scoring.
