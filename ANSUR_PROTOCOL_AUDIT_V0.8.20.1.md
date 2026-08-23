# ANSUR PROTOCOL AUDIT · v0.8.20.1

## Scope
Focused correction from the user audit `2026-08-23T09:07:57Z` and annotated screenshots. LAB/INFL/AUDT navigation from v0.8.20.0 is preserved.

## Reopened checks

### Cervicale
- v0.8.19.9 was still visibly too high.
- The reviewed residual `[+0.0025, -6.0916, +1.9026] cm` is now canonical MEAS geometry.
- Matching legacy local offset is consumed on migration to avoid double application.

### Trapezius / Neck lateral
- Trapezius L/R is no longer an independent proxy.
- It is exactly the corresponding Neck lateral point.
- Old independent Trapezius offsets are archived in state but no longer applied.
- Shoulder Length starts at this shared point.

### Buttock lateral / Hip Breadth
- Both lateral landmarks are exact left/right extrema of the Buttock-Circumference slice.
- Those same two points are the Hip-Breadth endpoints.
- Independent Buttock-lateral offsets are disabled so the markers cannot drift off the line.

### Shoulder Length
- Uses the Harness-Lab method requested by the user.
- Straight Trapezius/Neck-lateral → Acromion guide.
- 34 guide samples.
- Each sample searches the real mannequin surface along a bidirectional probe perpendicular (90°) to the guide.
- Found surface points form the measured polyline.

### Waist Back Length
- PROT display is now a straight Stature-like vertical guide beside the body.
- Its top height is exactly Cervicale; bottom height is posterior Waist/Omphalion level.
- **Important:** the numeric ANSUR target remains the handbook-defined surface/tape distance. Only the audit visualization is straightened. This avoids silently changing the ANSUR variable used by the predictor.

## Migration / regression policy
Only `cervicale`, `trapezius`, `buttock_lateral`, `hip_breadth`, `waist_back_length`, and `shoulder_length` are reopened. Existing comments are preserved. LAB hub, Influence and Blind Audit remain unchanged.
