# Release Notes — v0.8.26.5

Neu: **Morph ↔ Messebene Alignment Lab 1.0**.

- Scannt Brust, Bauch/Taille, Oberschenkel und Oberarm um die kanonische ANSUR-Ebene.
- Lockt die Ausgangsebene vor jeder Morph-Probe.
- Testet nur lokale Morphs auf dem echten aktuellen Mesh.
- Nutzt einen schnellen Standing-State-Pfad statt 10 ANSUR-MeasurementStates pro Probe.
- Testet `stomach-pregnant-incr` nur diagnostisch als **Abdominal Projection**.
- Exportiert `Sammy_MORPH_MEASURE_ALIGNMENT_<runId>.json`.
- Verwendet die fünf bereits verbrauchten Pragmatic-Repair-Körper; 902 Prediction-Reservezeilen bleiben unangetastet.
- Kanonische `ANSUR24-PROT-v2`-Operatoren und Solver-V2-Mathematik bleiben unverändert.
