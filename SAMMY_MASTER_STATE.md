# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.4 · 28.08.2026 · App v0.8.28.2**

## 1. Verbindliche Projektpflege

- Dieser Master State ist die kanonische Zusammenfassung des aktuellen Projektstands.
- **Jeder neue SAMMY-Export aktualisiert im selben Arbeitsschritt den Master State.** Ein Release ohne synchronen Master State gilt nicht als vollständiger Projektstand.
- Zusätzlich wird bei jedem Export `SAMMY_CURRENT.zip` auf die neue vollständige Version gesetzt und `SAMMY_CURRENT_VERSION.txt` aktualisiert.
- Neue Arbeit startet ausschließlich von `SAMMY_CURRENT` bzw. der dort genannten Version.
- Ersetzte Ansätze bleiben nur als Forschungsarchiv erhalten und dürfen nicht ungeprüft wieder als Hauptpfad vorgeschlagen werden.

## 2. Produktziel

SAMMY ist ein Tool, das aus **wenigen Nutzereingaben** halbwegs verlässliche grundlegende Körpermaße und einen dazu passenden plausiblen Avatar liefern soll.

Nicht erforderlich ist eine exakte Rekonstruktion eines Menschen aus dutzenden externen anthropometrischen Zielmaßen. Optische Plausibilität allein reicht dennoch nicht: Messung, Parametrisierung und Fehlergrenzen müssen nachvollziehbar bleiben.

## 3. Aktuelle Architekturentscheidung

### 3.1 Kein freier From-Scratch-Solver als primärer Produktionspfad

Die bisherigen Solver-/ANSUR-Arbeiten haben gezeigt, dass das bestehende Anny/SOMA-Morphsystem manche extern definierten Maße nur indirekt, an anderen Messebenen oder über unerwünschte Cross-Region-Effekte abbildet. Ein immer komplexerer Runtime-Solver soll diese strukturellen Grenzen nicht weiter kompensieren.

### 3.2 Neuer Zielpfad: Audited Body Bank -> Lookup -> kleiner lokaler Fitter

Der bevorzugte neue Architekturpfad lautet:

1. Offline bzw. vorab viele reproduzierbare Anny-Körperrezepte erzeugen.
2. Körper technisch und visuell auditieren.
3. Akzeptierte Körper als Anker eines **auditierten, kontextabhängigen Körperraums** speichern.
4. Zur Laufzeit aus wenigen Nutzerdaten einen nahen bekannten Körper auswählen.
5. Nur noch kleine lokale Iterationen von diesem nahen Startkörper aus erlauben.

Der lokale Fitter darf keine anatomisch fremden Morphs als Rettung benutzen. Ein Brust-Controller darf beispielsweise nicht zur Korrektur eines Oberschenkelziels herangezogen werden.

## 4. Audited Body Graph / Körperfamilien

Eine menschliche Bewertung gilt **nicht global für einen Sliderwert**.

Beispiel: Wenn ein größerer Oberschenkel bei Körperfamilie A unplausibel aussieht, darf daraus nicht folgen, dass derselbe Oberschenkelwert bei Körperfamilie B unzulässig ist.

Daher werden Auditinformationen an folgende Kontexte gebunden:

- vollständiges Anny-Rezept des Körpers,
- lokale `familyId`,
- konkrete Ausgangs-/Zielkörper,
- konkrete Änderungsrichtung und Distanz, sobald lokale Kanten getestet werden.

Statusmodell:

- `HUMAN_ACCEPTED`: visuell akzeptierter Ankerkörper.
- `UNCERTAIN`: keine positive oder negative Regel ableiten.
- `REJECTED_LOCAL`: lokaler negativer Referenzpunkt; kein globales Verbot.
- `SAFE_EDGE` (spätere Phase): kleine Verbindung zwischen nahen akzeptierten Körpern, deren Zwischenstufen geprüft wurden.

Zwei akzeptierte Endpunkte garantieren nicht automatisch, dass jede Interpolation dazwischen gültig ist. Zwischenstufen müssen separat technisch geprüft und bei Bedarf human auditiert werden.

## 5. Aktueller Build v0.8.28.2 · BODY BANK AUDIT VIEW/MOTION

### Zweck

Der erste Test prüft nur, ob Annys **Core-Basiskörperraum** als Ausgangspunkt für eine Body Bank brauchbar ist. Noch kein Nearest-Neighbor-Runtime-Lookup und noch kein lokaler Family-Fitter.

### Audit-Queue

