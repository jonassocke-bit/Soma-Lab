# Release Notes · Sammy v0.8.28.0

## Neu
- Neue LAB-Bubble `BANK · 100er Audit`.
- LAB-Radialmenü auf acht klar getrennte Einträge erweitert.
- Neuer Audited-Body-Bank-PoC mit 95 eindeutigen Core-Basiskörpern + 5 verdeckten Wiederholungen.
- Drei schnelle Bewertungen: Plausibel / Unsicher / Unplausibel.
- Vier feste Audit-Ansichten: Vorne / 3/4 / Seite / Hinten.
- Bewertung wird lokal gespeichert und kann fortgesetzt werden.
- JSON-Export mit Shape-Rezept, Familienkontext, verstecktem Mess-Snapshot und Repeat-Konsistenz.
- Alte solverbasierte Blind-Audit-Funktion bleibt separat unter `AUDT · Solver blind`.

## Bewusste Grenzen
- Phase 1 nutzt keine Local Morphs.
- Phase 1 behauptet nicht, dass die erzeugten Körper anthropometrisch korrekt sind; genau das wird auditiert.
- Ablehnungen sind kontextabhängig und erzeugen keine globalen Bounds.
- Noch kein Runtime-Nearest-Neighbor und noch kein lokaler Body-Bank-Fitter.

## Versions-/Projektpflege
- `SAMMY_MASTER_STATE` ist auf v0.8.28.0 aktualisiert.
- Jeder zukünftige Release-Export muss im selben Schritt den Master State und `SAMMY_CURRENT` aktualisieren.
