# CHANGESET v0.8.28.4

## Runtime / UI

- `app.js`: BANK Session-Schema v3 und Plan-Schema v2.
- `app.js`: BANK-only Scissor-Dual-Viewport mit zwei unabhängigen OrbitControls/Kameras.
- `app.js`: Last-Interaction-Auswahl des aktiven Viewports; Kamera-Buttons und AutoFit werden darauf geroutet.
- `app.js`: per-Viewport AutoFit und persistente unabhängige Kamerazustände.
- `app.js`: harter Rest-Mesh-Staturcheck <=205 cm vor Sichtbarkeit; Rezeptanpassung wird auf Wiederholungen propagiert.
- `app.js`: Blind-Export v3 speichert beide Kamera-Kontexte und die neue Audit-Policy.
- `index.html`: aktuelle Testkategorie verborgen; Dual-Viewport-Status und AutoFit ergänzt; Schnellgrund standardmäßig leer.
- `style.css`: BANK-only Hit-Flächen/Aktivmarkierung für zwei Viewports, responsive Hochformat-Anordnung.

## Daten

- Neu `body-bank-phase2-plan-v2.json`: blind gemischte Queue, konservative Statur-Vorbegrenzung, gespeicherter Shuffle-Seed.
- `body-bank-phase2-plan-v1.json` bleibt als Historien-/Vergleichsstand erhalten.

## Projektpflege

- `SAMMY_MASTER_STATE.md/.docx` auf 0.6 / App v0.8.28.4.
- Kopfgröße/Head-Fat als spätere separate Prüfung dokumentiert; bewusst nicht Teil des aktuellen Audits.
- README / Patch Notes / Current-Version / Build-Manifeste synchronisiert.
