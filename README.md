# Sammy v0.8.25.0 — SOLVER V2 PROOF 1.0

Dieser Build setzt direkt auf **v0.8.24.26 / Measurement Freeze Gate v1.7** auf und fügt den ersten entscheidenden Blind-Inverse-Nachweis für Solver V2 hinzu.

## Einstieg

1. App normal starten.
2. `LAB → SOLV` öffnen.
3. Prüfen, dass oben **Deep bereit** erscheint. Falls der Browser-IndexedDB-Lauf fehlt, das bereits exportierte `Sammy_MORPH_OBS_FULL_deep_*.json` auswählen.
4. Zuerst **Quick** als technischen Smoke-/Resume-Test ausführen.
5. Danach **Standard** als eigentlichen Entscheidungslauf ausführen und `Summary JSON` + `FULL JSON` exportieren.
6. Optional `Blind Audit öffnen` und die Bestlösungen rein visuell auf klare anatomische Fehler prüfen.

## Architekturgrenze

- Messdefinitionen / Mesh-Messoperatoren: unverändert `ANSUR24-PROT-v2` aus v0.8.24.26.
- ANSUR↔Sammy: unverändert.
- Solver V2: neue isolierte Proof-Schicht mit Deep-Hierarchie, frischen realen Mesh-Jacobians, Trust Region, Line Search, Reliability, Multi-Seed und Holdouts.
- Die sieben Repair-v1.6-Maße verwenden keine alten Deep-Interaction-Residuals.
- Der alte Solver24 V2.1 bleibt als eingeklappte Baseline verfügbar.

## Dokumentation

- `RELEASE_NOTES_V0.8.25.0.md` — Testdesign, Gate und Bedienung.
- `SOLVER_V2_PROOF_1.0_V0.8.25.0.md` — technische Solver-Architektur und Direction-B-Fallback.
- `BUILD_TEST_V0.8.25.0.txt` — statische Build-Prüfungen.
- `BUILD_MANIFEST_V0.8.25.0.json` — Dateien / SHA-256 / Build-Metadaten.

Ältere Release-/Lab-Dokumente bleiben im Paket als Versionshistorie erhalten.
