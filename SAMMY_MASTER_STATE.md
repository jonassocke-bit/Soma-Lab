# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.8 · 29.08.2026 · App v0.8.29.0**

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

## 5. Aktueller Build v0.8.29.0 · BODY BANK SOLVER ARCHITECTURE 1.0 + ACTIVE AUDIT 1.0

### 5.1 Phase-2-Audit ist jetzt Solver-Datenbasis

Der 400er Blind-Audit aus v0.8.28.5 wurde als `Sammy_BODY_BANK_PHASE2_BLIND_AUDIT_2026-08-29T14-09-26-471Z.json` ausgewertet.

Gesamtergebnis auf Review-Ebene:

- 259 `Plausibel`,
- 84 `Unsicher`,
- 41 `Unplausibel`,
- 16 `unchecked`,
- 19 vollständig bewertete verdeckte Wiederholungspaare, davon 16 exakt gleich = 84,2 %.

Wichtig: Die drei nicht exakt gleichen Wiederholungspaare lagen nur in Nachbarkategorien. Es gab keinen direkten Plausibel-gegen-Unplausibel-Widerspruch.

Auf **eindeutige Körper** dedupliziert erzeugt v0.8.29.0 den neuen `body-bank-index-v1.json`:

- 246 `trusted` Körper: alle vorhandenen Bewertungen für diesen exakten Körper sind `accepted`,
- 83 `frontier`: unsicher bzw. Repeat-Uneinigkeit,
- 36 `negative`: alle vorhandenen Bewertungen für diesen exakten Körper sind `rejected`,
- 15 `unchecked`: noch ohne Human-Verdikt.

Nur `trusted` wird als Solver-Seed-Pool benutzt. `negative` bleibt ausschließlich lokales Negativwissen; es erzeugt **keine globale Slidergrenze**.

### 5.2 Audit bestätigt die lokale Body-Bank-Hypothese

Die gezielten Proportionsvarianten um bereits akzeptierte Körper waren deutlich stabiler als freie Extremkombinationen:

- Proportionsfamilien: 152 von 162 bewerteten Reviews plausibel = 93,8 %.
- Extremraum: 65 plausibel, 62 unsicher, 35 unplausibel bei 162 bewerteten Reviews.
- Breite Randstichprobe: 42 plausibel, 14 unsicher, 4 unplausibel bei 60 bewerteten Reviews.

Damit ist die zentrale Architekturhypothese für den nächsten Proof ausreichend unterstützt: **ein bereits plausibler naher Anny-Körper ist ein sinnvollerer Solver-Startpunkt als freie globale Exploration.**

Ein besonders klarer lokaler Problemkorridor ist `short-short-lean`: 23 von 23 bewerteten Fällen wurden abgelehnt. Das wird als Kombination/Korridor gespeichert, nicht als globales Verbot von `height`, `proportions` oder `weight` einzeln.

### 5.3 Bekannter Diagnosefehler: Shoulder-Joint-Proxy ausgeschlossen

Der Phase-2-Wert `shoulderJointBreadth` ist weiterhin offensichtlich geometrisch falsch und wird ab v0.8.29.0 **explizit aus Body-Bank-Retrieval und Auto-Gates entfernt**.

Weiterverwendet werden die plausiblen pose-unabhängigen Rest-Mesh-/Rest-Rig-Diagnosen wie Statur, Hip-Joint-Height-Ratio, Leg-Chain-Ratio, Femur/Tibia, Torso-Chain-Ratio, Pelvis-to-Neck-Ratio und Hip-Joint-Breadth-Ratio.

### 5.4 BODY BANK SOLVER 1.0

Der neue Solver ist ein additiver POC im bestehenden `SOLV`-Panel. Der alte Body Fit und die historischen ANSUR-Solver bleiben unverändert als Vergleich/Forschungsarchiv erhalten.

Runtime-Kette:

1. Nutzer gibt Geschlecht, Alter, Körpergröße, Gewicht, Brust, Taille und Hüfte/Gesäß ein.
2. Grobe Vorauswahl nur aus `trusted` Body-Bank-Seeds über Geschlecht, exakte gespeicherte Rest-Mesh-Statur, Alter und einen Gewichts-/BMI-Prior.
3. Nur die beste Shortlist wird tatsächlich in Anny rekonstruiert und am aktuellen Mesh für Statur, Brust, Taille, Hüfte/Gesäß und optional Mass-/Volumen-Prior vermessen.
4. Top-5 werden angezeigt; der beste Seed ist sofort ein **human-auditierter Ausgangskörper**.
5. Optionaler Local Fit verändert nur eng begrenzt:
   - `core:height`,
   - `measure-bust-circ-incr`,
   - `measure-waist-circ-incr`,
   - `measure-hips-circ-incr`.
