# PATCH NOTES · v0.8.25.4

## SOLVER V2 PROOF 1.4

Der validierte v1.3-Quick verbesserte sich auf 1.1295 gewichtete Protocol Units / 0.8029 cm RMSE, 100 % non-fail Targets und 62.5 % akzeptierte Seeds. Zwei Far-Seeds stallten jedoch real, ein weiterer blieb nach weiterem Fortschritt über der FAIL-Grenze; die derived Seed-Streuung lag noch bei 3.0709 cm.

v0.8.25.4 fügt deshalb **nur nach weiterhin fehlschlagender Direction B** eine Direction-C-Eskalation hinzu: breiter DOF-Pool → frischer Real-Mesh-Jacobian → numerische lokale Spaltenauswahl → enger Trust-Step. Conflict-Controls erhalten C nicht.

Damit wird im nächsten Quick entschieden, ob der Restfehler primär aus zu engem Candidate-Ranking oder aus echter Basin-/Identifizierbarkeitsinstabilität stammt. Messung, Target-Erzeugung und Gate-Schwellen bleiben unverändert.

Siehe `RELEASE_NOTES_V0.8.25.4.md` und `SOLVER_V2_PROOF_1.4_V0.8.25.4.md`.
