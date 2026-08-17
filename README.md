# SOMA Browser PoC v0.1.3

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


## v0.1.3 – persistenter Asset-Cache

- Große SOMA-Daten werden jetzt in einer stabil benannten IndexedDB (`SomaLabAssetCache`) gespeichert.
- Der Cache ist bewusst nicht an die App-Version gekoppelt. Ein in v0.1.3 gespeichertes `SOMA_neutral.npz` wird von späteren Soma-Lab-Versionen wiederverwendet.
- Der 27,5-MB-Shape-Download wird nach dem ersten erfolgreichen Laden aus dem persistenten Cache gelesen.
- Auch der Procedural-Rig-Sidecar nutzt dieselbe Cache-Schicht.
- Künftige große Assets/Rig-Packs sollen über `fetchAssetBytes()` geladen werden und damit automatisch denselben versionsübergreifenden Cache verwenden.
- Ist ein gecachtes Shape-Asset beschädigt, löscht Soma-Lab nur dieses Asset und lädt es genau einmal frisch.
- Wenn der Browser `navigator.storage.persist()` unterstützt, fordert Soma-Lab persistenten Site-Speicher an.

Grenze: Ein App-Versionswechsel löscht den Cache nicht. iOS/Safari kann Website-Daten aber weiterhin entfernen, wenn Website-Daten manuell gelöscht werden, privates Browsen verwendet wird oder das System Site-Daten unter Speicherknappheit bereinigt.
