# Release Notes · Sammy v0.8.29.4

## BODY BANK SOLVER 1.1 · Top-3 + Bidirectional Probing

Der 16er Family-Holdout aus v0.8.29.3 blieb auch ohne Ziel-Familie und nahe Rezeptnachbarn auf GO. v0.8.29.4 baut deshalb erstmals die eigentliche Solverstrategie weiter aus, ohne zusätzliche DOFs freizuschalten.

- Local Controller werden am konkreten Seed in `+epsilon` und `-epsilon` vermessen; Morphnamen legen keine Wirkrichtung mehr fest.
- Retrieval-Ränge #1–#3 werden unabhängig lokal gefittet; der beste sichere Endscore gewinnt.
- Visuelle Human-Audit-Freigabe und technische `solverEligible`-Messbarkeit sind getrennte Statusdimensionen.
- Measurement-Sanity gilt auch für den finalen Local-Fit-Zustand; bei Ausfall erfolgt Rollback auf den auditierten Seed.
- Neuer 24er Family-Holdout Proof v1.3 vergleicht Neutral -> Retrieval -> Single-Seed Fit -> Top-3 Fit.
- Gewicht bleibt ausschließlich Retrieval-/Diagnose-Prior; keine Cross-Region-Rettung und keine neuen Morph-Bounds.

Der kanonische Body-Bank-Index bleibt inhaltlich bei 397 Nodes / 269 trusted / 91 frontier / 37 negative. Die erfolgreichen v0.8.29.3 Proof-/Manuallauf-JSONs sind als Evidenz im vollständigen Stand enthalten.
