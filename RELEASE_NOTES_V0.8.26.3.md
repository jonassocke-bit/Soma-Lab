# Sammy v0.8.26.3 — Pragmatic Repair 1.1 · Residual Convergence

## Warum diese Version
v0.8.26.2 verbesserte zwei sichtbare Fälle, zeigte aber zwei konkrete Probleme: der Repair stoppte nach je einem Thorax-/Frame-/Soft-Schritt, obwohl produktkritische Maße noch deutlich falsch und passende Regler nicht am Limit waren; außerdem wurde `ordinal` im PRA-Run nicht initialisiert, wodurch mehrere Case-Records in IndexedDB denselben Schlüssel erhalten und sich überschreiben konnten.

## Fix 1 · Record-/Checkpoint-Integrität
- neue PRA-Runs starten mit `ordinal: 0`;
- beim Resume wird `ordinal` mindestens auf die vorhandene Record-Anzahl angehoben;
- die Summary dedupliziert nach `caseId` und gibt nur bei 5/5 eindeutigen Fällen eine belastbare Gesamtentscheidung aus;
- alte v0.8.26.2 Repair-JSONs können als Quelle importiert werden, weil ihr `run.cases` weiterhin alle fünf ursprünglichen Stresskörper enthält.

## Fix 2 · Residual Convergence
Nach dem bisherigen Thorax/Frame/Soft/Escape-Block folgt pro Körper ein begrenzter residualer Nachlauf:
- maximal 6 frische Re-Linearisationen;
- jeweils das aktuell stärkste noch außerhalb der Produkttoleranz liegende Maß wird priorisiert;
- maximal drei passende DOFs werden über Solver-Map + direkte Maßsemantik ausgewählt;
- jeder Schritt wird am realen Mesh neu gemessen;
- bereits passende produktkritische Maße werden geschützt;
- wenn der gemeinsame Schritt nicht funktioniert, werden die ausgewählten DOFs zusätzlich einzeln getestet;
- bleibt kein sicherer Verbesserungsschritt, wird das Maß explizit als `stalled` protokolliert statt stillschweigend beendet.

## Adaptive Bounds
±115/130 % ist jetzt kein pauschaler Escape-Block mehr. Erweiterte lokale Bounds werden im Residual-Polish nur dann freigegeben, wenn ein ausgewählter linearer lokaler Morph am normalen ±1-Limit steht und der gemessene Gradient für die erforderliche Korrektur weiter nach außen zeigt. Core-Achsen bleiben in ihren normalen Bereichen.

## Produkt-Toleranzen
Der Nachlauf verfolgt weiterhin kein 24/24-Laborziel. Kritische Harness-/Avatar-Maße werden grob bis etwa 1.25–1.8 cm Restfehler verfolgt; formunterstützende Maße haben bewusst größere Toleranzen. `Forearm Circumference, Flexed` bleibt diagnostisch.

## Wissenschaftliche Grenze
Proof 1.6, ANSUR24-PROT-v2, MeasurementStates, Statistical Prefit, Real-ANSUR Stressdaten, Representability Lab und die 902er Prediction-Reserve bleiben unverändert.
