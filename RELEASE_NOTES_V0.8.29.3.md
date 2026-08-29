# Release Notes · Sammy v0.8.29.3

## BODY BANK SOLVER · Proof Hardening 1.1

Dieser Stand vergrößert den Solver nicht, sondern macht den bisherigen POC methodisch sauberer.

- Body-Bank-Solver verwendet eine einzige kanonische Rest-Mesh-Statur.
- Gewicht ist nur noch Retrieval-/Diagnose-Prior; Local-Fit-Gate bewertet ausschließlich steuerbare Geometrie.
- Neuer 16er Family-/Near-Neighbor-Holdout Proof v1.2.
- Vollständiger Trace auch für nicht ausgeführte/verworfene lokale Controller.
- `AA-S-2f9708e4` aus dem ersten erfolgreichen manuellen Solverlauf wird im ACTIVE-Seed erhalten.
- Die kanonische Body Bank bleibt bei 397 Nodes / 269 trusted / 91 frontier / 37 negative.

Der nächste Test ist der 16er Family-Proof. Erst danach soll der Solver um weitere Freiheitsgrade erweitert werden.
