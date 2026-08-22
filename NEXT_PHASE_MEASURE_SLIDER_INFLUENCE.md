# Next phase · Measure → Slider Influence

Start condition: the 24 ANSUR targets are re-audited green across several randomized bodies.

Reuse policy:

1. Keep the existing Measurement Lab calibration / perturbation history as prior evidence.
2. Do not rerun the full slider matrix blindly: first compare the old and v0.8.19.7 measurement definitions.
3. Reuse influence results for unchanged definitions; rerun differential perturbations for measures whose geometry changed in v0.8.19.7.
4. For each Sammy slider/parameter, measure the local response vector `Δ24 measures / Δparameter` at several body shapes, not only one mannequin.
5. Store sign, sensitivity, non-linearity and cross-effects. This becomes the initialization/Jacobian prior for the later 24-target solver, not the prediction model.

Prediction of missing user measures remains a separate layer and is not part of this influence test.
