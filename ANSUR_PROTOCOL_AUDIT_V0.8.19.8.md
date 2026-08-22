# ANSUR PROTOCOL AUDIT · v0.8.19.8 correction pass

Basis: user audit exported from Sammy v0.8.19.7 on 22 Aug 2026.

## What v0.8.19.7 confirmed
- Measures OK: 20 / 24 state entries.
- Landmarks OK: 11; manually adjusted: 5; flagged: 4.
- Runtime diagnostics reported no application errors on iPhone/Safari.

## Flagged geometry carried into this pass
### Landmarks
- `buttock_lateral` — Bitte dynamisch im Bereich der größten Gesäßausdehnung /  / Wichtig - liegt außen mittig am bein
- `neck_base_points` — Lateral = trapezius  /  / Neu sitzen höher
- `trapezius` — Neu sitzen höher 
- `biceps_point` — Bitte dynamisch in der Mitte vom Oberarm suchen /  / Neu: Oberkörper wird gefangen 

### Measures
- `hip_breadth` — Gleiche Höhe wie buttock circumference  /  / Neu: dynamisches Maß breiteste Stelle auf dieser Höhe
- `waist_back_length` — Bis auf Höhe cervicale  /  / Neu: vertikales Maß dynamisch bis auf Höhe cervicale!
- `shoulder_length` — Länge zwischen acromion und trapezius- gemessen auf der Körperoberfläche! /  / Neu: Linie nicht gerade - bitte prüfen  / Wichtig trapezius liegt nicht auf der neck circumference base Linie, sondern höher 
- `upperarm_circumference` — Vorsicht fängt teilweise Oberkörper mit /  / Neu: nicht gefixt

## v0.8.19.8 changes
- List selection does not auto-scroll the PROT panel.
- Dynamic landmarks no longer discard manual calibration: automatic anchor + persistent XYZ/line bias.
- Linked landmarks get a `Linie` adjustment control.
- Circumferences get two plane-tilt controls (`Kipp A/B`, ±25°) for protocol audit.
- `rightUpperArm` / `leftUpperArm` masks exclude shoulder weights; upper-arm slices cannot use torso/shoulder transition vertices.
- The reviewed +1.6 cm neck-base correction is absorbed into canonical MEAS geometry; the matching v0.8.19.7 PROT offset is migrated away to avoid double application.
- Buttock lateral points use lateral extrema at the posterior-buttock level.
- Trapezius is separated from the neck-base tape point and moved to a superior/medial shoulder-neck proxy.
- Waist-back and shoulder surface paths are smoothed while preserving surface-following behavior.

## Migration rule
Existing comments and calibration offsets are preserved. Only geometry changed in this pass is reopened for review. The v0.8.19.7 behavior that zeroed dynamic-landmark offsets is explicitly retired.
