# Real ANSUR Pragmatic Repair 1.2 — v0.8.26.4

## Zweck

PRA 1.2 ist der kurze Fünf-Körper-Runtime-Test für die Solver-Architekturkorrekturen aus v0.8.26.4. Es werden **keine neuen ANSUR-Personen verbraucht** und kein voller Stress-/Proof-Lauf wiederholt.

## Ablauf pro Körper

1. Ausgangskörper aus dem vorhandenen Representability/PRA-Kontext laden.
2. Begrenzte Thorax-, Frame- und Soft-Tissue-Vorbereitung innerhalb normaler ±100-%-Bounds.
3. Residual Convergence v1.2:
   - produktkritische Restfehler zuerst,
   - anatomischer Pool bis 5 DOFs,
   - frischer real-mesh Jacobian auf dem aktuellen Körper,
   - maximal 3 numerisch gute DOFs,
   - predictive landing + real-mesh line search,
   - persistent lock bereits guter kritischer Maße,
   - max. 12 Aktionen / max. 2 gleiche Fokusaktionen in Folge,
   - state-local stall / capacity-limited Diagnose,
   - adaptive ±115/130 % ausschließlich bei echtem lokalen Bound-Block.
4. Optionaler Composition-Settle, nur wenn individuelle kritische Locks erhalten bleiben.
5. Export von Baseline, Final, Kandidaten, frischen Ableitungen, Predicted-Dx, Capacity, Bound-Block, Locks, Stalls und Best-Checkpoint.

## Bewertungsphilosophie

Dieser Lauf ist absichtlich **kein 24/24 Observer-Error Gate**. Produktkritisch sind insbesondere Körperhöhe, Schulterrahmen, Brust-/Taillen-/Gesäßumfang sowie relevante Torso-/Schulterlängen. Formmaße bleiben unterstützend; Flexed Forearm bleibt nahezu diagnostisch.

Extremkörper sind Robustheitsdiagnose, dürfen aber nicht allein das Produkt blockieren.

## Erwartete Entscheidung

Wenn typische Körper mit anatomisch plausiblen Reglern in praktische Toleranzen konvergieren und der visuelle Vorher/Nachher-Vergleich plausibel bleibt, folgt **ein letzter 10er Real-ANSUR Sanity Run**. Danach wird Body Lab v1 eingefroren und die Few-Measure Prediction auf der unangetasteten 902er Reserve gebaut.

Wenn ein Restfehler trotz korrektem Routing, frischer Ableitung und freiem Stellweg `tradeoff`, `capacity-limited` oder echten Bound-Block zeigt, ist das belastbarere Evidenz für eine tatsächliche Morphraum-/Mapping-Grenze als in den früheren Läufen.
