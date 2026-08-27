# REAL ANSUR REPAIR · REPRESENTABILITY LAB 1.0 · v0.8.26.1

## Zweck

Stress Gate 1.0 hat gezeigt, dass der eingefrorene Proof-1.6-Solver Sammy-generierte Körper gut invertiert, reale held-out ANSUR-Messprofile aber noch nicht ausreichend repräsentiert. v0.8.26.1 baut deshalb **keinen neuen Solver**, sondern ein fokussiertes Diagnose-Lab zwischen Real-ANSUR-Stress und Few-Measure Prediction.

Das Lab soll für die wichtigsten systematischen Restfehler unterscheiden:

1. **Solver/Convergence** – vorhandene Freiheitsgrade können das Ziel lokal erreichen, wurden im eigentlichen Solve aber nicht passend genutzt.
2. **Morphraum / parametrische Basis** – ein hochverlässliches Ziel bleibt auch in einem kontrollierten lokalen Probe-Bereich außerhalb des erreichbaren Bereichs.
3. **ANSUR↔Mesh-Messbrücke** – die physische ANSUR-Messbedingung ist aus dem Oberflächenmesh nicht vollständig reproduzierbar; deshalb darf ein Residuum nicht automatisch als Formfehler interpretiert werden.
4. **Composition-Regularisierung** – mehrere 3D-Formen erklären ähnliche Maße, aber die Lösung wählt unnötig viel Muskeldefinition.
5. **Surface Quality** – lokale Normalenwechsel an der seitlichen Torsooberfläche werden zusätzlich als Vergleichsdiagnose protokolliert.

## Datenhygiene

Es werden ausschließlich fünf **bereits in Stress Gate 1.0 verbrauchte** held-out Personen erneut verwendet:

- `typical-male-a`
- `typical-male-b`
- `edge-male-heavy`
- `typical-female-a`
- `edge-female-short`

Es werden **keine neuen ANSUR-Testzeilen konsumiert**. Die 902-Personen-Reserve für die spätere Few-Measure-Endvalidierung bleibt unangetastet.

## Quelle

Standardmäßig übernimmt das Lab den letzten vollständigen `sammy-solver-v2-real-ansur-stress-v1`-Run aus der bestehenden Safari/IndexedDB. Alternativ kann die FULL-JSON des Stresslaufs importiert werden. Für einen resumierbaren Diagnose-Checkpoint werden Solver-Map, fünf Zielvektoren und die fünf fertigen Best-Rekonstruktionen in den neuen Lab-Run kopiert.

## Kontrollierte lokale Probes

Ausgehend von der fertigen Stress-Lösung werden ausschließlich bereits vorhandene relevante Solver-DOFs frisch am realen Mesh sondiert. Die Auswahl umfasst je nach verfügbarer Solver-Map u. a.:

- `core:weight`, `core:muscle`, `core:proportions`
- gekoppelte Torso-Breite/Tiefe
- `torso-vshape`
- Pectoral / Dorsi
- Bust / Underbust / Waist-Circumference
- Shoulder-Distance
- Buttocks Volume
- Lowerarm Fat / Muscle / Scale

Jeder Probe-Shape wird durch `ANSUR24-PROT-v2` frisch vermessen. Es werden keine alten Influence-Vektoren als Messersatz verwendet.

### Klassifikation

Für `chest_breadth`, `biacromial_breadth` und `forearm_circumference` wird ein kontrollierter lokaler Bereich gebildet. Eine Probe gilt nur dann als „geschützt“, wenn definierte Nachbarmaße gegenüber der fertigen Stress-Lösung nicht stark driften.

- **Solver/Convergence:** Ziel liegt im geschützten lokalen Bereich.
- **Morphraum:** hochverlässliches Ziel liegt außerhalb des geschützten lokalen Bereichs.
- **Messbrücke + Morphraum:** Ziel liegt außerhalb, aber die Messdefinition selbst enthält ungelöste Bedingungen.
- **Messzustand:** bekannte Pose-/Soft-Tissue-Bedingung ist nicht physisch reproduziert.

