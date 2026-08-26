# SAMMY v0.8.25.0 — SOLVER V2 PROOF 1.0

## Ziel

Erster entscheidender Blind-Inverse-Nachweis für Solver V2 auf Basis des bestehenden Morph-Observatory-Deep-Laufs. Der Proof ersetzt **nicht** die Messdefinitionen und friert den Production-Solver noch **nicht** ein. Er soll beantworten, ob die inverse Richtung auf dem echten parametrischen Mesh reproduzierbar funktioniert.

## Wissenschaftliche Grenze

- Messdefinitionen und Operatoren bleiben `ANSUR24-PROT-v2` aus v0.8.24.26.
- Der Deep-Lauf liefert nur sex-spezifische Morph-Hierarchie, Rollen, Regionen und gekoppelte Achsen.
- Für die sieben Repair-v1.6-Maße (`biacromial_breadth`, `neck_circumference`, `neck_base_circumference`, `thigh_circumference`, `tibiale_height`, `shoulder_length`, `upperarm_length`) werden **keine alten Deep-Interaction-Residuals** numerisch benutzt.
- Jede Solver-Ableitung wird am aktuellen echten Mesh frisch über die 10 ANSUR MeasurementStates vermessen.
- Acromion-abhängige Ziele werden deshalb nur für tatsächlich ausgewählte DOFs frisch kalibriert.
- Der v1.7-Freeze-Gate-Status wird nicht in einen künstlichen PASS umgedeutet. Seine Support-/Acromion-Diagnostik wird für diesen Proof als Reliability-/Unsicherheitskontext behandelt; der Proof verändert dafür die Messoperatoren nicht erneut.

## Proof-Aufbau

### Blind Round-trip
Versteckte Modellkörper werden deterministisch erzeugt. Der Solver erhält davon ausschließlich Geschlecht, Alter und die 24 ANSUR24-PROT-v2-Zielmaße. Ground-Truth-Shape, zusätzliche Maße und Rig-Geometrie bleiben bis zur Auswertung vom Solverpfad getrennt.

### Mehrere Seeds
Jeder Zielkörper wird von weit getrennten Startkörpern rekonstruiert. Damit wird nicht nur der beste Fit, sondern auch Seed-Reproduzierbarkeit geprüft.

### Typical + Edge
Die Zielkörper enthalten normale sowie randnähere, aber durch Plausibilitäts-/Anthro-Guards kontrollierte Formen.

### Conflict Controls
Absichtlich gegeneinander verschobene Zielvektoren testen, ob der Solver unerreichbare/widersprüchliche Maße als problematisch markiert, statt den Körper unkontrolliert zu verformen. Diese Controls sind diagnostisch und entscheiden das Hauptgate nicht allein.

### Direction B / Rescue
Wenn ein Seed klar scheitert, wird im selben Build einmalig eine zweite Kandidatenstrategie versucht: Deep-Zahlenvektoren werden für das Ranking ignoriert; die Auswahl erfolgt semantisch/strukturell aus Morph-Rollen und betroffenen Regionen. Die numerische Jacobian-Matrix wird trotzdem vollständig frisch am echten Mesh gemessen. Dadurch kann ein Deep-Ranking-Problem von einem grundsätzlichen Inverse-Solver-Problem getrennt werden, ohne eine zweite Appvariante zu bauen.

## Bewertungsgrößen

Primär:
- 24 Zielmaß-Residuen in cm
- Residuen in ANSUR Allowable-Observer-Error Units
- Reliability-gewichteter Protocol-Unit-RMS
- Seed-Akzeptanz und Seed-Streuung
- Mesh-/Form-Plausibilitätsguard

Sekundär:
- zusätzliche, nicht als Solverziel verwendete Sammy-Maße als Holdout
- Rig-/Segment-Geometrie als Holdout
- Parameter-Recovery-RMS nur diagnostisch, weil mehrere Parametervektoren messäquivalent sein können
- ANSUR Conditional Prior nur als Ziel-/Ergebnisdiagnostik

## Reliability

