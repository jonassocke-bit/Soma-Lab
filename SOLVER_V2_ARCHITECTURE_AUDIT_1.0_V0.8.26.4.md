# Solver V2 Architecture Audit 1.0 — v0.8.26.4

## Ziel

v0.8.26.4 ist kein neuer Solver und keine neue Messdefinition. Der Patch prüft die vorhandene Solver-V2-Architektur gegen die seit Real-ANSUR beobachteten Fehlbilder und korrigiert Routing-, DOF- und Residual-Optimierungsfehler, die vorhandene Geometriefreiheit bisher unvollständig oder fachlich falsch genutzt haben.

Die folgenden Schichten bleiben getrennt:

1. **Messdefinition / ANSUR-Protokoll** — unverändert.
2. **Geometrische Messung am realen Mesh** — unverändert.
3. **ANSUR↔Sammy-Mapping / Reliability** — unverändert.
4. **Solver / Optimierung** — hier wird Routing und DOF-Darstellung korrigiert.
5. **UI / Diagnose** — PRA 1.2 erklärt die neue Routing-Logik.

## Audit-Befunde und Korrekturen

### 1. Reparierte Maßzeilen durften noch indirekt alte Deep-Hinweise verwenden

Die sieben Repair-v1.6-Zeilen hatten ihre alten numerischen Influence-Werte korrekt auf null gesetzt, aber `topMeasureIds` blieb in alten SolverMaps vorhanden. Dadurch konnte bei Gleichstand die historische Metadaten-/Sortierreihenfolge entscheiden. Das erklärte unter anderem fachfremde Kandidaten beim Oberschenkel.

**Fix:** Für

- `biacromial_breadth`
- `neck_circumference`
- `neck_base_circumference`
- `thigh_circumference`
- `tibiale_height`
- `shoulder_length`
- `upperarm_length`

werden alte numerische Vektoren **und** alte Top-Measure-Hints im Solver vollständig ignoriert. Diese Zeilen werden nur noch über anatomisches Routing in den Kandidatenpool gebracht und anschließend durch einen **frischen real-mesh Jacobian** numerisch bewertet.

### 2. Candidate-Auswahl war nicht anatomisch hart genug

Ein großer statischer Effekt oder ein alter Hint konnte fachfremde Morphs in die Top-Kandidaten bringen. Ein Brust-/Cupsize-Morph darf beispielsweise niemals primärer Kandidat für einen Oberschenkel-Residual sein.

**Fix:** `SAMMY_SOLVER_V2_MEASURE_ROUTES` definiert für jedes der 24 Maße drei Ebenen:

- **direct** — direkte Ziel-/Frame-Regler,
- **regional** — anatomisch passende Nachbar-/Formregler,
- **core** — erlaubte globale Fallback-Achsen.

Unverwandte lokale Regionen erhalten Route-Affinity 0 und werden aus dem Residual-Pool ausgeschlossen. Beispiel: Thigh akzeptiert Upperleg/Thigh und passende globale Masseachsen; Cupsize/Breast/Neck sind ausgeschlossen.

### 3. Depth/Horizontal wurden vorzeitig fusioniert

Morph Observatory dokumentiert `coupled-axis candidate` nur als Hypothese. Der alte SolverMap-Builder fusionierte solche Paare trotzdem zu einer einzelnen Solvervariable. Dadurch ging beispielsweise beim Torso die Freiheitsrichtung verloren, Breite und Tiefe gegeneinander zu verändern.

**Fix:** Neue SolverMaps behalten alle Raw-DOFs getrennt. Alte SolverMaps werden beim Laden rückwärtskompatibel migriert: mehrgliedrige gekoppelte Variablen werden in einzelne **fresh-only** Achsen aufgespalten. Eine gekoppelte Richtung kann weiterhin durch den Jacobian gemeinsam benutzt werden, ist aber nicht mehr die einzige verfügbare Richtung.

### 4. Direkte Wrist/Ankle-Zielmorphs konnten vor der Solver-Policy herausgefiltert werden

Die Calibration-Policy verlangte bestimmte direkte Zielmorphs, aber die breite Morph-Observatory-Kategoriefilterung konnte einzelne davon schon vorher entfernen.

**Fix:** Die explizit erforderlichen Zielmorphs (`wrist`, `ankle`, `calf`, `lowerleg height`) umgehen den breiten Category-Filter. Alte Maps erhalten fehlende direkte Zielkontrollen beim Resolve als **fresh-only supplements**.

### 5. Anatomische Familienerkennung war zu substring-abhängig

`measure-thigh-circ-incr` konnte als `other` statt `upperleg` klassifiziert werden; Bust/Underbust/Frontchest waren ebenfalls nicht sauber genug mit dem Thorax verbunden.

**Fix:** Synonyme und anatomische Begriffe wurden erweitert. Für Solver-Routing ist zusätzlich die explizite Measure-Route maßgeblich; die automatische Familie ist nur noch Hilfsmetadatum, nicht alleinige Wahrheit.

### 6. Residual-Schritte waren künstlich klein

v0.8.26.3 kannte zwar lokale Ableitungen, beschnitt den resultierenden Restfehler-Schritt aber grob auf ±0.14 bei Local bzw. ±0.045 bei Core. Ein aus `residual / derivative` klar erkennbarer Zielweg musste dadurch in viele kleine Iterationen zerfallen.

