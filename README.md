## v0.8.14.1 · ANSUR D intermediate-render fix

Hotfix auf Basis von v0.8.14. Geändert wurde nur die D-Zwischenstands-Darstellung plus Versions-/Cache-Busting. Nach dem ersten 5/6/7-Build existieren für noch nicht gelaufene Varianten naturgemäß noch keine P95-Werte; diese werden jetzt als „noch nicht berechnet“/„–“ dargestellt statt `null.toFixed()` aufzurufen. Ein bereits gespeicherter D-Lauf kann ohne Reset fortgesetzt werden.

## v0.8.14 · ANSUR LAB C/D + BODY SPACE V3

Basis: ausgelieferte v0.8.13. Scope bleibt strikt auf ANSUR/BODY SPACE und dessen Forschungs-/Validierungs-UI begrenzt. R2, R5, DIMENSIONS, MEAS, Anny/SOMA, Rig, Greeting und Startup werden nicht verändert; End-to-End D ruft den bestehenden DIMENSIONS/R5-Pfad nur als unveränderte Engine auf.

### BODY SPACE V3
- 6.068 echte ANSUR-II-Personen bleiben eine einzige `THREE.Points`-BufferGeometry (1 Draw Call).
- Avatar-Mesh im BODY SPACE aus; `DU` bleibt der Nutzer-Fokuspunkt.
- Punkte sind radial weich statt quadratisch. Beim Hineinzoomen wird ihre World-Size aktiv kleiner, sodass die projizierten Punkte in Nahansicht nicht zu großen Vierecken aufblasen; gleichzeitig werden sie moderat heller/deckender.
- Auto-Rotation pausiert nur während der aktiven Finger-Geste und läuft unmittelbar nach dem Loslassen wieder weiter.
- `DU` wird jetzt real in denselben PCA-Raum projiziert. Die aktuellen Sammy-Maße liefern die 24 PCA-Körperfeatures. Das für die PCA nötige physische Gewicht wird mit einem separaten sex-spezifischen ANSUR-Locator aus aktuellen Körpermaßen + Alter geschätzt; der Anny-`Weight`-Morph wird niemals als kg interpretiert.
- Die Wolke verschiebt sich nach Eintritt weich relativ zum fixen `DU`-Punkt an die berechnete PCA-Position des aktuellen Charakters. Die 6.068 originalen PCA-Koordinaten bleiben unverändert.
- Adaptives Mobile-LOD bleibt: nur bei gemessenen FPS-Problemen 6.068 → 3.600 → 2.200 sichtbare Punkte.

### A/B bleiben kompatibel
- Bestehende v0.8.13-A/B-Ergebnisse bleiben über denselben LocalStorage-Key erhalten.
- A: 4.247 Train + 909 Validation; die 912 Blind-Testpersonen werden physisch nicht geladen.
- B: erster Zugriff auf die separate 912er-Testpartition; Fit auf Train+Validation, Evaluation auf Test.

### C · Model Depth + Robustness
C ist ausdrücklich ein **post-blind Diagnose-Lauf**. Nach B ist die Testpartition nicht mehr unangetastet.

C prüft im Web Worker:
1. identische feste Primärzielmenge aus 24 direkt bzw. sauber abgeleiteten ANSUR↔Sammy-Maßen;
2. A-optimierte 5/6/7-Sets gegen alltagstaugliche Consumer-Sets;
3. lineare Ridge- gegen sex-spezifische quadratische Ridge-Modelle;
4. Lambda-Auswahl ausschließlich auf Validation;
5. simulierte Eingabefehler ±0,5 / ±1 / ±2 cm bzw. kg;
6. empirische 68/90/95-%-Unsicherheitsbänder, auf Validation kalibriert und auf Test auf Coverage geprüft.

Die zwei posegebundenen ANSUR-Flexed-Armumfänge bleiben Proxy und zählen nicht in den 24-Maß-Primärscore.

### D · End-to-End R5
D wird nach C freigeschaltet. Er nutzt dieselbe bereits in B geöffnete Testpartition und ist **End-to-End-Validation, kein neuer Blind-Test**.

Pro Person wird paarweise gerechnet:
`5 / 6 / 7 reale Eingaben → ANSUR Prediction → 24 Primärziele → 7 Bridge-Ziele → 31 DIMENSIONS-Ziele → eingefrorener R5 → echtes Mesh → MEAS → Vergleich gegen 24 echte ANSUR-Maße`.

Testtiefen:
- Quick: 6 Personen × 3 = 18 echte R5-Builds
- Standard: 15 × 3 = 45 Builds
- Deep: 30 × 3 = 90 Builds
- Stress: 60 × 3 = 180 Builds

Die gleichen Personen werden jeweils mit 5, 6 und 7 Angaben rekonstruiert. Dadurch ist der Zusatznutzen des sechsten und siebten Maßes direkt paarweise vergleichbar. Fortschritt wird nach jedem fertigen Build in IndexedDB gespeichert; Pause erfolgt nach dem aktuellen Build.

### 31-Maß-Bridge
`ansur-dimensions-bridge-v1.json` ergänzt sieben Sammy-Ziele, die ANSUR nicht als exakte Vergleichswahrheit liefert:
- Natural Waist Circumference
- höhere Sammy Hip Circumference
- Sammy Upperarm Circumference
- Sammy Forearm Circumference
- Front Chest Length (runtime exakt = Waist Back Length, weil die aktuelle Sammy-Messimplementierung dieselbe vertikale Strecke nutzt)
- Neck Height
- Waist→Hip

Die Bridge wurde auf den korrigierten 6.000 Sammy-Kalibrationskörpern trainiert. Vor der Bridge-Prognose werden ANSUR-Eingaben sex-spezifisch per z/Percentile in den Kalibrationsraum ausgerichtet und auf ±3,25 SD begrenzt; Outputs werden zusätzlich auf robuste 0,5–99,5-%-Kalibrationsbereiche begrenzt. Das verhindert instabile Extrapolation bei ANSUR-Edge-Cases. Diese sieben Bridge-Werte sind **nur Konstruktionsprioren** und fließen nie in den ANSUR-Score ein.

### Performance
- BODY SPACE: 1 Draw Call + 1 Sprite für `DU`.
- A/B/C/DPREP: eigener Web Worker, danach Worker-Speicher wieder freigegeben.
- D läuft absichtlich im Haupt-Runtime-Pfad, weil echte Three.js-/Anny-/MEAS-Meshes erzeugt werden; er ist resumierbar.
