# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.10 · 29.08.2026 · App v0.8.29.2**

## 1. Verbindliche Projektpflege

- Dieser Master State ist die kanonische Zusammenfassung des aktuellen Projektstands.
- **Jeder neue SAMMY-Export aktualisiert im selben Arbeitsschritt den Master State.** Ein Release ohne synchronen Master State gilt nicht als vollständiger Projektstand.
- Zusätzlich wird bei jedem Export `SAMMY_CURRENT.zip` auf die neue vollständige Version gesetzt, `SAMMY_GITHUB_CURRENT.zip` auf die kompakte GitHub-Fassung gesetzt und `SAMMY_CURRENT_VERSION.txt` aktualisiert. Die GitHub-Fassung bleibt unter 100 direkt sichtbaren Dateien; ältere Release-Historie darf dafür als internes History-Archiv gebündelt werden.
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

## 5. Aktueller Build v0.8.29.2 · BODY BANK SOLVER + GitHub Visible-Version Hotfix


### 5.0 v0.8.29.2 Deployment-/Versions-Hotfix

Der v0.8.29.1-GitHub-Compact-Build enthielt im Splash noch den fest codierten Text `v0.8.28.4`, obwohl Runtime, HTML-Titel und Cache-Tags bereits auf v0.8.29.1 standen. Dadurch konnte ein korrekt hochgeladener neuer Build beim Start wie ein alter Stand erscheinen.

v0.8.29.2 synchronisiert Splash, Hauptlabel, HTML-Titel, `SAMMY_APP_VERSION` und JS-/CSS-Cache-Tags. Der statische Release-Gate prüft diese Marker künftig gemeinsam. Solverlogik, Body-Bank-Index und ACTIVE-Audit-Daten bleiben gegenüber v0.8.29.1 unverändert.

### 5.1 Kanonische Body Bank nach dem ersten ACTIVE Audit

Der Phase-2-Blind-Audit bleibt die Ausgangsbasis. Zusätzlich wurde der zurückgegebene 32er ACTIVE-Audit aus v0.8.29.0 kanonisch eingearbeitet:

- 23 `accepted`,
- 8 `uncertain`,
- 1 `rejected`,
- 0 `unchecked`.

Davon waren 15 die zuvor offenen Phase-2-Körper und 17 neue lokale Boundary-Midpoints. Die 15 offenen Körper werden im bestehenden Index **in-place** klassifiziert; die 17 Midpoints werden als neue lokale Nodes ergänzt. Der kanonische `body-bank-index-v1.json` enthält damit jetzt 397 eindeutige Nodes:

- 269 `trusted`,
- 91 `frontier`,
- 37 `negative`,
- 0 `unchecked`.

Kein Vote wird in eine globale Slidergrenze übersetzt. `negative` bleibt lokales Negativwissen. Bereits lokal im Browser gespeicherte Votes werden gegen den kanonischen Index nach stabilisiertem Shape dedupliziert, damit nach einem Release-Update keine doppelten Solver-Seeds entstehen.

### 5.2 Ergebnis des ersten Solver-Blind-Proofs

Der erste reale 8er Proof unter v0.8.29.0 lief technisch durch und ergab auf seinem damaligen Score:

- Neutral-Median: `1.15446`,
- Body-Bank-Retrieval-Median: `0.20260`,
- Local-Fit-Median: `0.20129`,
- Retrieval besser als neutral: 6/8,
- Local Fit nicht schlechter als Retrieval: 8/8,
- Local Fit tatsächlich verbessert: 3/8.

Das entspricht auf dem damaligen gemeinsamen Score einer Reduktion des Medianfehlers um rund 82 % vom Neutralstart zum Retrieval. **Damit ist die Architekturhypothese `naher auditierter Seed > neutraler From-Scratch-Start` klar unterstützt.**

Der Proof hat gleichzeitig einen separaten Messfehler sichtbar gemacht: Ein versteckter erwachsener Holdout lieferte einen Brustumfang von nur `39.61 cm`. `chest_circumference` war im Messschema ohnehin noch nicht als bestätigt markiert. Deshalb gilt der v0.8.29.0-Proof nicht als Freigabe der Brustmessung oder aller vier Zielmaße. Die korrekte Interpretation ist:

- **Architektur-Gate: vorläufig GO.**
- **Mess-Gate für Brust/Hüfte: weiterhin offen.**

Diese Trennung ist verbindlich: Ein guter Retrieval-Score darf keine fehlerhafte geometrische Messung legitimieren.

### 5.3 v0.8.29.1 Measurement-Sanity-Gate

Der Solver bekommt einen rein technischen, sehr breiten Sanity-Gate für die vier aktuell benutzten Meshwerte. Er soll nur katastrophale Slice-/Messfehler abfangen und ist **kein anthropometrischer Plausibilitätsfilter**. Aktuell gelten nur folgende breite technische Bereiche:

