# SAMMY v0.8.20.0 · LAB Hub / Influence / Blind Body Audit

## Scope
This release changes lab navigation and exposes the next calibration/audit workflow without altering the v0.8.19.9 canonical measurement geometry.

## Navigation
Top level: `ANIM · FORM · LAB`.

LAB opens a centered radial hub with:
- `PROT` — ANSUR protocol / landmark / measure review
- `MEAS` — Measurement Lab
- `INFL` — measure→slider influence calibration
- `AUDT` — blind body plausibility audit
- `ANSR` — ANSUR statistics / prediction research

## Influence
The existing Calibration Lab is mounted in INFL. Standard mode uses 5 levels per logical solver slider over multiple reference bodies, followed by relevance/interaction/global/validation stages. Existing calibration state remains compatible.

## Blind Audit
Header only: previous · comment · plausible · implausible · mark flaw · next.

The reviewer is not shown target measurements or solver path. A flaw marker is placed by tapping the visible mannequin and is persisted per anonymous case. Ratings export as `sammy-body-plausibility-audit-v1`.

The queue currently reads newest stored real-mesh D3/D2 cases. Its case format is deliberately independent of the source so the later multi-start solver can add several reconstructions for the same target without changing the review UI.


> v0.8.20.1 keeps this LAB/Audit UI unchanged and only corrects protocol geometry.
