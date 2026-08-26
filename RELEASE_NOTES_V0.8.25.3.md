# Sammy v0.8.25.3 — SOLVER V2 PROOF 1.3

## Warum diese Version existiert

Der erste wissenschaftlich gültige Proof-1.2-Quick-Lauf (`solver-v2-proof-2026-08-26T20-29-55-854Z-al9ca`) bestand die harte Testvalidität: vier nichttriviale, nichtduplizierte Round-trip-Ziele und zwei ausreichend entfernte Seeds je Ziel. Der Lauf scheiterte anschließend mit 25 % akzeptierten Seeds und großer Seed-Streuung.

Die Iterationshistorie zeigte aber keinen typischen Solver-Stall: alle acht Round-trip-Seeds verbesserten sich durch die vier Deep-gerankten Pässe weiter, und Direction B verbesserte anschließend 8/8 Seeds erneut. Gleichzeitig lag die theoretische maximale Core-Bewegung des Quick-Budgets in Proof 1.2 nur bei 0.4148 normierten Parameter-Einheiten (4 × 0.085 plus ein B-Pass × 0.0748). Vier der absichtlich entfernten Seed↔Source-Distanzen erreichten 0.531–0.648 in einer einzelnen Core-Dimension. Damit konnte der Proof Seed-Stabilität teilweise gegen ein künstlich zu kurzes Bewegungsbudget testen.

## Änderung

Proof 1.3 behält Target-Generator, Testvalidität, Messdefinitionen, v0.8.24.26-Messgeometrie, Deep-Taxonomie und den eigentlichen Trust-Region-Schritt bei. Geändert wird nur die Konvergenzsteuerung nach den festen Deep-gerankten Pässen:

- fehlgeschlagene Seeds erhalten mehrere frisch gemessene semantische Direction-B-Rescue-Pässe;
- jeder Rescue-Pass misst erneut einen lokalen Real-Mesh-Jacobian über die 10 MeasurementStates;
- Quick erlaubt bis zu 5 Rescue-Pässe, Standard 5, Deep 6;
- Rescue stoppt sofort bei akzeptiertem Fit, nach zwei echten Stalls oder beim expliziten Budgetende;
- Conflict-Controls bleiben absichtlich auf genau einen B-Pass begrenzt;
- jeder Pass exportiert Akzeptanz, Line-Search-Alpha, Delta der gewichteten Protocol Units, relative Verbesserung, Lambda, Kandidaten und Nonlinearitätsdiagnostik;
- Resultate exportieren `convergence.stopReason`, `budgetLimited`, Rescue-Pass-Zähler und das theoretische maximale Core-/Local-Reisebudget.

## Unverändert

- ANSUR24-PROT-v2 und alle 24 Zielmaße.
- Deep MEAS Repair v1.6 Policy; alte Interaction-Residuals der sieben reparierten Maße bleiben ausgeschlossen.
- Acromion-abhängige Ziele werden weiterhin nur frisch am aktuellen Mesh abgeleitet.
- Reliability-Gewichte und Observer-Error-Normalisierung.
- Target-/Seed-Validierung aus Proof 1.2.
- Conflict-Control-Definitionen.
- Blinder AUDT mit Best-Fit + Far-Seed-Rekonstruktion.
- Legacy Solver24 und alle anderen Labs.

## Erwartung für den nächsten Quick-Lauf

Der Lauf soll jetzt beantworten, ob die schlechte Seed-Stabilität aus Proof 1.2 hauptsächlich ein Konvergenzbudget-Problem war oder ob entfernte Seeds trotz ausreichender Reise und fortgesetzter Fresh-Jacobian-Schritte in unterschiedlichen Becken enden. Erst danach ist ein Standard-Lauf sinnvoll.