- Statur 120–210 cm,
- Brust 55–180 cm,
- Taille 40–190 cm,
- Hüfte/Gesäß 55–200 cm.

Ein Retrieval-Kandidat mit einem offensichtlich ungültigen Snapshot wird nicht gerankt. Proof v1.1 ersetzt einen ungültigen Holdout deterministisch durch einen gleichgeschlechtlichen alternativen Trusted-Holdout und exportiert die übersprungenen Fälle als `skippedTargets`. Dadurch kann ein katastrophaler Messfehler den Architektur-Proof nicht mehr künstlich dominieren.

Dieser Gate **repariert die Messung nicht**. Die eigentliche Brust-/Hüft-Messdefinition und Mesh-Messung bleiben ein eigener Arbeitsstrang.

### 5.4 BODY BANK SOLVER 1.0 · Runtime-Kette

Der bevorzugte POC-Pfad bleibt:

1. Nutzer gibt Geschlecht, Alter, Körpergröße, Gewicht, Brust, Taille und Hüfte/Gesäß ein.
2. Grobe Vorauswahl nur aus `trusted` Body-Bank-Seeds.
3. Shortlist wird wirklich in Anny rekonstruiert und mit aktuellen Meshmaßen geprüft.
4. Top-5 werden angezeigt; der beste Start ist ein human-auditierter Seed.
5. Optionaler Local Fit verändert nur eng begrenzt `core:height`, `measure-bust-circ-incr`, `measure-waist-circ-incr`, `measure-hips-circ-incr`.
6. Keine freie Weight-/Muscle-Optimierung und keine Cross-Region-Rettung.
7. Ein schlechterer Gesamtscore wird vollständig auf den auditierten Seed zurückgerollt.
8. Ein veränderter Local Fit ist noch nicht sicher und wird an `BANK -> ACTIVE` übergeben.

### 5.5 Behobener Runtime-Fehler in v0.8.29.1

Der manuelle Button `1 · Bank suchen` in v0.8.29.0 war aufgrund einer ausgelassenen Funktionsdefinition nicht benutzbar. Die UI referenzierte `sammyBbsSearchRun`, die Funktion selbst fehlte im gebauten `app.js`. Safari meldete deshalb `ReferenceError: Can't find variable: sammyBbsSearchRun`.

v0.8.29.1 implementiert den Handler vollständig und ergänzt zwei Schutzebenen:

- Search-Handler speichert den Ausgangskörper, führt Trusted-Retrieval aus, rendert Top-5 und aktiviert Export/Local Fit.
- Beim UI-Init wird jetzt fail-fast geprüft, ob **alle** Body-Bank-Solver-Handler tatsächlich Funktionen sind. Der statische Release-Gate prüft dieselben Symbole zusätzlich vor dem Packen.

Damit soll genau diese Klasse von „Button existiert, Handler fehlt“-Fehlern künftig vor dem iPhone-Test auffallen.

### 5.6 ACTIVE AUDIT · Lernen bleibt transparent

Ein Active-Vote aktualisiert weiterhin sofort auf demselben Gerät:

- `accepted` -> `trusted-user`,
- `uncertain` -> `frontier-user`,
- `rejected` -> `negative-user`.

Anny selbst wird nicht trainiert. Mit einem zurückgegebenen Export wird der neue Wissensstand anschließend in den **kanonischen** Body-Bank-Index übernommen. Genau das ist in v0.8.29.1 erstmals erfolgt. Auf frischen Geräten filtert der ACTIVE-Modus bereits kanonisch bekannte Seed-Shapes aus und zeigt nur neue Solver-/Grenzkandidaten.

### 5.7 BANK-UI und ältere Auditregeln bleiben gültig

Der menu-safe Dual Viewport, unabhängige Kameras, Last-Interaction-Auswahl, optionales AutoFit pro Viewport, blinde Präsentation, 205-cm-Audit-Cap und das vertagte Kopf-/Head-Fat-Thema bleiben unverändert erhalten.

Der bekannte `shoulderJointBreadth`-Proxy bleibt aus Retrieval und Auto-Gates ausgeschlossen.

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

- **Body Bank Solver 1.0** ist ab v0.8.29.0 der aktuelle Architektur-POC für den zukünftigen Produktpfad: `trusted` Retrieval -> Top-K -> kleiner anatomisch begrenzter Local Fit -> Active Audit.
- `BANK -> ACTIVE` ist der Human-in-the-loop-Lernpfad für neue Solverzustände; Accepted-Votes können sofort lokal als neue Seeds verwendet werden.
- Body Fit v1.2 aus v0.8.27.2 bleibt unverändert als Vergleich/Fallback-Prototyp verfügbar, ist aber nicht mehr der bevorzugte Körperaufbaupfad.
- Der menu-safe Dual Viewport und die bisherigen Phase-2-Auditdaten bleiben erhalten.

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

## 10. Nächster Gate nach v0.8.29.0

