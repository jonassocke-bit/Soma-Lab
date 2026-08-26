# PATCH NOTES · v0.8.25.3

## SOLVER V2 PROOF 1.3

Der gültige Proof-1.2-Quick-Lauf zeigte eine klare Konvergenzbudget-Konfundierung: alle acht Round-trip-Seeds verbesserten sich bis zum letzten verfügbaren Schritt, während mehrere absichtlich entfernte Seeds in einzelnen Core-Dimensionen weiter von der Source entfernt waren als das gesamte Quick-Trust-Region-Budget überhaupt reisen konnte.

v0.8.25.3 ändert deshalb ausschließlich die Proof-Konvergenzsteuerung nach den festen Phase-A-Pässen. Direction B darf für weiterhin fehlschlagende Seeds adaptiv mehrere Fresh-Jacobian-Rescue-Pässe durchführen und meldet explizit ACCEPTED / STALLED / BUDGET. Conflict-Controls bleiben auf einen Rescue-Pass begrenzt.

Messdefinitionen, v0.8.24.26-Geometrie, Repair-v1.6-Policy, Deep-Taxonomie, Reliability, Target-/Seed-Validierung und AUDT bleiben unverändert.

Siehe `RELEASE_NOTES_V0.8.25.3.md` und `SOLVER_V2_PROOF_1.3_V0.8.25.3.md`.
