# SOMA Browser PoC v0.1.1

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

## v0.1.1

- iOS/Safari-sichere NPY-Payload-Kopie mit ausgerichtetem ArrayBuffer.
- Bounds-Check für abgeschnittene NPY-Payloads.
- Unterstützt `fortran_order=True` durch Konvertierung in C-Reihenfolge; das war der konkrete Abbruchpunkt in v0.1.
- Fehler nennen jetzt das betroffene `.npy`-Array.
