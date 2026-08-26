# PATCH NOTES · v0.8.25.2

**SOLVER V2 PROOF 1.2** korrigiert ausschließlich das Parameter-Distanz-Gate des Proof-Harness.

- Ursache des v0.8.25.1-Invalid-Laufs: globaler RMS über ~40–50 Solvervariablen verdünnte die absichtliche Änderung weniger aktiver DOFs;
- neue Distanzmetrik: `globalRms + activeRms + activeCount`;
- Typical/Edge-Gates an die aktive Unterraumdistanz gekoppelt;
- Seed↔Source und Seed↔Seed ebenfalls active-subspace-aware;
- reale 24-Maß-Abstände, Mesh-Plausibilität, ANSUR-Delta-Prior und Duplicate-Gates bleiben hart;
- keine Fallback-Targets;
- Invalid-Fehler nennen jetzt die Reject-Zähler direkt.

Messdefinitionen, v0.8.24.26-Messgeometrie, Deep-Taxonomie, Repair-v1.6 sowie der Solver-V2-Optimierer bleiben unverändert.

Siehe `RELEASE_NOTES_V0.8.25.2.md` und `SOLVER_V2_PROOF_1.2_V0.8.25.2.md`.