- 95 eindeutige Basiskörper.
- 5 verdeckte Wiederholungen.
- 100 Bewertungen insgesamt.
- Männer/Frauen werden gemischt erzeugt.
- Erzeugung ist deterministisch und reproduzierbar.
- Die sechs vorhandenen kanonischen Referenzkörper (`male_avg`, `male_lean`, `male_muscular`, `female_avg`, `female_curvy`, `female_tall`) dienen nur als Sampling-Zentren.
- Variation erfolgt auf Anny-Core-Parametern innerhalb konservativer Bereiche.
- Lokale Spezialmorphs sind in Phase 1 vollständig deaktiviert.

### Audit-UI

Der Nutzer sieht bewusst keine Morphwerte oder Messwerte. Sichtbar sind:

- aktueller Fortschritt,
- Vorne / 3/4 / Seite / Hinten,
- kompakte Pose-/Bewegungsauswahl,
- `Plausibel`, `Unsicher`, `Unplausibel`,
- Zurück / Weiter.

Es gibt **keine Kommentar- oder Fehlerbeschreibungspflicht**. Nach einer Bewertung wird automatisch der nächste Körper geladen.

### Kamera-/Zoom-Regel

- Beim Eintritt in BODY BANK wird der aktuelle Körper einmal initial eingerahmt.
- Danach bleiben **manueller Zoom, Orbit-Ziel, Kameradistanz und Blickausschnitt beim Personenwechsel unverändert**.
- Weder Bewertung, Zurück/Weiter, Posewechsel noch Animation dürfen die Kamera neu einrahmen.
- **Nur ein aktiver Klick auf Vorne / 3/4 / Seite / Hinten** darf eine neue standardisierte Kameraeinstellung setzen.

### Pose und Bewegung

Für die visuelle Plausibilitätsprüfung stehen statische Posen und Bewegungen zur Verfügung:

- T-Pose,
- anthropometrisches/ruhiges Stehen,
- Kniebeuge, Lauf- und Action-Pose,
- synthetischer Gang-Loop,
- Rig-Stress-Loop,
- optional importierte FBX/NPY/NPZ-Animationen aus dem bereits vorhandenen Sammy-Animationspfad.

Animationen können pausiert und in der Geschwindigkeit verändert werden. Ein Personenwechsel behält die aktuell gewählte Pose bzw. den laufenden/pausierten Bewegungszustand bei. Die Körper-ID und das Anny-Rezept werden dadurch nicht verändert.

### Audit-Export

Der JSON-Export enthält intern:

- Case-ID / Body-ID / Family-ID,
- Repeat-Beziehung,
- Bewertung und Zeitpunkt,
- vollständiges Anny-Core-Rezept,
- versteckte **pose-unabhängige Rest-Shape-Snapshots** grundlegender Maße,
- Basis-Autocheck,
- Erzeugungsmetadaten,
- Review-Kontext pro Bewertung (Viewport, Pose/Animation, Play/Pause, Tempo, Kameradistanz),
- Repeat-Konsistenz-Zusammenfassung.

Die versteckten Mess-Snapshots werden absichtlich am Rest-Shape ermittelt. Dadurch kann eine während des visuellen Audits laufende Animation die numerische Basisprüfung nicht verfälschen.

## 6. Rolle des bisherigen Wissens

Die bisherige Arbeit wird **nicht verworfen**. Sie ändert ihre Rolle.

Weiterzuverwenden sind insbesondere:

- Landmark- und Messdefinitionen,
- geometrische Messoperatoren und Region-Masks,
- Symmetrie-Regeln,
- Morph Influence Atlas,
- Morph Observatory / Skelettreaktionen,
- gekoppelte Morph-/Slidergruppen,
- Stabilitäts- und Regressions-Gates,
- ANSUR-/Studienwissen als Mess- und Plausibilitätsreferenz,
- Solver-Fehlschläge als Information über ungeeignete Freiheitsgrade und Cross-Region-Risiken.

Diese Informationen sollen den Body-Bank-Generator, automatische Plausibilitätschecks und spätere lokale Fitter begrenzen, nicht erneut einen freien globalen Solver rechtfertigen.

## 7. ANSUR / externe Studien

ANSUR bleibt wertvoll für präzise Messdefinitionen, Landmark-Protokolle, Posen, Messfehler und historische Vergleichstests. Es ist **nicht mehr erforderlich**, dass Anny jeden ANSUR-Wert als geometrisches Live-Ziel exakt reproduziert.

Externe Populationsdaten können später genutzt werden, um aus wenigen Nutzerdaten plausible fehlende Maße bzw. Lookup-Ziele zu schätzen. Die aktuelle Body-Bank-Phase soll jedoch nicht erneut durch einen Studienwechsel blockiert werden.

