# SAMMY v0.8.17 · ANSUR D3 LIVE ALIGNMENT AUDIT

Basis: v0.8.16.

## Änderung dieser Version
- BODY SPACE vollständig aus dem aktiven App-Pfad entfernt; `ANSR` öffnet wieder ein normales Bottom-Panel über dem sichtbaren Avatar.
- `ansur-bodyspace-pca-v1.json` wird nicht mehr ausgeliefert oder geladen.
- D3 hat optionales, standardmäßig aktives LIVE-Visual-Audit.
- Sichtbar sind nur das aktuelle Single/Bundle und ggf. Stature als Größenanker.
- HUD zeigt pro Zielmaß Ziel / Ist / Delta. Linien/Delta: grün <=0,5 cm, gelb <=1,5 cm, rot >1,5 cm; Anchor gedimmt.
- D3 zeigt nur akzeptierte Solver-Zustände. Wenn ein Pass keinen Kandidaten akzeptiert, wird vor der visuellen Ausgabe der letzte gültige Zustand real am Mesh wiederhergestellt.
- Nach jedem Fit bleibt das Finalbild kurz sichtbar; dadurch ist der Lauf etwas langsamer, aber visuell prüfbar. LIVE kann abgeschaltet werden.
- Mini-Transport im zusammengeklappten ANSUR-Panel pausiert/fortsetzt einen laufenden D3-Audit.

## Unverändert
Startup, Anny/SOMA, Rig, Animation, FORM, MEAS-Definitionen, Calibration, R2/R5, DIMENSIONS, ANSUR A/B/C, D1/D2 und D3-Fitlogik/Zieldefinitionen bleiben unverändert; ergänzt wurde nur die D3-Visualisierung und das exakte Zurücksetzen auf akzeptierte Zustände für die Darstellung.
