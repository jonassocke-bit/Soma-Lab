# SAMMY v0.8.29.5 · BODY BANK SOLVER 1.2 · Trust Region + Active Merge + Coverage Prep

## Neu

- 61er v0.8.29.4 ACTIVE-Audit kanonisch gemergt.
- Body Bank: 426 Nodes = 295 trusted / 94 frontier / 37 negative / 0 unchecked.
- 29 neue exakte Körperformen aus ACTIVE; 26 accepted, 3 uncertain, 0 rejected.
- Umfangs-Local-Fit auf gemessene Trust Region umgestellt: ±ε, bei widersprüchlichem/erfolglosem Verhalten zusätzlich ±2ε; keine Ableitungsextrapolation.
- Top-3 bleibt unverändert der Solverstandard.
- Stale bereits kanonisch gemergte Learning-/Pending-Einträge werden lokal dedupliziert.
- `body-bank-coverage-prep-v1.json` ergänzt: 295 Trusted-Nodes als technische Runtime-Coverage-Scan-Queue.
- Neuer 36er Coverage-Stress v1 statt eines weiteren nahezu identischen Architekturproofs.

## Unverändert

- kanonische Rest-Mesh-Statur,
- Weight nur Retrieval-/Diagnose-Prior,
- kleine Local-Bounds,
- keine neuen DOFs / keine Cross-Region-Rettung,
- Human-Audit und `solverEligible` bleiben getrennt,
- 205-cm-Audit-Cap, Dual Viewport und Kopf-/Head-Fat-Vertagung bleiben bestehen.

