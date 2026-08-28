# Sammy v0.8.26.6 · Solver Shape Layer 1.0

v0.8.26.6 setzt den bestätigten Morph↔Messebene-Versatz als getrennte Solver-Schicht um.

## Neu
- neuer `SOLVER SHAPE LAYER · REPAIR 1.0`-Lauf auf den fünf bekannten Alignment-Körpern.
- kanonische ANSUR24-PROT-v2-Messungen bleiben unverändert und werden vor/nach Shape-Reparaturen frisch neu gemessen.
- feste, auf der Ausgangsform gelockte Regionalbänder für Chest, Abdomen, Thigh und Upperarm.
- Thorax Breadth/Depth werden zusätzlich über ein +2/+4/+6-cm-Band optimiert, während Chest Circumference im Shape-Objective auf der gelockten kanonischen Ausgangsebene bleibt; echtes ANSUR24 wird separat neu gemessen.
- Upper-Abdomen-Width-Envelope gegen seitliche Torso-Wellen.
- `stomach-pregnant-incr` wird als neutraler lokaler DOF **Abdominal Projection** konditional zugelassen, wenn Umfang und Tiefe fehlen, ohne eine bereits zu schmale Taille weiter zu umgehen.
- Upper-Thigh- und Upperarm-Band-Maxima als sichtbare Form-Proxies.
- frische lokale Shape-Jacobians + bounded Least-Squares/Line-Search.
- Torso- und Final-Checkpoint-Rollback bei kanonischer Regression.
- direkte Vorher-/Shape-Layer-Anzeige pro Fall.
- JSON-Export `Sammy_SOLVER_SHAPE_LAYER_<runId>.json`.

## Unverändert
- ANSUR24-Protokoll und MeasurementStates.
- Reliability und Observer-Error-Skalierung.
- Solver V2 Proof 1.6 / Routing-v2 / canonical multistart / bounded Polish.
- v0.8.26.4 Pragmatic Residual Convergence.
- Statistical Body Bank und Prediction-Splits.
- 902-row Prediction-Endreserve.

## Testziel
Nicht beweisen, dass die verschobenen Shape-Features "richtige ANSUR-Messungen" sind. Geprüft wird, ob die vorhandenen Anny-Morphs damit sichtbar bessere, produktnähere Körper erzeugen können, ohne die kanonisch wichtigen Größen relevant zu verschlechtern.