**Fix:** Predictive Residual Landing verwendet den gemessenen Jacobian für eine regularisierte Newton-/Least-Squares-Richtung. Trust-Region jetzt bis ca. ±0.45 Local / ±0.16 Core, zusätzlich durch echte Bounds begrenzt. Wenn die lineare Vorhersage den Fokus überschießen würde, wird die Richtung auf etwa 90 % der erwarteten Korrektur skaliert. Danach entscheidet weiterhin ausschließlich eine **frische Mesh-Neuvermessung** per Line Search.

### 7. Die richtigen DOFs konnten vor der frischen Messung ausgesiebt werden

Zuvor wurden bis zu drei Kandidaten ausgewählt und erst danach frisch gemessen.

**Fix:** Anatomischer Pool bis zu fünf Variablen → alle fünf frisch messen → erst danach maximal drei anhand echter lokaler Ableitung, verfügbarer Reststrecke und Kollateraleffekt auswählen.

### 8. Starres 6-Runden-Budget konnte von einem Maß monopolisiert werden

Ein schwieriges Maß konnte alle sechs Aktionen verbrauchen, obwohl andere Fehler leichter lösbar waren.

**Fix:** PRA Residual Convergence v1.2:

- max. 12 Aktionen,
- produktkritische Maße vor Support-Maßen,
- max. zwei aufeinanderfolgende Aktionen auf dasselbe Maß, solange andere kritische Residuals existieren,
- max. vier Versuche pro Maß,
- Capacity-Diagnose kann aussichtslose Restfehler früh als `capacity-limited` markieren.

### 9. `stalled` war zu permanent

Ein Maß konnte nach einem fehlgeschlagenen Versuch dauerhaft ausgeschlossen werden, obwohl nach Änderungen anderer Regionen ein neuer Körperzustand und neue lokale Ableitungen entstanden.

**Fix:** Stall ist jetzt **state-local**. Nach einer relevanten akzeptierten Körperänderung darf ein zuvor gestalltes Maß erneut frisch geprüft werden; wiederholte echte Stalls bleiben begrenzt.

### 10. Bereits gute kritische Maße konnten schleichend herausdriften

Die alte Guard-Logik verglich primär mit dem jeweils vorherigen Zustand. Mehrere kleine Verschlechterungen konnten kumulativ ein ehemals gutes kritisches Maß aus seiner Toleranz bewegen.

**Fix:** Persistent Locks. Ein kritisches Maß, das beim Residual-Start oder später innerhalb seiner Produkttoleranz liegt, bleibt über spätere Schritte mit kleiner Sicherheitsmarge geschützt. Die Composition-Settle-Stufe respektiert dieselben Locks.

### 11. Der letzte akzeptierte Zustand war nicht zwingend der beste Zustand

Mehrere lokal akzeptable Trades konnten den Gesamtzustand später geringfügig verschlechtern.

**Fix:** Residual Convergence speichert den besten Checkpoint nach kombinierter kritischer/Product-Bewertung und kann am Ende dorthin zurückrollen.

### 12. ±115/130 % war semantisch nicht eng genug gebunden

Coarse PRA-Stages bekamen teilweise bereits `limit=1.15`. Außerdem konnte ein einziger bound-blocked Kandidat dazu führen, dass mehrere Kandidaten mit erweitertem Limit bewertet wurden.

**Fix:** Thorax/Frame/Soft laufen strikt in normalen Bounds. Adaptive Extension wird erst nach einem **frisch nachgewiesenen Bound-Block** versucht und öffnet nur die tatsächlich blockierten lokalen DOFs zunächst auf ±1.15, danach maximal ±1.30. Core-Achsen werden nicht extrapoliert.

## Architektur nach v0.8.26.4

`solver-v2-hierarchical-canonical-polish-routing-v2`

Die bewährte Proof-1.6-Struktur bleibt erhalten:

**Statistical/Canonical Start → Hierarchical Solve → bounded Polish**

Dazu kommt eine korrigierte Variablen-/Routing-Schicht:

**Raw DOFs → anatomischer Candidate Pool → frische Jacobian-Messung → numerische Auswahl → real-mesh-gesicherter Schritt.**

Der PRA-Nachlauf ergänzt anschließend:

**Produktkritische Residuals → Predictive Landing → Persistent Locks → state-local Stall/Capacity → echter Bound Escape nur bei Bedarf.**

## Was ausdrücklich unverändert bleibt

- ANSUR24-PROT-v2 Messoperatoren
- MeasurementStates / Pose-Logik
- Reliability-Werte
- FitMetrics und Proof-Objective
- Statistical Body Bank und Statistical Prefit-Daten
- Real-ANSUR-Stresspersonen
- 902 Personen Final Prediction Reserve
- Surface Continuity bleibt nicht gate-reif
- Flexed Forearm bleibt protocol-limited / diagnostisch

## Testgrenze

Die Offline-Buildumgebung kann den vollständigen Three.js/WebGL/Anny-Meshpfad nicht end-to-end ausführen. Deshalb enthält der Build zusätzlich ausführbare statische Self-Tests für Routing und Legacy-Map-Migration sowie exakte Hash-/Funktionsvergleiche der eingefrorenen Mess- und Datenbasis. Der erste Safari/iPhone-PRA-1.2-Lauf bleibt die Runtime-Validierung der echten Morph-/MeasurementState-Kette.