Diese Klassifikation ist eine **lokale Diagnose**, kein mathematischer Beweis globaler Unmöglichkeit.

## Chest Breadth

Die bestehende ANSUR24-PROT-v2 Definition bleibt unverändert und ausdrücklich reduziert gewichtet. Ungelöst bleiben:

- Rib-Cage-Kompression durch Beam Caliper,
- Brustgewebe-Ausschluss,
- Full-Inspiration-Volumen.

Darum darf ein nicht lokal erreichbares Chest-Breadth-Ziel nicht automatisch in einen neuen Thorax-Morph übersetzt werden. Mapping und Basis werden zunächst getrennt weiter untersucht.

## Forearm Circumference, Flexed

Das Maß bleibt `reduced`, weil maximaler Muskelbulge und Faustdeformation nicht simuliert werden. Das Lab soll verhindern, dass Sammy einen Ruhe-/Standardmesh künstlich aufbläht, nur um einen Max-Flexed-ANSUR-Wert zu erzwingen.

## Composition Probe

Wenn die fertige Lösung deutlich mehr `core:muscle` verwendet als das train+validation-only statistische Muskelzentrum, werden zwei zusätzliche echte Mesh-Zustände geprüft:

- halb zwischen fertiger Lösung und statistischem Zentrum,
- direkt am statistischen Muskelzentrum.

Ist der Fit-Verlust am statistischen Zentrum klein (<= 0,40 gewichtete Observer-Units), wird das als **Regularisierungsdruck** klassifiziert. Ist der Verlust groß, spricht das eher dafür, dass die aktuelle Formbasis Muskel als Ersatz für fehlende Soft-Tissue-/Volumen-Freiheit benötigt.

Als Composition-Druck gilt aktuell diagnostisch ein Muskel-Delta >= 0,16 oder eine nahezu maximale Muskeldefinition >= 0,88 bei Delta >= 0,10. Diese Schwellen sind Diagnoseheuristiken und kein Produktions-Gate.

## Torso Normal Continuity

Zusätzlich wird aus dem echten Low-LOD-Restmesh eine lokale Vertex-Normalen-Diagnose an den seitlichen Torsoflächen berechnet. Exportiert werden u. a. maximaler und RMS-Winkel zwischen benachbarten Höhenbändern. Es gibt **noch keine validierte Grad-Schwelle**. Ziel ist zunächst der direkte Vergleich beanstandeter männlicher Körper gegen weibliche Kontrollkörper.

## Wissenschaftliche Invarianten

Unverändert gegenüber v0.8.26.0:

- `ANSUR24-PROT-v2` Messoperatoren und MeasurementStates
- Reliability-Gewichte
- Repair-v1.6 Policy
- Proof-1.6 Fit-/Objective-/Gate-Mathematik
- Statistical Body Bank / train+validation-only Prefit
- Hierarchie und Canonical Multistart
- Final Wide + bounded Polish
- Real-ANSUR Stress Suite
- 902-Personen Prediction-Reserve

## Nächste Entscheidung

Nach dem Diagnose-Lauf werden **keine fünf neuen Appvarianten** gebaut. Die Ergebnisse sollen direkt bestimmen, welcher gezielte Repair nötig ist:

- lokale Solver-Kapazität vorhanden → Ranking/Konvergenz korrigieren;
- hochverlässliche Breiten nicht erreichbar → parametrische Basis gezielt erweitern;
- Chest-Breadth-Brücke dominant → Messmapping/Proxy kalibrieren;
- Muscle-Prior kostet kaum Fit → Composition-Regularisierung stärken;
- Muscle-Prior kostet viel Fit → zusätzliche Soft-Tissue-/Volumen-Freiheit priorisieren.

Erst nach diesem Repair und einem kompakten Re-Test wird der 10er Real-ANSUR-Gate einmal erneut ausgeführt. Danach kann die Few-Measure Prediction Validation beginnen.
