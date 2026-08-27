# Solver V2 Proof 1.6 — Post-solve Polish

Purpose: test whether a good but still WARN/FAIL final reconstruction can converge further when the already solved body itself becomes the next starting point.

Policy:
1. Run Proof 1.5 architecture unchanged through STAT / canonical multistart / hierarchy / optional final-wide.
2. Only if the selected non-conflict result is still WARN/FAIL: use its exact final shape as the new seed.
3. Freshly remeasure the current mesh and rerun the hierarchy with smaller trust steps.
4. Do not redo STAT or multistart.
5. Accept only sub-steps that lower the global real-mesh objective.
6. Maximum two polish rounds. Stop earlier on PASS or insufficient improvement.
7. Conflict controls receive no polish.

This is a bounded convergence test, not unlimited iteration.
