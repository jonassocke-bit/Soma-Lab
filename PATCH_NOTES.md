SAMMY v0.8.24.17 PATCH
Atlas v2.9 · PROT anatomical zoom + Deep metadata cleanup

Basis
- v0.8.24.16
- Boot-/MORF-Startpfad unverändert.
- Profile Section v2.1 und Atlas-Bein-Pose-Sync aus v0.8.24.16 bleiben unverändert.
- Solver24 / PROT-v2 Definitionen / ANSUR-Messoperatoren werden nicht verändert.

Geänderte Dateien
- app.js
- index.html

Änderungen
1. PROT-Streifen als anatomischer Zoom
- Der PROT-Snapshot wird weiterhin im echten ANSUR24-PROT-v2 MeasurementState erzeugt.
- Statt des kleinen Ganzkörpers wird automatisch um die tatsächlich gemessene Linie / den Messring gecroppt.
- Limb-Maße bekommen ausreichend Segmentkontext; Chest-Maße einen breiteren Thorax-Kontext.
- Messlinie wird nach dem Crop neu in den Zoom transformiert und stärker gezeichnet.

2. Section-N/A statt False-Fail
- Für Morphs ohne semantisch erwartete Extremitäten-Section gilt jetzt:
  sectionPoseSyncApplicable = false
  sectionPoseSyncOk = null
- Diese Fälle sind N/A und werden nicht mehr als fehlgeschlagener Section-Sync interpretiert.

3. PROT-Caveats für Deep explizit markiert
- unresolved / pending PROT-Bedingungen => protocolEvidenceClass = provisional
- protocolSolverWeightHint = reduced
- Standardpfade => protocolEvidenceClass = standard / normal
- Nur Atlas-/Manifest-Metadaten. Solver24 wird NICHT verändert.
- Im PROT-Streifen erscheint bei provisional: "PROT PROVISORISCH · DEEP ↓".

4. Atlas-Metadaten erweitert
- protocolZoomMode
- protocolCropRect
- protocolEvidenceClass
- protocolSolverWeightHint
- protocolPendingConditions
- sectionPoseSyncApplicable

Kompatibilität
- Abgeschlossene MORF-Läufe aus 0.8.24.13–0.8.24.16 werden weiter geladen.
- Für den visuellen v2.9-Test ist kein neuer Quick nötig.
- Nach visueller Abnahme ist ein letzter neuer Quick als Deep-Gate vorgesehen.
