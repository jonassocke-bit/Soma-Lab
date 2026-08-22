# Third-party runtime note

v0.5.4 dynamically loads `@comfyorg/fbx-exporter-three` 1.0.1 only when the Mixamo Bridge export button is pressed.

Package: @comfyorg/fbx-exporter-three  
License: MIT  
Purpose: browser-side binary FBX serialization of a Three.js SkinnedMesh, Skeleton and Bones.

The library is not bundled into this ZIP; it is loaded on demand from esm.sh.

## ANSUR II public anthropometric data · Prediction Lab

`ansur-prediction-trainval-v1.json` and `ansur-prediction-test-v1.json` are derived numerical datasets computed from the public 2012 U.S. Army Anthropometric Survey (ANSUR II) working databases published by the U.S. Army / Natick Soldier Research, Development and Engineering Center (NSRDEC): 4,082 male and 1,986 female subjects.

The prediction files contain only the fields required for the statistical research. Original Subject IDs and unrelated demographic fields are not bundled. No Body-Space/PCA visualization asset is shipped in v0.8.17.

The prediction split is deterministic and sex-stratified: 4,247 train, 909 validation and 912 test persons. The test partition is physically separate so Run A cannot load it.

Public database information: Defense Centers for Public Health – Aberdeen, Anthropometric Database / ANSUR II.

## Sammy-only ANSUR→DIMENSIONS bridge · v0.8.14

`ansur-dimensions-bridge-v1.json` is **not** ANSUR source data. It is a compact derived model built from Sammy's corrected 6,000-body calibration corpus to provide seven Sammy-only/proxy dimensions needed by the frozen 31-measure R5 construction path. The bridge uses sex-specific input-domain alignment and bounded outputs to avoid edge-case extrapolation. These seven values are explicitly excluded from ANSUR truth scoring.

## v0.8.19.0 · ANSUR Protocol Lab reference assets

The new `ansur-protocol-v1.json` and `ansur-page-*.jpg` assets are derived only from the user-provided copy of **NATICK/TR-11/017, Measurer’s Handbook: US Army and Marine Corps Anthropometric Surveys, 2010-2011**. The report itself states: “Approved for public release; distribution is unlimited.” Only pages needed for Sammy’s 24 current ANSUR-comparable targets and their source landmarks/standard postures are bundled. No ANSUR participant-level source rows are added by this feature.


## v0.8.19.0 · User-provided pose-source FBX files

`sammy-ansur-standing-source.fbx` and `sammy-ansur-sitting-source.fbx` are copies of the two FBX motion files supplied by the project user in this conversation. Sammy uses them only as local pose-source assets for the PROT audit layer. The app does not present them as ANSUR source material; the ANSUR posture requirements still come from NATICK/TR-11/017.