## 8. Produktionspfad vs. Forschungsarchiv

### Aktueller Produktions-/Produktpfad

- Body Fit v1.2 aus v0.8.27.2 bleibt als bestehender Minimal-Prototyp verfügbar.
- v0.8.28.2 prüft parallel den neuen Body-Bank-/Audit-Pfad als bevorzugte nächste Architektur. Gegenüber v0.8.28.1 bleibt die Queue unverändert; neu sind persistenter Audit-Zoom/Orbit sowie Pose-/Animationskontrolle innerhalb von BANK.

### Forschungsarchiv

Weiter verfügbar, aber nicht automatisch Produktionsarchitektur:

- Solver24,
- Solver V2 Proof,
- Real-ANSUR-Stress,
- Pragmatic Repair / Residual Convergence,
- Morph <-> Messebene Alignment,
- Solver Shape Layer,
- Legacy Blind Audit (`AUDT`).

Diese Pfade dürfen als Diagnose, Vergleich oder Datenquelle genutzt werden. Ein fehlgeschlagener Body-Bank-Test ist kein automatischer Auftrag, zu einem alten globalen Solver zurückzukehren.

## 9. Nicht verhandelbare technische Regeln

- Anatomische Regionen bleiben strikt getrennt; Torsomaße dürfen keine Arme fangen.
- Symmetrische Parameter müssen bilateral konsistent wirken, sofern kein expliziter asymmetrischer Modus vorliegt.
- Morphs dürfen nur für fachlich passende Körperregionen geroutet werden.
- Gekoppelte Formänderungen (z. B. Width + Depth für einen Umfang) dürfen als semantischer Controller behandelt werden, wenn dies geometrisch sinnvoll ist.
- Messfehler, Mesh-Limit, Lookup-Abdeckung und Fitterfehler müssen separat diagnostizierbar bleiben.
- iPhone/Safari-Tauglichkeit und Resume/Persistenz sind Pflicht.

## 10. Nächster Gate nach v0.8.28.2

Der Nutzer auditiert die 100 Fälle und exportiert `Sammy_BODY_BANK_AUDIT_*.json`.

Danach werden mindestens bewertet:

1. Anteil `Plausibel` / `Unsicher` / `Unplausibel`.
2. Konsistenz der fünf verdeckten Wiederholungen.
3. Welche Körperfamilien viele lokale Ablehnungen enthalten.
4. Ob ein ausreichend großer zusammenhängender Satz akzeptierter Basiskörper entsteht.

Nur wenn dieser Gate brauchbar ausfällt, folgt Phase 2:

- akzeptierte Anker auswählen,
- kleine lokale Variationen um einzelne Körperfamilien erzeugen,
- kontextabhängige Grenzen testen,
- sichere lokale Kanten aufbauen,
- danach einen Body-Bank-Lookup + Minimal-Fitter testen.

## 11. Abbruch-/Entscheidungsregel

Wenn bereits der konservative Anny-Core-Raum überwiegend unplausibel ist oder sich keine ausreichend zusammenhängende akzeptierte Körperbank aufbauen lässt, wird nicht automatisch ein noch komplexerer Solver gebaut. Dann muss die Eignung von Anny als Basismodell selbst neu bewertet werden.

## 12. Änderungsprotokoll

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 22.08.2026 | Master State eingeführt; Landmark-/Messpipeline als damaliger Schwerpunkt dokumentiert. |
| 0.2 | 28.08.2026 | Auf aktuellen Projektstand konsolidiert. From-Scratch-Solver nicht mehr bevorzugter Produktpfad; Audited Body Bank / lokale Körperfamilien als neue Hauptarchitektur. BODY BANK AUDIT PoC v0.8.28.0 und verpflichtende synchronisierte Master-State-/SAMMY_CURRENT-Exports festgelegt. |
| 0.3 | 28.08.2026 | GitHub Pages Hotfix v0.8.28.1: Cache-Busting-/Versionsdrift aus v0.8.28.0 korrigiert; synchroner HTML/JS/CSS-Deployment-Gate und `.nojekyll` als Exportregel ergänzt. |
| 0.4 | 28.08.2026 | BODY BANK v0.8.28.2: manueller Zoom/Orbit bleibt über Personenwechsel erhalten; nur expliziter Viewport-Wechsel reframed. Statische Posen, Gang-/Stress-Loops und importierte Animationen direkt im Audit. Review-Kontext wird gespeichert; numerische Audit-Snapshots sind pose-unabhängig. |
