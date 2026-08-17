# SOMA Browser PoC v0.1

Standalone iPhone/browser feasibility test for NVIDIA SOMA-X.

This deliberately does not modify BODY LAB.

Tests:
1. Direct anonymous download of `SOMA_neutral.npz` from NVIDIA's public Hugging Face repository.
2. Browser-side NPZ/NPY parsing.
3. Low-LOD SOMA mean body render.
4. Real 128-component SOMA PCA shape reconstruction in JavaScript.
5. Public rig/procedural sidecar reachability and joint contract.
6. Explicitly stops before claiming pose support: actual LBS requires a compact extraction of hierarchy, bind transforms and skinning weights from `SOMA_template_rig.usda`.

No MakeHuman code is used.
