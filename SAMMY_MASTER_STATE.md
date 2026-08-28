# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.2 · 28.08.2026 · App v0.8.28.0**

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

## 5. Aktueller Build v0.8.28.0 · BODY BANK AUDIT POC

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

Der Nutzer sieht bewusst keine Morphwerte oder Messwerte. Sichtbar sind nur:

- aktueller Fortschritt,
- Vorne / 3/4 / Seite / Hinten,
- `Plausibel`, `Unsicher`, `Unplausibel`,
- Zurück / Weiter.

Es gibt **keine Kommentar- oder Fehlerbeschreibungspflicht**. Nach einer Bewertung wird automatisch der nächste Körper geladen.

### Audit-Export

Der JSON-Export enthält intern:

- Case-ID / Body-ID / Family-ID,
- Repeat-Beziehung,
- Bewertung und Zeitpunkt,
- vollständiges Anny-Core-Rezept,
- versteckte Mess-Snapshots grundlegender stabiler Maße,
- Basis-Autocheck,
- Erzeugungsmetadaten,
- Repeat-Konsistenz-Zusammenfassung.

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
- v0.8.28.0 prüft parallel den neuen Body-Bank-/Audit-Pfad als bevorzugte nächste Architektur.

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

## 10. Nächster Gate nach v0.8.28.0

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
