# PATCH NOTES · v0.8.25.7

## SOLVER V2 PROOF 1.6
- Adds bounded post-solve POLISH: final WARN/FAIL body → fresh remeasurement → at most two tighter reruns.
- No repeated STAT/multistart; no hidden source use; conflict-controls excluded.
- Unchanged measurement, target-validity, repair, reliability and gate semantics.

## INSPECTOR 1.2
- Simple decision summary first.
- Technical details collapsed by default.
- POLISH stage replay and diagnostics.