6. `weight` und `muscle` werden in Solver 1.0 **nicht frei nachoptimiert**. Gewicht ist Retrieval-/Volumen-Prior und Diagnose, kein direkter Anny-Weight-Zielwert.
7. Keine Cross-Region-Rettung.

Ein veränderter Local-Fit ist definitionsgemäß noch **nicht human-auditiert** und wird deshalb automatisch an `BANK -> ACTIVE` übergeben. Ein Zustand gilt nur dann als `audited-seed`, wenn sein komplettes stabilisiertes Rezept exakt einem `trusted`/`trusted-user`-Node entspricht; auch eine reine `core:height`-Änderung bleibt ansonsten unauditiert. Zusätzlich besitzt Solver 1.0 einen globalen Non-Worsening-Gate: verschlechtert die gesamte lokale Korrektur den gemeinsamen Größen-/Brust-/Taillen-/Hüft- bzw. Runtime-Score, wird vollständig auf den auditierten Seed zurückgerollt.

### 5.5 Falsifizierbarer 8er Blind-Proof

`SOLV -> BODY BANK SOLVER -> 8er Blind-Proof` hält acht diverse `trusted` Körper nacheinander vollständig aus dem Retrieval-Pool heraus.

Für jeden versteckten Zielkörper werden Geschlecht und der aus dem Anny-Alterszustand abgeleitete Alterskontext wie bei bekannten Nutzer-Metadaten mitgeführt. Am echten Mesh werden zusätzlich genau vier geometrische Zielwerte erzeugt:

- Körpergröße,
- Brustumfang,
- Taillenumfang,
- Hüft-/Gesäßumfang.

Gewicht wird im Proof absichtlich **weder bewertet noch für die Retrieval-Vorauswahl benutzt**, weil der Phase-2-Audit kein objektives kg-Label für die Body-Bank-Körper enthält.

Verglichen werden auf exakt denselben vier Zielwerten:

1. neutraler gleichgeschlechtlicher Anny-Start, nur in der Statur angepasst,
2. bester Body-Bank-Retrieval-Seed, Zielkörper explizit ausgeschlossen,
3. derselbe Seed nach dem kleinen Local Fit.

Die Proof-Vorauswahl nutzt ohne Gewicht nur Statur + Alterskontext; der versteckte Zielkörper selbst ist aus dem Retrieval explizit ausgeschlossen. Der Local Fit besitzt den oben beschriebenen Rollback-Gate. Deshalb berichtet der Proof zusätzlich getrennt, in wie vielen Fällen der Local Fit **tatsächlich verbessert** und in wie vielen er nur nicht verschlechtert/auf den Seed zurückgerollt hat.

`GO` wird nur ausgegeben, wenn der mediane Retrieval-Fehler kleiner als der mediane Neutralstart-Fehler ist **und** der Local-Fit-Median den Retrieval-Median nicht verschlechtert. Es gibt keinen versteckten absoluten Erfolgswert.

### 5.6 ACTIVE AUDIT · unmittelbares transparentes Lernen

`BANK` besitzt ab v0.8.29.0 zwei getrennte Modi:

- `PHASE 2`: der bisherige 400er Blind-Audit bleibt vollständig erhalten.
- `ACTIVE`: neue, informationsreiche Kandidaten.

Der initiale Active-Seed enthält 32 Fälle:

- die 15 eindeutigen bisher ungeprüften Phase-2-Körper,
- 17 lokale Midpoints an Proportionsfamilien-Grenzen, an denen mindestens ein Nachbar `frontier` oder `negative` ist.

Zusätzlich erzeugt der Solver Active-Kandidaten, insbesondere:

- jedes tatsächlich veränderte Local-Fit-Ergebnis,
- enge Retrieval-Ambiguitäten zwischen ähnlich guten Seeds,
- Local-Fits aus dem 8er Proof.

Ein Active-Vote aktualisiert **sofort auf demselben Gerät** einen transparenten lokalen Learning-Store:

- `accepted` -> `trusted-user` und damit zusätzlicher Solver-Seed,
- `uncertain` -> `frontier-user`,
- `rejected` -> `negative-user`.

Anny selbst bzw. seine Modellgewichte werden nicht trainiert. Gelernt wird ausschließlich die nachvollziehbare SAMMY-Body-Bank-/Sicherheitsstruktur.

### 5.7 BANK-UI und ältere Auditregeln bleiben gültig

Der menu-safe Dual Viewport, unabhängige Kameras, Last-Interaction-Auswahl, optionales AutoFit pro Viewport, blinde Präsentation, 205-cm-Audit-Cap und das vertagte Kopf-/Head-Fat-Thema bleiben unverändert erhalten.

Zusätzlich ist der Resume-Pfad korrigiert: Wenn eine gespeicherte Sitzung am Ende steht, aber frühere `unchecked`-Fälle enthält, springt BANK beim erneuten Öffnen auf den ersten noch offenen Fall statt diese still zu übergehen.

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
