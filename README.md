## v0.8.15 · ANSUR D2 Alignment + Weighted Constraints

Basis: v0.8.14.1. Scope bleibt strikt auf ANSUR LAB / BODY SPACE / ANSUR-End-to-End-Test beschränkt. Startup, Anny/SOMA, Rig, MEAS, R2, R5 und der bestehende DIMENSIONS-Solver wurden nicht verändert.

### Warum D2 existiert

D1 zeigte eine klare Trennung: Die reine ANSUR-Vorhersage lag bei ca. 1 cm, das fertige Mesh aber bei ca. 4 cm. Selbst bekannte Eingabemaße wurden im Mesh stark geopfert. D2 trennt deshalb drei Fehlerquellen explizit:

- **T24 · Full Truth:** Alle 24 wirklich vergleichbaren ANSUR-Maße werden als reale Wahrheit vorgegeben. Nur die sieben Sammy-only/Bridge-Werte bleiben sehr weich. Dieser Lauf prüft direkt, ob ANSUR-Maßraum und Sammy/Anny überhaupt kompatibel bzw. ausdrückbar sind.
- **K7 · Weighted:** Sieben reale Nutzereingaben gehen in ANSUR ein; davon sind sechs echte Sammy-Maße harte Mesh-Ziele, während `weightkg` ausschließlich Statistik-Input bleibt. Alle übrigen ANSUR-Predictions werden anhand der in C empirisch gemessenen p68-Unsicherheit gewichtet.
- **K5 · Weighted:** Analog mit fünf Nutzereingaben; davon sind vier direkte Sammy-Maße harte Mesh-Ziele plus `weightkg` als reiner Statistik-Input.

### Lexikographischer Mesh-Fit

Jeder D2-Build läuft in drei realen Mesh-Stufen:

1. **HARD:** bekannte/reale Maße zuerst; große Gewichtung, echte Mesh-Messung, adaptive Korrekturen mit Bounds.
2. **SOFT:** statistisch geschätzte Maße dürfen nur nachziehen, solange die HARD-Maße innerhalb enger RMSE- und Einzelmaß-Guards bleiben. Soft-Gewichte stammen aus C (`1 / p68²`, begrenzt).
3. **R5 Guarded Canonicalization:** R5 darf Scale/Translation weiterhin aufräumen, aber nur wenn Prioritätskosten sinken und HARD- sowie gewichteter Ziel-Fit am echten Mesh erhalten bleiben.

Der bestehende R5-Code selbst ist unverändert; D2 hat eine separate gewichtete Fit-/Guard-Schicht.

### Testtiefe

- Quick: 4 Personen × T24/K7/K5 = 12 Builds
- Standard: 12 × 3 = 36 Builds
- Deep: 30 × 3 = 90 Builds
- Stress: 60 × 3 = 180 Builds

D2 ist bewusst rechenintensiver als D1: pro Build können mehrere echte Mesh-Kandidaten getestet werden. Fortschritt wird nach jedem vollständigen Build in IndexedDB gespeichert und ist resumierbar.

### Report

D2 Summary/FULL enthält u.a.:

- Primary Truth RMSE gegen alle 24 realen ANSUR-Werte
- Hard-Input RMSE und maximalen Hard-Einzelfehler
- Ziel-Fit gegen T24 bzw. Prediction-Vektor
- P50/P90/P95/Worst Case pro Variante
- Fehler/Bias/P95 je Einzelmaß
- Geschlechtertrennung
- durchschnittliche Slider an Bounds
- Mesh-Evaluationen / Canonicalization
- Vergleich zum letzten abgeschlossenen D1-Lauf
- automatische T24-Einordnung: kompatibel / teilweise kompatibel / Mapping-Expressivität auffällig

### Safety / Regression

Vor Release geprüft:

- `node --check app.js`
- TypeScript-AST ohne Parsefehler
- keine fehlenden Sammy-Helper im ANSUR-Block
- keine `const`-Mutationen
- keine doppelten Funktionen
- keine doppelten HTML-IDs
- D2-Target-Preflight auf 60 ANSUR-Personen × 3 Varianten: 180 vollständige 31/31 finite Zielvektoren
- C-Unsicherheitsbänder für alle nicht bekannten K5/K7-Primärziele vorhanden
- Startup / Anny / MEAS / R2 / R5 / DIMENSIONS-Funktionen textlich identisch zu v0.8.14.1
