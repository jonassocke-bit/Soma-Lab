# Sammy v0.8.25.4 — SOLVER V2 PROOF 1.4

Diese Version setzt den validierten Solver-V2-Proof inkrementell fort. Messdefinitionen, Messgeometrie, Target-/Seed-Generator, Reliability und die bisherigen A/B-Solverpfade bleiben unverändert.

Neu ist **Direction C · Fresh-Wide Jacobian Rescue**: Nur ein normaler Seed, der nach Direction B weiterhin FAIL ist, erhält einen breiteren frisch am aktuellen Mesh gemessenen Kandidatenpool. Die finale DOF-Auswahl erfolgt aus diesem frischen lokalen Jacobian, nicht aus alten Deep-Zahlenvektoren.

## Testablauf

1. App starten und `Sammy · v0.8.25.4` prüfen.
2. `LAB → SOLV` öffnen.
3. Deep-Quelle muss `bereit` sein; falls nötig den bestehenden Deep-FULL-Export importieren.
4. **Quick** starten.
5. Bei Abschluss FULL JSON exportieren.
6. Blind AUDT durchführen und ebenfalls exportieren.
7. Vor Standard zuerst Quick auswerten: insbesondere `directionC`, `fresh-wide-rescue`, Seed-Akzeptanz und `derivedSeedSpreadCm`.

## Wichtige Dateien

- `RELEASE_NOTES_V0.8.25.4.md`
- `SOLVER_V2_PROOF_1.4_V0.8.25.4.md`
- `BUILD_TEST_V0.8.25.4.txt`
- `BUILD_MANIFEST_V0.8.25.4.json`

Ältere Release-/Proof-Dokumente bleiben als Historie im Paket.
