# Sammy v0.8.25.2 — SOLVER V2 PROOF 1.2

Diese Version ist ein inkrementelles Test-Harness-Update von v0.8.25.1. Der iPhone/Safari-Quick-Lauf von Proof 1.1 stoppte korrekt mit `TARGET_GENERATION_INVALID`, weil der globale Parameter-RMS über die komplette Solver-Map reale Änderungen an nur wenigen aktiven DOFs zu stark verdünnte.

## Wichtig

- Messgeometrie bleibt auf v0.8.24.26 / Gate-v1.7-Stand.
- Deep + Repair-v1.6 bleibt die Solver-V2-Datenbasis.
- Der inverse Solver, Jacobian und Direction A/B werden in v0.8.25.2 **nicht** umgebaut.
- Target-/Seed-Nichttrivialität wird jetzt mit `globalRms` **und** `activeRms` geprüft.
- `activeRms` verwendet nur tatsächlich unterschiedliche DOFs (>= 3.5 % des jeweiligen Wertebereichs).
- Reale Mindestdistanz der 24 ANSUR24-PROT-v2-Maße bleibt zwingend.
- Kein neutraler Fallback, keine Duplikate, keine Source-äquivalenten oder fast perfekten Seeds.
- Bei erneutem `PROOF INVALID` stehen die Reject-Zähler direkt in der Fehlermeldung.

## Start

`index.html` öffnen → `LAB → SOLV` → Deep-Quelle prüfen → **Quick**.

Wenn `PROOF INVALID` erscheint, die Diagnose/Exports schicken und nicht Standard starten. Wenn `TEST VALID` erreicht und der Lauf fertig wird, Summary/FULL sowie den anschließenden Blind-AUDT exportieren.

## Neue Dokumentation

- `RELEASE_NOTES_V0.8.25.2.md`
- `SOLVER_V2_PROOF_1.2_V0.8.25.2.md`
- `BUILD_TEST_V0.8.25.2.txt`
- `BUILD_MANIFEST_V0.8.25.2.json`

Ältere Release-/Labor-Notizen bleiben als Projekt-Historie im Paket erhalten.
