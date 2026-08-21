## v0.8.12 · ANSUR LAB / BODY SPACE V1

Basis: v0.8.11 DIMENSIONS + R5 Stress Test. Bestehende R2/R5-, DIMENSIONS-, MEAS-, Anny/SOMA-, Rig-, Startup- und Greeting-Logik bleibt unverändert.

### Echter BODY SPACE
- neue `ANSR`-Bubble als direkter BODY-SPACE-Modusschalter
- enthält alle **6.068** Personen der öffentlichen ANSUR-II Working Databases: 4.082 männlich, 1.986 weiblich
- PCA aus 24 direkt verfügbaren, für Sammy relevanten Körpermaßen (u. a. Stature, Weight, Schulterbreite, Brust/Taille, Gesäß/Hüftbreite, Crotch Height, Hals, Handgelenk, Oberschenkel/Wade/Knöchel, Arm-/Beinlängen)
- Maße werden vor PCA z-standardisiert; die ersten drei PCs erklären 82,84 % der Varianz dieses 24D-Raums
- Browser lädt nur eine kompakte, vorab berechnete `ansur-bodyspace-pca-v1.json` (~135 KB); die Roh-CSV-Dateien werden nicht mitgeliefert
- XYZ werden als **eine** `THREE.Points`-Geometrie / ein Draw Call gerendert

### Interaktion
- Tap auf `ANSR`: aktuelle Avatar-Kamera wird gespeichert, normale Panels werden sauber verlassen, Kamera fährt massiv in den Body Space heraus
- zweiter Tap: exakte vorherige Kamera wird wiederhergestellt
- Population rotiert langsam um den Fokuspunkt; bei Touch/Orbit pausiert die Autodrehung kurz
- eigener Fokuspunkt ist ein separater GPU-Sprite mit leichtem Puls
- **V1-Einschränkung:** Bis das ANSUR-Prediction-Modell existiert, steht `DU` am Populationszentrum. Die echte Nutzerposition wird später aus den vorhergesagten vollständigen Maßen durch exakt dieselbe PCA-Transformation bestimmt.

### Performance
- 6.068 Personen = 1 Draw Call
- Body-Space-PCA wird schon beim UI-Start im Hintergrund vorgeladen
- außerhalb des Body Space ist die Gruppe unsichtbar und der eigene Body-Space-RAF läuft nicht
- adaptives Mobile-LOD reduziert bei auffällig niedriger Bildrate nur den DrawRange auf 3.600 bzw. 2.200 Punkte; die zugrundeliegenden 6.068 Datenpunkte bleiben unverändert

### Architektur
Der Renderer ist von Statistik/Prediction getrennt. `ansur-bodyspace-pca-v1.json` enthält zusätzlich PCA-Mittelwerte, Standardabweichungen, Loadings und Visual-Axis-Scale. Sobald ANSUR Prediction V1 die vollständigen relevanten Maße eines Nutzers liefert, kann dessen echte PCA-Position berechnet und die gesamte Punktwolke um genau diesen Punkt rezentriert werden.

Nicht geändert:
- normaler App-Start / Greeting
- Production Solver R5
- DIMENSIONS
- Measurement-/Landmark-Engine
- Anny/SOMA Loader, Rig, Animation Runtime

Quelle der Rohdaten: öffentliche ANSUR-II Working Databases (U.S. Army / NSRDEC). Die mitgelieferte Body-Space-Datei enthält nur abgeleitete PCA-Koordinaten und Transformationsmetadaten, keine Demografie oder Subject IDs.
