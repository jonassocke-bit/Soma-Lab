# Motion import

Browser-native:
- SOMA/NVIDIA `.npy`: `[frames,78|94,4,4]`
- SOMA converter `.npz`: `poses [frames,77|78,3]`, optional `joint_names`,
  optional `root_translation`.

The current NVlabs/SOMA-X project provides conversion tools for SMPL, MHR and
AMASS motions to SOMA. Its AMASS converter exports `poses`, `root_translation`
and `joint_names`, so those converted NPZ files are the preferred motion-library
bridge for this browser interface.

FBX/BVH/Mixamo are not directly retargeted yet; they should go through a
dedicated skeleton-to-SOMA converter rather than using guessed joint rotations.


## Direct Mixamo FBX import (v0.5.7)

Use the FBX downloaded after uploading `Sammy_Mixamo_XBotContract65.fbx` to
Mixamo. The file can now be selected directly in Sammy.

Recommended Mixamo download:
- FBX Binary
- With Skin
- 30 fps
- Keyframe Reduction: None
- In Place when appropriate

The FBX is parsed locally in Safari; it is not uploaded by Sammy.
