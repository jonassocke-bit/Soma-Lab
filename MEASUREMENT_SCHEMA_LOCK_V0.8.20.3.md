# Measurement Schema Lock · v0.8.20.3

User review status: the current landmark and measure placement is accepted as sufficiently correct to begin the influence/solver phase.

- Canonical target vector: 24 direct ANSUR-compatible measures from PROT.
- MEAS and PROT share the same geometric measurement implementation.
- No measurement-geometry change is introduced in v0.8.20.3.
- Influence runs must record `measurementSchema: ANSUR24-PROT-v1` and the exact 24 measure IDs.
- Future geometry changes require an explicit schema/version change so influence/solver data from different definitions are not silently mixed.
