# SAMMY v0.8.24.21 — MEAS Stability Gate v1.2

Basis: v0.8.24.20. Kein Bootstrap-, Atlas-, Section-, PROT-Definitions- oder Solver24-Umbau.

## Ergebnis des Gate v1.1
Gate v1.1 beseitigte die bekannten Branch-Sprünge bei Neck, Neck Base, Thigh und Tibiale. Übrig blieben ausschließlich zwei Shoulder-Length-Fehler. Zusätzlich waren die v0.8.24.20 Shoulder-Baselines mit ca. 19–30 cm selbst unplausibel; Ursache war der neue geglättete Trapezius-Proxy.

## Shoulder Length v0.8.24.21
- Trapezius/Neck-lateral ist wieder der exakte laterale Punkt der stabilisierten Neck-Base-Slice; keine zusätzliche Mittelung Richtung Neck1/Shoulder.
- Der audit-locked Harness-Lab-Pfad bleibt erhalten: gerade Trapezius→Acromion-Referenz, 34 Samples, bidirektionale 90°-Surface-Probes.
- Die Kontinuitätsgrenze aus v0.8.24.19 bleibt als Branch-Guard erhalten.
- Stability-Metadaten enthalten jetzt `chordCm`, `pathToChord` und `endpointSource`.

## Gate v1.2
- Bestehende 12 Stressfälle bleiben identisch.
- Zusätzlich wird für jede Shape ein topologischer Shoulder-Sanity-Check ausgegeben: Surface-Path muss zwischen 0.995× und 1.35× des eigenen Trapezius→Acromion-Chords liegen.
- Diese Ratio ist nur ein Branch-/Topologie-Guard und kein anthropometrisches Ziel.
- Deep MEAS Patch bleibt gesperrt, bis Gate v1.2 vollständig PASS ist.
