# SAMMY v0.8.24.20 — MEAS Stability Gate v1.1

Basis: v0.8.24.19. Kein Bootstrap-, Atlas-, Section-, PROT- oder Solver24-Umbau.

## Deep-Gate follow-up
Der erste v0.8.24.19-Gate-Lauf zeigte 3 deklarierte Fehlschläge und zusätzlich Off-Target-Sprünge, die Gate v1 nicht geprüft hatte.

### Operator-Fixes
- Neck Circumference: strikter Neck-only Slice am Infrathyroid; neckBase nur Fallback.
- Neck Base Circumference: PROT-Landmark/Rig-Anker statt morphabhängiger Soft-Tissue-Transitionssuche. Der bereits auditierte +1.6-cm-Anker bleibt als Neck1-5 mm +16 mm = +11 mm kodiert.
- Thigh Circumference: Gluteal-Furrow-Suche enger und stärker um den geprüften lokalen Bereich regularisiert; verhindert branch jump Richtung t≈0.19.
- Shoulder Length: stabiler Trapezius-Endpunkt aus dem Neck-Base-Landmark-Plane + Acromion; surface projection nutzt feste Endpunkte.

### Gate v1.1
- dieselben 12 Stressfälle, aber zusätzliche Cross-Target-Invarianten.
- fängt insbesondere die im ersten Gate versteckten Neck- und Thigh-Sprünge ab.
- Deep MEAS Patch bleibt gesperrt, bis das Gate vollständig PASS ist.