Der nächste Entscheidungs-Gate ist jetzt **nicht** ein weiterer großer Zufallsaudit, sondern die neue Solverarchitektur selbst.

### Gate A · 8er Blind-Proof

Der Proof muss mindestens zeigen:

1. Retrieval-Median < höhenangepasster Neutralstart-Median.
2. Local-Fit-Median <= Retrieval-Median.
3. Kein Cross-Region-Controller und keine freie globale Weight/Muscle-Suche wurde dafür benötigt.
4. Die Ergebnisse bleiben technisch gültig und innerhalb des 205-cm-Produkt-/Auditbereichs.

Wenn Gate A `GO` ergibt, wird die Body Bank schrittweise größer und der Retrieval-Index um reale/stabile Eingabemaße erweitert.

### Gate B · Active Audit

Die vom Solver erzeugten neuen Körper werden in `BANK -> ACTIVE` blind bewertet. Wichtig ist nicht die Menge, sondern der Informationsgewinn an tatsächlich benutzten Solverregionen.

Zu prüfen ist insbesondere:

- ob Local-Fit-Ergebnisse überwiegend akzeptiert werden,
- ob Retrieval-Ambiguitäten durch zusätzliche Human-Votes auflösbar werden,
- ob Accepted-Active-Körper als neue Seeds die spätere Retrieval-Qualität verbessern,
- ob Rejections lokal bleiben und keine falschen globalen Grenzen erzeugen.

### Gate C · danach erst Solver-Ausbau

Erst nach A/B werden weitere Freiheitsgrade oder zusätzliche Nutzereingaben ergänzt. Bevorzugt werden nur Maße, die geometrisch stabil messbar und durch lokale anatomisch passende Controller kontrollierbar sind.

Das vertagte Kopfgrößen-/Head-Fat-Thema bleibt außerhalb dieses Gates und wird später mit absolutem Größenbezug separat geprüft.

## 11. Abbruch-/Entscheidungsregel

Wenn bereits der konservative Anny-Core-Raum überwiegend unplausibel ist oder sich keine ausreichend zusammenhängende akzeptierte Körperbank aufbauen lässt, wird nicht automatisch ein noch komplexerer Solver gebaut. Dann muss die Eignung von Anny als Basismodell selbst neu bewertet werden.

## 12. Änderungsprotokoll

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 22.08.2026 | Master State eingeführt; Landmark-/Messpipeline als damaliger Schwerpunkt dokumentiert. |
| 0.2 | 28.08.2026 | Projektstand konsolidiert; Audited Body Bank / lokale Körperfamilien als neue Hauptarchitektur; synchrone Master-State-/SAMMY_CURRENT-Exports festgelegt. |
| 0.3 | 28.08.2026 | GitHub-Pages-Hotfix: Cache-/Versionsdrift korrigiert; synchroner HTML/JS/CSS-Deployment-Gate und `.nojekyll`. |
| 0.4 | 28.08.2026 | BANK v0.8.28.2: Kamera bleibt über Personenwechsel erhalten; Posen/Animationen im Audit; Review-Kontext getrennt gespeichert. |
| 0.5 | 28.08.2026 | BANK v0.8.28.3: 400er Grenz-/Extremraum; Phase-1 `legs-too-long` dokumentiert; exakte Rest-Rig-Bein/Torso-Diagnosen statt fehlerhafter Umfangssnapshots. |
| 0.6 | 28.08.2026 | BANK v0.8.28.4: reviewer-blinde Mischung, BANK-only Dual Viewport, unabhängiges AutoFit, <=205-cm-Gate; Kopf/Head-Fat bewusst vertagt. |
| 0.7 | 28.08.2026 | BANK v0.8.28.5: iPhone-menüsicheres A/B-Layout; Dual Viewport nutzt nur die freie Viewer-Fläche. |
| 0.8 | 29.08.2026 | v0.8.29.0: Audit zu Body-Bank-Index kompiliert; Trusted-Top-K-Solver + kleiner Local Fit + 8er Blind-Proof + ACTIVE-Lernmodus. Shoulder-Proxy ausgeschlossen; Proof ohne kg-Vorauswahl; Non-Worsening-Rollback; Resume-Fix. |
| 0.9 | 29.08.2026 | v0.8.29.1: fehlenden manuellen Retrieval-Handler repariert; fail-fast UI-/Release-Handler-Gate; 32er ACTIVE-Audit kanonisch gemergt (269 trusted / 91 frontier / 37 negative / 0 unchecked); technische Mess-Sanity und Proof v1.1 wegen sichtbar falschem Brust-Snapshot. |
| 0.10 | 29.08.2026 | v0.8.29.2: stale Splash-Version v0.8.28.4 entfernt; Runtime-/Titel-/Hauptlabel-/Splash-/JS-/CSS-Versionen synchronisiert; Deployment-Gate erweitert; Solver-/Body-Bank-Daten unverändert. |
