# RELEASE NOTES — Sammy v0.8.26.4

## Solver Architecture Audit · Anatomical Routing + Predictive Polish

v0.8.26.4 korrigiert mehrere systematische Solver-V2-Architekturfehler, die erst im Real-ANSUR-Residual-Test sichtbar wurden. Der wichtigste Befund war, dass vorhandene Morph-Freiheitsgrade teilweise falsch geroutet, vorzeitig gekoppelt oder durch stale Repair-Metadaten fehlpriorisiert wurden.

### Highlights

- **Hard Anatomical Routing:** fachfremde lokale Morphs kommen für ein Zielmaß nicht mehr in den Residual-Pool.
- **Repair rows fresh-only:** die sieben Deep-v1.6-Reparaturmaße verwenden keine alten numerischen Influence-Werte und keine alten Top-Measure-Hints mehr.
- **Raw DOFs:** Torso/Neck/Upperleg Depth + Horizontal werden nicht mehr automatisch zu einer einzigen Solverachse fusioniert.
- **Legacy migration:** alte v0.8.26.3 SolverMaps werden beim Import automatisch in getrennte fresh-only Achsen aufgespalten.
- **Direct-target supplements:** fehlende Wrist/Ankle/Calf/Lowerleg-Zielkontrollen werden bei alten Maps ergänzt und frisch gemessen.
- **Predictive residual landing:** Restfehler/Derivative wird zur Zielschätzung genutzt; das alte starre Mini-Step-Clipping entfällt.
- **5→3 fresh selection:** erst anatomisch passende Kandidaten frisch messen, danach numerisch auswählen.
- **Fair scheduler:** bis zu 12 Aktionen, kritische Maße zuerst, kein Maß monopolisiert den Lauf.
- **Persistent locks:** bereits gute kritische Maße dürfen nicht schleichend wieder aus der Produkttoleranz driften.
- **State-local stall + capacity:** ein Stall kann nach Körperänderung erneut geprüft werden; hoffnungslose Richtungen verbrauchen nicht endlos Budget.
- **Exact adaptive bounds:** ±115/130 % erst bei nachgewiesenem Bound-Block und nur für den tatsächlich blockierten lokalen DOF.

### Wissenschaftliche Freeze-Grenzen

Messoperatoren, Reliability, FitMetrics, Proof Objective, Statistikdaten und die 902er Prediction-Reserve sind unverändert. Der Patch verändert die **Solver-Nutzung vorhandener Freiheitsgrade**, nicht die Messdefinition.

### Empfohlener Runtime-Test

PRA 1.2 auf denselben fünf bekannten Real-ANSUR-Fällen. Kein neuer Proof- oder 3-Stunden-Stresslauf nötig. Die v0.8.26.3-PRA-JSON kann direkt importiert werden.
