# REAL ANSUR Residual Convergence 1.0 · v0.8.26.3

## Frage
Wenn ein fertiger Real-ANSUR-Repair noch 3–5 cm Restfehler bei einem produktrelevanten Maß hat, obwohl geeignete Regler nicht am normalen Limit stehen: ist das wirklich Morphraum-Limit oder hat der Nachlauf nur zu früh aufgehört?

## Ablauf je Körper
1. Ausgang ist weiterhin die fertige Stress-Lösung.
2. Thorax / Frame / Soft bleiben als grobe Produkt-Reparatur erhalten.
3. Danach wird die Liste ungelöster produktrelevanter Residuen neu aus dem echten Mesh aufgebaut.
4. Das stärkste Residuum wird gewählt.
5. Aus der gefrorenen Solver-Map werden bis zu drei passende Freiheitsgrade gewählt; direkte Maß-Regler erhalten Vorrang.
6. Frischer lokaler Jacobian auf dem aktuellen Mesh.
7. Kleiner gewichteter Schritt; bereits gute kritische Maße werden geschützt.
8. Falls der gemeinsame Schritt scheitert, werden die Kandidaten einzeln getestet.
9. Wiederholung bis Toleranz, Trade-off/Stall oder maximal sechs Runden.

## Bounds
Normale Bounds bleiben Standard. Nur wenn ein lokaler linearer Morph nachweislich am Bound blockiert und der Gradient weiter nach außen weist, wird zunächst ±1.15 und notfalls ±1.30 geprüft. Es gibt keine Core-Extrapolation.

## Stop-Semantik
- `within-product-tolerance`: alle verfolgten Produktmaße ausreichend nah.
- `critical-within-tolerance`: kritische Maße ausreichend; nur unterstützende Residuen verbleiben.
- `budget`: sechs Runden verbraucht.
- einzelne Maße können `stalled` sein, wenn kein sicherer Schritt gefunden wird, ohne bereits passende kritische Maße deutlich zu verschlechtern.

## Erwarteter Nutzen
Die neue Stufe soll nicht perfekte ANSUR-Rekonstruktion erzwingen. Sie soll verhindern, dass Sammy mit mehreren Zentimetern Restfehler stoppt, obwohl ein direkter Regler noch frei und lokal wirksam ist. Erst ein danach verbleibender, explizit protokollierter Trade-off ist ein belastbarer Hinweis auf Morphraum-/Mapping-Grenzen.
