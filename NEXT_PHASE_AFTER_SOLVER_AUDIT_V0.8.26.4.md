# Next Phase after Solver Architecture Audit — v0.8.26.4

## Jetzt

1. v0.8.26.4 in Safari/iPhone laden.
2. SOLV → `REAL ANSUR REPAIR · PRAGMATIC REPAIR 1.2`.
3. Falls nötig die letzte v0.8.26.3 `Sammy_REAL_ANSUR_PRAGMATIC_REPAIR_*.json` importieren.
4. Fünf-Körper-Lauf einmal ausführen.
5. Final-/Vorherkörper visuell prüfen, insbesondere Thorax, Schulterrahmen, sehr kleine Frau und schwerer Mann.
6. FULL PRA JSON exportieren und auswerten.

## Entscheidungsregel

### Wenn typische Körper plausibel konvergieren

- ein letzter 10er Real-ANSUR Sanity Run mit derselben routing-v2 Architektur,
- danach Body Lab v1 als praktische Avatar-Baseline einfrieren,
- Few-Measure Prediction auf 902 unangetasteten Testpersonen,
- Nutzer-Eingabemaske und optionale leicht verständliche manuelle Formkorrekturen.

### Wenn einzelne Restmaße bleiben

Nur dann weiterarbeiten, wenn die PRA-1.2-Diagnose einen klaren Grund liefert:

- `tradeoff-or-no-improving-step` → echte Zielkonkurrenz / mögliche Morphraumgrenze,
- `capacity-limited` → vorhandene anatomische DOFs reichen lokal nicht,
- echter `adaptive-bound` → ±115/130 % sinnvoll prüfen,
- visuelle Artefakte trotz guter Maße → Form-/Morphqualität, nicht Solver-Mathematik.

Kein weiterer breiter Solver-Architektur-Suchlauf ohne konkrete Evidenz.
