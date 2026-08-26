# Sammy v0.8.25.3 — SOLVER V2 PROOF 1.3

Diese Version setzt direkt auf v0.8.25.2 auf.

## Kernänderung

Proof 1.2 hat erstmals einen gültigen, nichttrivialen Blind-Round-trip geliefert. Die schlechte Seed-Stabilität war jedoch teilweise mit einem zu kurzen festen Trust-Region-Reisebudget vermischt. Proof 1.3 behält den Solver selbst und alle Testvaliditätsregeln bei, erlaubt nach den normalen Deep-gerankten Pässen aber mehrere adaptive semantische Fresh-Jacobian-Rescue-Pässe für weiterhin fehlschlagende Seeds.

## Testablauf

1. App starten und `Sammy · v0.8.25.3` prüfen.
2. `LAB → SOLV` öffnen; vorhandener Deep-Lauf kann weiterverwendet werden.
3. **Quick** starten.
4. Nach Abschluss FULL + Summary exportieren.
5. AUDT vollständig blind bewerten; Best-Fit und Far-Seed-Rekonstruktionen bleiben gemischt.
6. Noch keinen Standard-Lauf starten, bevor der Quick ausgewertet ist.

## Wichtige Dateien

- `RELEASE_NOTES_V0.8.25.3.md`
- `SOLVER_V2_PROOF_1.3_V0.8.25.3.md`
- `BUILD_TEST_V0.8.25.3.txt`
- `BUILD_MANIFEST_V0.8.25.3.json`
