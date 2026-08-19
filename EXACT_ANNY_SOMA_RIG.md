# Exact Anny/SOMA morph-rig path — v0.5.21

## Problem fixed

v0.5.20 adapted only public joint positions to the morphed body and kept SOMA
template rotations. On the default target this already produced ~15° mean chain
direction change and nearly 30° at a thumb segment. The visible result was a
different neutral posture: arms, knees, trunk and thumb no longer matched the
Mixamo/Axis16 reference.

## Official model mirrored

Pinned Anny:
`72104cac8242d1735ec06433b65bec5e26953ce7`

Configuration:
`rig="soma", topology="soma", pose_parameterization="local-ref"`

Browser v3 exports/reconstructs:
- rest vertices
- blendshape coefficients
- rest bone heads
- cached Procrustes orientation covariance
- orientation blendshapes
- ChildOffsetOrientationRefiner data
- reference bone orientations
- SOMA bone hierarchy
- Anny SOMA skinning weights

## Why local-ref is the right bridge

The Mixamo converter already produces, per public bone, the relative world-delta

`D_parent^-1 * D_child`.

For a SOMA reference orientation `O`, this is exactly the transform convention
used by Anny's `local-ref` pose parameterization. Therefore there is no extra
manual "make Anny look like Mixamo first" pose to guess: Anny's canonical
reference-orientation layer performs that normalization as part of the model.

## Browser validation

Two coefficient sets are evaluated by official Anny during the GitHub Action.
Their 78 rest-bone poses are stored in the v3 pack. The browser reconstructs the
same poses from the exported linear rig engine and checks maximum matrix error
before enabling the exact morph path.

Status before user test:
- JavaScript syntax: static validated
- extractor Python syntax: static validated
- workflow YAML: static validated
- v3 GitHub Action: NOT YET RUN
- iPhone exact morph-rig path: NOT YET PROVEN
