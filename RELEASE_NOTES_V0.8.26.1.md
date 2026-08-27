# RELEASE NOTES · Sammy v0.8.26.1

## REAL ANSUR REPAIR · REPRESENTABILITY LAB 1.0

v0.8.26.1 reagiert auf den gültigen Real-ANSUR-Stresslauf aus v0.8.26.0. Der erfolgreiche Proof-1.6-Solver wird **nicht neu entworfen**. Stattdessen trennt ein fokussiertes Diagnose-Lab die systematischen Real-ANSUR-Restfehler nach Ursache.

### Neu

- 5 Fokus-Körper aus den bereits verbrauchten Stressfällen: 2 typische Männer, schwerer männlicher Randfall, typische Frau, kleiner weiblicher Randfall.
- Automatische Übernahme des letzten vollständigen Real-ANSUR-Stressruns aus IndexedDB; FULL-JSON-Import als Fallback.
- Frische Real-Mesh-Probes auf bis zu 18 bereits vorhandenen relevanten Torso-/Schulter-/Lowerarm-DOFs.
- Lokale Ursache-Klassifikation für `chest_breadth`, `biacromial_breadth` und `forearm_circumference`.
- Geschützte Nachbarmaße verhindern, dass ein Ziel nur durch neue Schäden an Brust/Taille/Schulter/Arm als „erreichbar“ gilt.
- Composition-Probe gegen das train+validation-only statistische Muskelzentrum.
- Direktes Anzeigen der ursprünglichen Stress-Lösung und – falls vorhanden – des statistischen Muskel-Prior-Shapes.
- Neue experimentelle seitliche Torso-Normalen-Diagnose aus der echten Mesh-Topologie.
- Checkpoint nach jedem der 5 Körper; Pause/Resume.
- Ein kompakter Diagnose-JSON-Export.

### Nicht geändert

ANSUR24-PROT-v2, Messzustände, Reliability, Repair-v1.6, Proof-1.6 Objective/Gates, Statistical Prefit, Hierarchie, Jacobian, Final Wide, Polish, Stress-Suite und die 902er Prediction-Reserve bleiben unverändert.

### Erwartete Laufzeit

Das Lab löst keine fünf Personen komplett neu. Es startet an den bereits fertigen Stress-Körpern und misst nur kontrollierte lokale Varianten. Je nach iPhone/Temperatur werden deutlich weniger Mesh-Auswertungen als im 10er Stress-Gate benötigt. Der Lauf besitzt trotzdem Fall-Checkpoints, weil alle Probes echte ANSUR24-Mesh-Messungen sind.

### Danach

Das Diagnoseergebnis entscheidet den Repair-Pfad. Erst nach einem gezielten Repair und kompaktem Re-Test wird der vollständige 10er Real-ANSUR-Stress einmal wiederholt. Few-Measure Prediction bleibt bis dahin bewusst nachgelagert.
