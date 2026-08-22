# SAMMY ANSUR Protocol Audit · v0.8.19.7

Basis: Nutzer-Audit `Sammy_ANSUR_PROTOCOL_AUDIT_2026-08-22T21-16-47-689Z.json` + NATICK/TR-11/017.

## Canonical MEAS changes

- MEAS and PROT now share the same strict skin-weight body regions. Body-part measures do not fall back to the whole mesh.
- `biacromial_breadth`: direct Acromion L ↔ Acromion R.
- `buttock_circumference`: horizontal pelvis slice at the dynamically detected maximum posterior right-buttock level.
- `hip_breadth`: direct lateral-buttock distance at exactly the Buttock-Circumference level.
- `neck_circumference`: Infrathyroid level, perpendicular to neck axis.
- `wrist_circumference`: Stylion level, perpendicular to forearm axis. **Not** a generic minimum search; this follows the handbook definition.
- `thigh_circumference`: Gluteal-Furrow level, perpendicular to thigh axis.
- `calf_circumference`: dynamic horizontal maximum restricted to RIGHT_CALF.
- `ankle_circumference`: dynamic horizontal minimum restricted to RIGHT_ANKLE.
- `waist_back_length`: surface path Cervicale → posterior Waist (Omphalion).
- `upperarm_length`: Acromion → Radiale.
- `lowerarm_length`: Radiale → Stylion.
- `tibiale_height`: vertical floor → Tibiale.
- `shoulder_length`: surface path Trapezius → Acromion.
- `upperarm_circumference`: strict RIGHT_UPPER_ARM plane at dynamic Biceps Point.
- `forearm_circumference`: strict RIGHT_FOREARM plane at Elbow Crease.

## Dynamic landmark families

The following are recomputed from the current mesh instead of carrying a manual XYZ correction across morphs:

- Buttock posterior ↔ Buttock lateral ↔ Buttock Circumference / Hip Breadth
- Calf maximum ↔ Calf Circumference
- Ankle minimum ↔ Ankle Circumference
- Neck Base lateral ↔ Trapezius ↔ Neck Base Circumference / Shoulder Length
- Biceps Point ↔ Biceps Circumference, Flexed
- Gluteal Furrow ↔ Thigh Circumference

Landmark view again renders the related measure lines and adds lightweight connectors between landmarks that jointly define a measure.

## Pose update

- `arm_flexed_forward`: right upper arm forward/horizontal + elbow approximately 90° are generated as native world-direction constraints.
- `wrist_90`: upper arm relaxed + elbow approximately 90° are generated as native constraints.
- Fist clench, exact palm supination and max-effort soft-tissue/muscle bulging are not simulated. Biceps/Forearm Flexed therefore remain protocol-geometry approximations for soft tissue.

## Re-audit behavior

On first start of v0.8.19.7, measures whose geometry changed and genuinely dynamic landmarks are reopened as `unchecked`. Existing comments are preserved. This avoids silently carrying v0.8.19.6 approval onto a changed definition.

## Next gate

Do not begin the final measure→slider influence/solver phase until this 24-measure pass has been re-audited on multiple randomized bodies. Existing Measurement Lab calibration and influence-test history is intentionally retained and should be reused after the geometry gate is green.
