# BODY BANK SOLVER ARCHITECTURE 1.0 · v0.8.29.0

## Ziel

v0.8.29.0 ist der erste falsifizierbare Solver-POC des neuen SAMMY-Pfads:

`wenige Eingaben -> human-auditierter Body-Bank-Seed -> kleine lokale Korrektur -> Active Audit`

Er ersetzt den alten freien From-Scratch-Ansatz nicht durch einen neuen globalen Optimierer. Der bisherige Body Fit bleibt als Vergleich/Fallback erhalten.

## Datenbasis

Der eingereichte Phase-2-Blind-Audit aus v0.8.28.5 wurde in `body-bank-index-v1.json` dedupliziert:

- 246 `trusted`
- 83 `frontier`
- 36 `negative`
- 15 `unchecked`

Nur `trusted` ist initial Solver-Seed. Ablehnungen sind lokale Negativinformation und erzeugen keine globale Slidergrenze.

Der bekannte fehlerhafte Shoulder-Joint-Proxy ist aus Index, Retrieval und Auto-Gates ausgeschlossen.

## Retrieval 1.0

Manueller Solver-Input:

- Geschlecht
- Alter
- Körpergröße
- Gewicht
- Brust
- Taille
- Hüfte/Gesäß

Ablauf:

1. Vorauswahl im trusted Pool über Geschlecht, gespeicherte Rest-Mesh-Statur, schwachen Alterskontext und – nur im manuellen Modus – einen Gewichts/BMI-Prior.
2. Nur die Shortlist wird wirklich in Anny rekonstruiert.
3. Am aktuellen Mesh werden Statur, Brust, Taille und Gesäß/Hüfte gemessen; Gewicht bleibt ein Prior/Volumen-Diagnosewert und kein frei optimierter Morphwert.
4. Top 5 werden angezeigt und können einzeln angewählt werden.

## Local Fit 1.0

Der lokale Fitter darf ausschließlich kleine Änderungen um den ausgewählten Seed ausführen:

- `core:height`: maximal ±0.08 um den Seed
- `measure-bust-circ-incr`: maximal ±0.10
- `measure-waist-circ-incr`: maximal ±0.12
- `measure-hips-circ-incr`: maximal ±0.14

Je Achse gibt es höchstens zwei lokale Schritte. `weight` und `muscle` werden nicht frei nachoptimiert. Es gibt keine Cross-Region-Rettung.

Zusätzlich gilt ein globaler Non-Worsening-Gate: Wenn die kombinierte Größen-/Brust-/Taillen-/Hüft-Abweichung nach allen lokalen Änderungen schlechter ist als beim auditierten Seed, wird die komplette Änderung verworfen und der Seed wiederhergestellt.

Ein Körper gilt nur dann als `audited-seed`, wenn sein vollständiges stabilisiertes Core+Local-Rezept exakt einem trusted/trusted-user-Rezept entspricht. Jede echte Recipe-Änderung bleibt `local-unaudited` bis zum Human-Vote.

## 8er Blind-Proof

Der Proof wählt deterministisch acht diverse trusted Holdouts, vier pro Geschlecht. Jeder Zielkörper wird vollständig aus dem Retrieval-Pool entfernt.

Vom versteckten Ziel werden am echten Mesh erzeugt:

- Statur
- Brustumfang
- Taillenumfang
- Hüft-/Gesäßumfang
- Alterskontext aus dem tatsächlichen Anny-Alterszustand

Gewicht wird im Proof weder bewertet noch in der Retrieval-Vorauswahl benutzt, weil der Phase-2-Audit kein objektives kg-Label enthält.

Verglichen werden auf denselben vier geometrischen Zielwerten:

1. neutraler gleichgeschlechtlicher Anny-Start, nur Statur angepasst,
2. bester trusted Body-Bank-Retrieval-Seed, Holdout ausgeschlossen,
3. derselbe Seed nach Local Fit.

`GO` nur wenn:

- Retrieval-Median < Neutralstart-Median
- Local-Fit-Median <= Retrieval-Median

Es existiert bewusst kein versteckter absoluter Erfolgsschwellwert.

## Active Audit 1.0

BANK hat zwei getrennte Modi:

- `PHASE 2`: bestehender Audit unverändert
- `ACTIVE`: solverrelevante neue Kandidaten

Initial enthält ACTIVE 32 Fälle:

- 15 bisher ungeprüfte eindeutige Phase-2-Körper
- 17 lokale Midpoints an Proportionsfamilien-Grenzen

Zusätzlich werden automatisch eingereiht:

- tatsächlich veränderte Local-Fit-Ergebnisse
- Local-Fits aus dem Blind-Proof
- enge Retrieval-Ambiguitäten

Die Herkunft bleibt während des Votes verborgen. Ein Vote aktualisiert sofort den transparenten lokalen Learning-Store:

- accepted -> `trusted-user`
- uncertain -> `frontier-user`
- rejected -> `negative-user`

Accepted Active-Körper dürfen anschließend auf demselben Gerät als zusätzliche Solver-Seeds verwendet werden. Anny bzw. seine Modellgewichte werden nicht trainiert.

## Was v0.8.29.0 ausdrücklich noch nicht beweist

- keine externe anthropometrische Genauigkeit von Brust/Taille/Hüfte,
- kein korrektes Körpergewicht aus dem Mesh,
- keine sichere Interpolation zwischen zwei akzeptierten Endpunkten,
- keine erweiterten lokalen DOFs für Beine, Schultern, Arme oder Kopf,
- kein finales Produkt-Retrieval.

Der Proof beantwortet zuerst nur die Architekturfrage: Ist ein nahe gelegener auditierter Körper ein reproduzierbar besserer Startpunkt als ein neutraler From-Scratch-Start, und verschlechtert der kleine lokale Fitter diesen Vorteil nicht?
