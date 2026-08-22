# SAMMY v0.8.18.1 · ANSUR Protocol Audit

Quelle: NATICK/TR-11/017 · Measurer’s Handbook: US Army and Marine Corps Anthropometric Surveys, 2010-2011.

## Verifizierter Stand

- 24 Sammy-ANSUR-Ziele insgesamt: 22 direkte Handbook-Dimensionen + 2 ausdrücklich abgeleitete Sammy-Ziele.
- 102 Felder der 22 direkten Dimensionen (Description/Landmarks/Procedure/Instrument/Caution, soweit vorhanden) wurden exakt gegen die jeweiligen PDF-Seiten geprüft: 0 Abweichungen.
- 42 relevante Landmark-Felder/Definitionen wurden gegen Kapitel 5 geprüft: 0 Abweichungen.
- 22 Appendix-G-Werte für Allowable Observer Error wurden gegen die Tabellen auf PDF-Seiten 235–237 (gedruckte Seiten 225–227) geprüft: 0 Abweichungen.
- Alle Referenzbilder liegen flach im Repository-Root; keine Unterordner und keine Bildpfade mit Unterordnern.

## Maßmatrix

| Sammy-ID | ANSUR-Quelle | PDF | Pose | Region | Allowable Observer Error |
|---|---|---:|---|---|---:|
| `stature` | 6.4.76 Stature | 162 | standing | `whole` | 6 mm |
| `biacromial_breadth` | 6.4.9 Biacromial Breadth | 95 | sitting | `shoulder` | 8 mm |
| `chest_circumference` | 6.4.25 Chest Circumference | 111 | standing | `torso` | 14 mm |
| `chest_breadth` | 6.4.24 Chest Breadth | 110 | chest_breadth_measure | `torso` | 7 mm |
| `chest_depth` | 6.4.26 Chest Depth | 112 | standing | `torso` | 4 mm |
| `waist_circumference` | 6.4.88 Waist Circumference (Omphalion) | 174 | standing | `torso` | 12 mm |
| `waist_breadth` | 6.4.87 Waist Breadth | 173 | standing | `torso` | 6 mm |
| `waist_depth` | 6.4.89 Waist Depth | 175 | waist_hand_chest | `torso` | 6 mm |
| `buttock_circumference` | 6.4.17 Buttock Circumference | 103 | standing | `pelvis` | 12 mm |
| `hip_breadth` | 6.4.51 Hip Breadth | 137 | hip_arms_away | `pelvis` | 6 mm |
| `crotch_height` | 6.4.28 Crotch Height | 114 | standing | `pelvis` | 10 mm |
| `torso_height` | DERIVED: Acromial Height - Crotch Height | 88 / 114 | standing | `whole` | kein direkter ANSUR-Wert; Quellen: Acromial Height 7 mm, Crotch Height 10 mm |
| `neck_circumference` | 6.4.63 Neck Circumference | 149 | standing | `neck` | 6 mm |
| `neck_base_circumference` | 6.4.64 Neck Circumference, Base | 150 | standing | `neck` | 8 mm |
| `wrist_circumference` | 6.4.93 Wrist Circumference | 179 | wrist_90 | `rightArm` | 3 mm |
| `thigh_circumference` | 6.4.79 Thigh Circumference | 165 | thigh_special | `rightThigh` | 6 mm |
| `calf_circumference` | 6.4.22 Calf Circumference | 108 | lowerleg_10cm | `rightCalf` | 4 mm |
| `ankle_circumference` | 6.4.5 Ankle Circumference | 91 | lowerleg_10cm | `rightAnkle` | 4 mm |
| `waist_back_length` | 6.4.86 Waist Back Length (Omphalion) | 172 | standing | `torso` | 5 mm |
| `upperarm_length` | 6.4.3 Acromion-Radiale Length | 89 | standing | `rightArm` | 4 mm |
| `lowerarm_length` | 6.4.68 Radiale-Stylion Length | 154 | arm_relaxed_palm_forward | `rightArm` | 6 mm |
| `tibiale_height` | 6.4.82 Tibial Height | 168 | standing | `rightLeg` | 2 mm |
| `upperleg_height` | DERIVED: Trochanterion Height - Tibial Height | 170 / 168 | standing | `rightLeg` | kein direkter ANSUR-Wert; Quellen: Trochanterion Height 4 mm, Tibial Height 2 mm |
| `shoulder_length` | 6.4.71 Shoulder Length | 157 | standing | `shoulder` | 3 mm |

## Wichtige technische Korrekturen in 0.8.18.1

- Undrawn landmarks Crotch, Buttock posterior und Vertex zeigen nun ihre vorhandenen Handbook-Seiten 31/32 im Inspector.
- Appendix G ist pro Maß direkt als Richtwert-Quelle erreichbar. Der Wert wird ausdrücklich als Beobachter-/Reproduzierbarkeitsgrenze gekennzeichnet, nicht als Populationsperzentil oder Solver-Residual.
- Für `torso_height` und `upperleg_height` wird kein kombinierter ANSUR-Grenzwert erfunden; nur die offiziellen Fehlergrenzen der Quellmaße werden gezeigt.
- Bilaterale Landmark-Gruppen sind fest gespiegelt gekoppelt. Bei gemischten Gruppen wie Omphalion oder Neck Base bleiben Mittellinienpunkte bei X/lateralen Korrekturen auf der Mittellinie.
- Anatomische Region-Masks besitzen keinen Whole-Body-Fallback mehr. Fehlen Skinweights/Regiondaten, bleibt die Region leer statt fremde Geometrie einzufangen.
- Der Fortschrittszähler zählt ein Maß erst, wenn Landmark(s), alle erforderlichen Pose-Schritte und das Messprotokoll selbst freigegeben wurden.
- Pose-Presets sind reproduzierbare Rig-Startwerte, aber reale Bedingungen wie Gewichtsverteilung, 10-cm-Fußabstand, der 8-cm-Sitzkantenabstand und Atemvolumen werden nicht fälschlich als automatisch exakt gelöst dargestellt.

## Sicherheitsgrenze

PROT bleibt ein Audit-Layer. Die Produktionsdefinitionen in MEAS/R5/DIMENSIONS werden durch diese Version nicht automatisch ersetzt. Erst manuell freigegebene Landmark-/Pose-/Protokollentscheidungen sollen in eine spätere Produktions-Messpipeline übernommen werden.
