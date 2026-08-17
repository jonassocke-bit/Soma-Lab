# SOMA Browser PoC v0.1.2

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


## v0.1.2

- Punkt 4 repariert: Der Procedural-Sidecar liegt im offiziellen NVlabs-GitHub-Repository unter `assets/` und nicht am bisher verwendeten Hugging-Face-Root-Pfad.
- Offizielle Quelle für den Rig-Vertrag auf Commit `86632764684281dc98f31ab9c4aac36a4cdbc428` gepinnt.
- Korrektes JSON-Feld verwendet: `public_rig_derivation.main_joint_names`.
- Prüft jetzt explizit 78 Public-Rig-Namen (inkl. Root) und 122 Template-Joints aus dem Sidecar.
- Das große `SOMA_template_rig.usda` wird weiterhin nicht vollständig heruntergeladen.
- Safari-Fehleranzeige für den Rig-Test verbessert, damit künftig auch die eigentliche Fehlermeldung sichtbar bleibt.
