# SAMMY v0.8.21.0 · SOLVER 24 V1

## Zweck

`SOLV` rekonstruiert einen Sammy-Körper aus den 24 eingefrorenen Zielmaßen des Schemas `ANSUR24-PROT-v1`. Die Messgeometrie selbst wird in dieser Version nicht verändert.

Die Influence-Läufe aus v0.8.20.3/v0.8.20.4 werden **nicht als globale inverse Lösung** benutzt. Sie liefern nur einen kompakten Prior für Kandidatenauswahl, Wirkrichtung und Startschritt:

- Deep: 19.632 reale Mesh-Datensätze
- Addendum: 672 reale Mesh-Datensätze
- 65 Solver-Parameter × 24 Zielmaße

Der kompakte Laufzeit-Prior liegt in `solver24-prior-v1.json`.

## Algorithmus

Pro Zielkörper und Startkörper läuft der Fit iterativ:

1. 24 Maße am **aktuellen echten Mesh** messen.
2. Größte Residuen bestimmen und mit dem Deep/Addendum-Prior die lokal wichtigsten Slider wählen. Direkte `measure-*`-Morphs für große Zielabweichungen werden bevorzugt berücksichtigt.
3. Für jeden gewählten Slider einen kleinen einseitigen Finite-Difference-Schritt auf dem aktuellen Mesh ausführen.
4. Daraus einen lokalen Jacobian `d(Maß)/d(Slider)` bilden.
5. Regularisierte Least-Squares-Aktualisierung berechnen. Die Regularisierung zieht schwach bestimmte Parameter in Richtung neutraler Referenz und bestraft insbesondere reine Translationen stärker als semantische Maß-Morphs.
6. Den Schritt mit mehreren Schrittweiten am **echten Mesh** testen und nur bei realer Verbesserung akzeptieren.
7. Nach dem akzeptierten Schritt neu messen und den Jacobian im nächsten Pass neu aufbauen.

Damit wird die in der Influence-Auswertung beobachtete Körperabhängigkeit – besonders bei Waist Back Length – nicht als konstante globale 24×65-Matrix behandelt.

## Solver-Kontext

- Geschlecht und Alter sind Kontext und während eines Fits fixiert.
- Bei männlichem Kontext wird Cupsize nicht automatisch optimiert.
- Die übrigen freigegebenen Solver-Parameter können lokal gewählt werden.
- `torso-trans-up` und andere reine Positionsparameter erhalten stärkere Regularisierung; direkte semantische Maß-Morphs sind günstiger.
- Waist Back Length erhält **keine neue Messdefinition**. Der Solver muss mit der eingefrorenen PROT-Geometrie arbeiten.

## Modi

- **Quick**: 2 Startkörper, 8 lokale Kandidaten, bis 4 Re-Linearisationen; 1 versteckter Blind-Zielkörper.
- **Standard**: 3 Startkörper, 12 lokale Kandidaten, bis 6 Re-Linearisationen; 3 versteckte Blind-Zielkörper.
- **Deep**: 4 Startkörper, 16 lokale Kandidaten, bis 8 Re-Linearisationen; 6 versteckte Blind-Zielkörper.

Standard ist der erste empfohlene reale Test.

## Validierung

`Aktueller Körper → 24 Ziele` friert die 24 aktuellen Mesh-Maße als Zielvektor ein und speichert die Quellform nur für die spätere Validierung. Der Solver startet anschließend von unabhängigen Referenzkörpern.

Die Summary enthält pro Ziel unter anderem:

- bestes und mittleres 24-Maß-RMSE über die Seeds,
- Streuung der gefundenen Parameterlösungen zwischen Seeds,
- Streuung der nicht als Ziel verwendeten abgeleiteten Mesh-Maße,
- bei bekannten Quellkörpern zusätzlich Parameter-Abstand und Fehler der abgeleiteten Nicht-Ziel-Maße,
- größte verbleibende Zielmaßfehler.

Ein niedriger 24-Maß-RMSE allein gilt damit ausdrücklich nicht als Beweis für eine eindeutige oder anatomisch gute Rekonstruktion.

## Blind-Test / AUDT

`Blind-Test starten` erzeugt intern mehrere versteckte plausible Zielkörper, misst deren 24 Zielmaße und rekonstruiert jeden Zielkörper aus mehreren unabhängigen Startkörpern. Im anschließenden `AUDT` werden nur die anonymisierten rekonstruierten Körper gezeigt.

AUDT zeigt keine Zielmaße und keinen Solverpfad. Der Reviewer kann nur:

- vorher / nächster Körper,
- plausibel ✓ / unplausibel ✕,
- Kommentar,
- Fehlstelle direkt am Mannequin markieren.

Beim Wechsel von SOLV zu AUDT wird zuerst die Mess-/T-Pose sauber verlassen und **danach** der Blindkörper geladen. Dadurch kann das Restore der Measurement-Session den Auditkörper nicht mehr überschreiben.

## iPhone / Safari

Die Finite-Difference-Arbeit wird zwischen Mesh-Auswertungen an den Event Loop zurückgegeben. Der Lauf kann pausiert werden. Beim Verlassen von SOLV während eines aktiven Laufs wird der Solver automatisch pausiert, bevor die Measurement-Session restauriert wird.

Während der Optimierung werden keine kompletten Mess-Overlays pro Testzustand neu gezeichnet. Im ruhenden/finalen SOLV-Viewport wird ausschließlich das PROT/ANSUR-24-Overlay verwendet.
Ungültige/temporär nicht berechenbare Mesh-Maße werden im lokalen Jacobian ausdrücklich als fehlend behandelt und **nicht** als `0 cm` in den Solver eingespeist. Bei Blind-Läufen wird nach Abschluss außerdem der vorherige Körper ohne Maß-Overlay wiederhergestellt; erst AUDT lädt die anonymisierten Rekonstruktionen.

## Erster Test

1. `LAB → SOLV`
2. `Standard`
3. `Aktueller Körper → 24 Ziele`
4. `Rekonstruieren`
5. Nach Abschluss `Summary JSON` exportieren.

Erst wenn dieser bekannte Zielkörper sinnvoll rekonstruiert wird, den Standard-`Blind-Test` starten und anschließend die anonymisierten Körper in `LAB → AUDT` bewerten.
