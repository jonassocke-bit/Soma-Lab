## v0.8.13 · ANSUR LAB A/B + BODY SPACE V2

Basis: v0.8.12. Scope dieser Version bleibt auf ANSUR/BODY SPACE sowie dessen Forschungs-UI begrenzt. R2/R5, DIMENSIONS, MEAS, Anny/SOMA, Rig, Greeting und Startup bleiben unverändert.

### BODY SPACE V2
- Im Body Space wird das Mannequin nicht mehr dargestellt; der Nutzer ist nur der separate Fokuspunkt `DU`.
- Die 6.068 echten ANSUR-II-Punkte bleiben eine einzelne `THREE.Points`-BufferGeometry (1 Draw Call).
- Beim Hineinzoomen wächst die World-Point-Size zusätzlich zur perspektivischen Attenuation weich bis zu einem gedeckelten Faktor. So bleibt die Population auch in nahen Ansichten visuell präsent.
- Auto-Rotation pausiert nur während einer aktiven Pointer-Geste und setzt unmittelbar beim Loslassen wieder ein.
- ANSUR-Menü wie der Animation-Player: Bottom Panel, Resize-Grip, bis auf 86 px kompakt zusammenschiebbar; im kompakten Zustand bleibt nur Play/Pause für die Population-Rotation.
- Beim Eintritt wird die Sichtbarkeit des Avatar-Meshes gespeichert und ausgeschaltet; beim Verlassen exakt wiederhergestellt.

### ANSUR Prediction Dataset V1
Zwei kompakte, getrennte Dateien aus den öffentlichen ANSUR-II-Male/Female-Daten: `ansur-prediction-trainval-v1.json` und `ansur-prediction-test-v1.json`. Der Blind-Test wird in Lauf A nicht einmal heruntergeladen:
- 6.068 Personen (4.082 male / 1.986 female)
- deterministischer, sex-stratifizierter 70/15/15 Split: 4.247 Train / 909 Validation / 912 Blind Test; Train+Validation und Blind Test liegen physisch in getrennten JSON-Dateien
- Alter ist freier Kontext; Modelle sind sex-spezifisch.
- 5–7 zählen nur Körperangaben; Height und Weight sind Pflichtstart der Input-Suche.
- 26 ANSUR-gestützte Sammy-Ziele: 22 direkt, 2 abgeleitet, 2 als klar markierte posegebundene Umfang-Proxys.
- Nicht als ANSUR-Truth ausgegeben werden aktuell: Sammy Natural Waist, höhere Hip Circumference, Front Chest Length, Neck Height und Waist→Hip.

### Lauf A · Research Sweep
Läuft vollständig im `ansur-lab-worker.js`, damit Three.js/UI nicht blockiert werden.
1. Default-5-Set: Population Mean vs OLS vs Ridge-Lambda-Grid.
2. Bestes Ridge-Lambda wird ausschließlich auf Validation gewählt.
3. Beam Search (Breite 6) sucht verschachtelte 5→6→7 Input-Sets aus benutzerfreundlichen Kandidaten.
4. Split 2 / Blind Test wird in A nicht ausgewertet.

### Lauf B · Blind Validation
Erst nach A freigeschaltet.
- Fit auf Train + Validation mit eingefrorenem Lambda und eingefrorenen 5/6/7-Sets.
- Erst dann Zugriff auf 912 zuvor unangetastete Testpersonen.
- Report: normalized RMSE, Gesamt-RMSE cm, P50/P90/P95/Max pro Testperson, sex-spezifische Fehler und per-measure RMSE/MAE/Bias/P95.

### Lauf C · End-to-End R5
UI-Untermenü ist bereits vorhanden, aber bewusst gesperrt. A/B sollen zuerst Input-Sets und ANSUR→Sammy-Zielmapping festlegen. Danach folgt Prediction → vollständige DIMENSIONS-Ziele → R5 → realer Mesh-Vergleich.

### Performance
- Body Space: 1 Draw Call für die Population + 1 Sprite für `DU`.
- Statistik: eigener Web Worker; Run A lädt nur Train+Validation. Run B startet in einem frischen Worker und lädt die separate Blind-Test-Datei erstmals. Der Worker wird nach jedem fertigen Lauf beendet, damit sein Dataset-Speicher auf dem iPhone wieder freigegeben werden kann.
- Bestehendes adaptives Point-LOD bleibt erhalten.
