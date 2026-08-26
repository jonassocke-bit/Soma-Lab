# Sammy v0.8.25.1 — SOLVER V2 PROOF 1.1

Diese Version ist ein inkrementelles Update von v0.8.25.0. Sie repariert den **Proof-Testaufbau**, nachdem der erste Quick-Lauf identische Neutral-Fallback-Targets und einen bereits perfekten Startseed offengelegt hatte.

## Wichtig

- Messgeometrie bleibt auf v0.8.24.26 / Gate-v1.7-Stand.
- Deep + Repair-v1.6 bleibt die Solver-V2-Datenbasis.
- Solver V2 selbst wird in dieser Version bewusst nicht erneut umgebaut.
- Neu ist ein hartes **TEST VALID**-Gate vor jeder Solverbewertung.
- Kein neutraler Zielkörper-Fallback mehr.
- Target-Duplikate und zu nahe/perfekte Seeds machen den Proof `INVALID`.
- Direction B meldet getrennt `attempted`, `improved`, `finalFitAccepted`.
- AUDT zeigt blind Best-Fit plus Far-Seed-Rekonstruktion.

## Start

`index.html` öffnen → `LAB → SOLV` → Deep-Quelle prüfen → **Quick**.

Wenn `PROOF INVALID` erscheint, Summary/FULL exportieren und nicht mit Standard fortfahren. Wenn der Quick-Lauf `TEST VALID` erreicht und fertig wird, Summary/FULL sowie den anschließenden Blind-AUDT exportieren.

## Neue Dokumentation

- `RELEASE_NOTES_V0.8.25.1.md`
- `SOLVER_V2_PROOF_1.1_V0.8.25.1.md`
- `BUILD_TEST_V0.8.25.1.txt`
- `BUILD_MANIFEST_V0.8.25.1.json`

Ältere Release-/Labor-Notizen bleiben als Projekt-Historie im Paket erhalten.