Nicht physikalisch vollständig simulierbare Protokollbedingungen werden explizit geringer gewichtet statt per Messoperator versteckt korrigiert. In Proof 1.0 betrifft das insbesondere Chest Breadth sowie Flexed Upperarm/Forearm; Wrist/Lowerarm bleiben guarded. Repair-v1.6-Maße werden nicht pauschal abgewertet, sondern frisch nachgemessen.

## Modi

- **Quick:** 4 Blindkörper, davon 1 Edge, 2 Seeds + 1 Conflict-Control; 4 Trust-Region-Pässe, 8 Kandidaten.
- **Standard:** 8 Blindkörper, davon 2 Edge, 3 Seeds + 2 Conflict-Controls; 6 Pässe, 10 Kandidaten. Das ist der vorgesehene Entscheidungslauf.
- **Deep:** 12 Blindkörper, davon 4 Edge, 3 Seeds + 2 Conflict-Controls; 8 Pässe, 12 Kandidaten.

Nach jedem vollständig berechneten Seed wird der Lauf in IndexedDB gespeichert. Ein Neustart kann den unvollständigen Proof fortsetzen; höchstens der gerade nicht vollständig gespeicherte Seed wird wiederholt.

## Proof-Gate

Standard-PASS verlangt u. a.:
- mindestens 87,5 % Round-trips ohne FAIL
- mindestens 62,5 % direkte PASS-Ziele
- gewichteter Protocol-Unit-RMS ≤ 1,10
- Gesamt-RMSE ≤ 0,70 cm
- mindestens 65 % akzeptierte Seeds
- Median Holdout-RMSE ≤ 1,20 cm
- mittlere abgeleitete Seed-Streuung ≤ 0,90 cm
- max. High-Reliability-Fehler ≤ 3,0 Protocol Units
- kein harter Plausibilitätsbruch beim jeweils besten Zielergebnis

WARN ist bewusst breiter. FAIL bedeutet nicht automatisch „Projektansatz unmöglich“; FULL JSON + Direction-B-Muster sollen zeigen, ob Kandidatenhierarchie, lokale Konditionierung, bestimmte Maße oder die inverse Architektur selbst scheitern.

## UI

`LAB → SOLV` öffnet jetzt `SOLVER V2 · PROOF 1.0`. Der bisherige `SOLVER24 · V2.1` bleibt unverändert als eingeklappte Legacy-Baseline erhalten.

Wenn der abgeschlossene Deep-Lauf im Browser-IndexedDB nicht mehr vorhanden ist, kann einmalig das bereits exportierte `Sammy_MORPH_OBS_FULL_deep_*.json` direkt im SOLV-Panel ausgewählt werden. Es wird kein neuer Deep-Lauf verlangt.

`AUDT` kann nach Abschluss die jeweils beste Blindrekonstruktion pro Round-trip-Ziel anonymisiert anzeigen und exportiert den korrekten Solver-V2-Proof-Quelltyp.

## Empfohlener Testablauf

1. App starten und prüfen, dass `v0.8.25.0` angezeigt wird.
2. `LAB → SOLV` öffnen. Oben muss `Deep bereit` erscheinen. Falls nicht: vorhandenes `MORPH_OBS_FULL_deep` JSON auswählen.
3. Zuerst **Quick** starten, um Boot, Source-Mapping, Speicherung, Pause/Resume, Summary/FULL-Export und AUDT-Pfad zu verifizieren.
4. Wenn Quick technisch sauber durchläuft, **Standard** als eigentlichen Entscheidungslauf starten.
5. Nach Abschluss `Summary JSON` und `FULL JSON` exportieren. Für die Richtungsentscheidung ist insbesondere `summary.gate`, `summary.overall`, das Ziel-/Seed-Muster und `fallbackAttemptedSeeds/fallbackAcceptedSeeds` relevant.
6. `Blind Audit öffnen` und die sichtbaren Bestlösungen nur auf klare anatomische Fehler prüfen; danach Audit JSON exportieren.

## Unverändert

- Bootstrap / Startpfad
- Anny/SOMA Shape- und Rig-Packs
- PROT / ANSUR24-PROT-v2 Messdefinitionen und MeasurementStates
- Morph Observatory / Atlas v2.9 / Morph Sections v2.1
- ANSUR Lab
- bestehender Solver24 V2.1 als Legacy-Baseline
