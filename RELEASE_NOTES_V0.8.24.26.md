# SAMMY v0.8.24.26 — MEASUREMENT FREEZE GATE v1.7

## Ziel
Letzter begrenzter Messgeometrie-Schritt vor Solver V2. Kein neuer Quick/Deep/Atlas-Lauf und kein weiterer globaler 2.888er Repair-Sweep.

## Änderungen

- **Acromion v1.4:** Der Acromion-Anker wird nicht mehr als nächster Schulter-Oberflächenpunkt zum im Schulterübergang liegenden Arm-Joint gewählt. Stattdessen wird ein deterministischer Zielpunkt außerhalb der Schulter entlang der `Shoulder → Arm`-Achse konstruiert und der nächste Punkt der echten Schulter-Dreiecksoberfläche verwendet. Das soll den im Repair v1.6 sichtbaren Triangle-/Patch-Wechsel bei `Measure Upperarm Length` beseitigen.
- **PROT Support Audit:** Neck Circumference und Thigh Circumference exportieren zusätzlich eine 32-Winkel-Polarsignatur des tatsächlich gemessenen posed Querschnitts. Damit werden große Cross-Effects als `posed-surface-coupling` oder `operator-only-suspect` klassifiziert, ohne die Messdefinition automatisch erneut umzubauen.
- **Gate v1.7:** Drei zusätzliche Acromion-Regressionsfälle plus zwei Support-Audit-Fälle. Acromion, Neck-/Thigh-Support, bisherige Loop-/Landmark-/Shoulder-Path-Guards sind gemeinsam Teil des Freeze-Gates.
- **Freeze-Regel:** Ein PASS friert die Messgeometrie ein. Unerwartete, aber geometrisch kontinuierliche Cross-Effects werden danach im Solver über Reliability/Priors behandelt statt durch weitere Messoperator-Patches.
- **Kein weiterer Global-Repair:** Der bestehende Deep + Repair v1.6 bleibt die Basis. Die drei Acromion-abhängigen Ziele (`biacromial_breadth`, `shoulder_length`, `upperarm_length`) werden in Solver V2 nur für die tatsächlich ausgewählten Struktur-DOFs gezielt nachkalibriert.

## Nicht geändert

- Bootstrap / Startpfad
- Atlas v2.9
- Morph Sections v2.1
- ANSUR24-PROT-v2 Definitionen und MeasurementStates
- Solver24
- Neck / Neck Base / Thigh / Tibiale Operatoren aus v0.8.24.24/23/19

## Test

1. App normal starten und Mannequin prüfen.
2. `MORF → MEAS Gate` einmal ausführen.
3. `Gate JSON` exportieren.
4. Bei `summary.freezeEligible=true` beginnt Solver V2; **Deep MEAS Patch nicht erneut ausführen**.

## Entscheidender Solver-V2-Nachweis
Nach Freeze folgt ein Blind-Inverse-Holdout-Test: Der Solver erhält nur die Zielmaße eines unbekannten, vom Modell erzeugten Körpers. Beurteilt werden Messresiduen in ANSUR-Observer-Error-Units, Stabilität, Plausibilität und Wiederholbarkeit. Erst dieser Test entscheidet endgültig, ob die inverse Solver-Richtung funktioniert.
