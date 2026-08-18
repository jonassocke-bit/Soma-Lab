# Sammy Mixamo Bridge v0.1

This package creates the **canonical rigged FBX bridge** for the first real
Mixamo roundtrip test.

The generated character uses:

- canonical SOMA Low mesh: 4,505 vertices
- canonical SOMA Low triangles
- the **public 78-joint SOMA contract only**
- public SOMA skin weights
- no internal 122-joint/twist bones

The 122-joint target rig remains an internal Sammy runtime feature. After a
Mixamo animation is imported, Sammy will later regenerate those internal twist
joints from the public animation exactly as the current browser runtime already
does.

## One-time setup

1. Upload `build_sammy_mixamo_bridge.py` and `MIXAMO_BRIDGE_WORKFLOW.yml` to the
   Soma-Lab repository.
2. Create `.github/workflows/build-sammy-mixamo-bridge.yml` using the complete
   contents of `MIXAMO_BRIDGE_WORKFLOW.yml`.
3. GitHub -> Actions -> **Build Sammy Mixamo Bridge** -> Run workflow.
4. The Action writes these files into `mixamo_bridge/` and also provides them as
   a workflow artifact:
   - `Sammy_Mixamo_Bridge.fbx`
   - `Sammy_Mixamo_Bridge_manifest.json`

## First Mixamo roundtrip

Upload `Sammy_Mixamo_Bridge.fbx` via **Upload Character**. Adobe documents that
rigged FBX characters have their skeleton automatically mapped to Mixamo so
animations can be applied to the custom skeleton.

For the first test choose a clearly readable animation such as **Walking** and
use:

- Format: FBX Binary
- Skin: With Skin
- Frames per second: 30
- Keyframe Reduction: None
- In Place: ON if the selected animation offers it

Then download the animated FBX and upload that returned FBX into this ChatGPT
conversation. The returned file is the evidence we need to build the actual
Mixamo-FBX -> Sammy-motion converter against the real roundtrip rather than
against guessed bone conventions.

## Why a manifest is generated

`Sammy_Mixamo_Bridge_manifest.json` records the exact public joint order,
parents, bind transforms, coordinate conversion, bridge centering translation
and FBX hash. When the animated FBX comes back from Mixamo, the converter can
compare the returned skeleton against this canonical bridge.
