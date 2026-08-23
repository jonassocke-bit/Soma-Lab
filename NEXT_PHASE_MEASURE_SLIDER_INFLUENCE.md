# Current phase · Measure → Slider Influence

Start condition reached: the user has accepted the PROT/MEAS landmark and 24-measure placement as sufficiently correct for the solver-influence phase.

1. Freeze the 24 ANSUR-compatible measurement schema for this analysis series; do not silently change geometry during influence runs.
2. Run the new INFL 5-phase analysis. Standard is the first recommended full run.
3. Use legacy Measurement-Lab results only as a comparison prior. Current influence values are always remeasured on the frozen 24-measure geometry.
4. Store signed sensitivity, effect range, linearity/non-linearity, cross-effects, and multi-body stability for every retained logical Sammy parameter.
5. The result becomes the initialization/Jacobian prior for the later 24-target inverse solver.
6. Solver validation will then use repeated reconstructions plus blind visual BODY AUDIT; human review only needs to flag obvious anatomical failures.

Prediction of missing user measures remains a separate statistical layer and is not part of this influence analysis.
