# SAMMY v0.8.19.3 · PROT UI / Review Audit

## Scope
UI- und Review-Umbau auf Basis von v0.8.19.2. Pose-Constraint- und Strict-Region-Messlogik wurden nicht neu erfunden oder ersetzt.

## Geändert
- PROT-Titel und sichtbare Standing/Sitting-Basisbuttons entfernt.
- Icon-Kopfzeile: vorheriger/nächster Prüfpunkt, Hold-Info, korrekt, inkorrekt, schließen.
- Zwei klare Review-Bereiche: Landmarks und Maße.
- Aktive Auswahl bleibt am Mannequin hervorgehoben; alle Maße der aktuellen Pose bleiben als Overlay sichtbar, alle Anker bleiben sichtbar.
- Maß-/Landmark-Status: grüne bzw. rote Zeilenunterlegung; ungeprüft neutral.
- Info nur solange `i` gedrückt wird. Maßbilder wurden auf die zwei ANSUR-Abbildungen beschnitten; Landmarkbilder auf die Illustration beschnitten. Drei Landmarken ohne eigene geeignete Illustration verwenden passende Messbild-Fallbacks.
- Untere Steuerleiste in einer Zeile: Maße, Regionen, Namen, Random.
- CAM-Button entfernt.
- Haupt-Bubbles erhalten für diese Version einmalig einen vertikalen Start-Stack oben rechts.

## Unverändert / Schutzregeln
- MEAS bleibt Quelle der Messgeometrie.
- Anatomische Region-Masks aus v0.8.19.2 bleiben aktiv und getrennt (links/rechts, Torso, Hals, Kopf etc.).
- Kein produktiver Whole-Body-Fallback für PROT-Messungen.
- Pose-/Hilfsflächen-Logik aus v0.8.19.2 wurde in diesem UI-Pass nicht verändert.

## Statische Checks
- `node --check app.js`: bestanden.
- `ansur-protocol-v1.json`: valide.
- HTML-IDs: eindeutig.
- Alle im PROT-JS referenzierten `sammyProtocol*`-IDs im HTML vorhanden.
