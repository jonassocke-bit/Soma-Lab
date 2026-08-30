# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.13 · 29.08.2026 · App v0.8.29.5**

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

## 5. Aktueller Build v0.8.29.5 · BODY BANK SOLVER 1.2 · ACTIVE MERGE + TRUST REGION + COVERAGE PREP

### 5.1 Kanonische Body Bank nach dem 61er ACTIVE-Audit

Der v0.8.29.4 ACTIVE-Export wurde vollständig kanonisch in `body-bank-index-v1.json` gemergt. Der Export enthält 61 bewertete ACTIVE-Körper: 49 accepted, 11 uncertain, 1 rejected. Davon waren 32 Körper bereits im kanonischen Index aus v0.8.29.1 enthalten; 29 exakte neue Körperformen kommen hinzu.

Kanonischer Stand ab v0.8.29.5:

- **426 eindeutige Nodes**,
- **295 `trusted`**,
- **94 `frontier`**,
- **37 `negative`**,
- **0 `unchecked`**.

Unter den 29 neu hinzugekommenen Solver-/Proof-Körpern wurden 26 akzeptiert, 3 als unsicher bewertet und keiner verworfen. Das bestätigt, dass die bisherigen kleinen Solverbewegungen visuell überwiegend innerhalb des brauchbaren Anny-Raums bleiben. Ein Accepted-Endpunkt zertifiziert aber weiterhin **keine** gesamte Interpolationskante als `SAFE_EDGE`. Neu erzeugte Graph-Hinweise tragen deshalb ausdrücklich den Status `edge-unaudited`.

Beim Laden von v0.8.29.5 werden lokale Learning-/Pending-Einträge, die bereits im kanonischen Index enthalten und nicht neuer als dieser Index sind, aus dem lokalen Overlay entfernt. Spätere lokale Votes dürfen den kanonischen Stand weiterhin lokal überlagern. Dadurch wird derselbe bereits gemergte ACTIVE-Bestand nicht erneut angezeigt oder doppelt gezählt.

### 5.2 Bestätigtes Top-3-GO aus v0.8.29.4

Der 24er Family-/Near-Neighbor-Holdout v1.3 bestätigte die Kernarchitektur deutlich:

- Neutral-Median: `0.87234`,
- Retrieval-Median: `0.390525`,
- Single-Seed Local-Fit-Median: `0.31155`,
- Top-3 Local-Fit-Median: `0.26887`,
- Retrieval verbessert Neutral: `18/24`,
- Top-3 verbessert Single Seed zusätzlich: `9/24`,
- Top-3 ist gegenüber Single Seed nicht schlechter: `24/24`,
- Top-3-Endzustand besser als Neutral: `22/24`.

Gewinner-Ränge: Rang 1 = 15 Fälle, Rang 2 = 3 Fälle, Rang 3 = 6 Fälle. Damit ist Top-3 kein kosmetischer Zusatz: In 9/24 Fällen kommt das beste lokale Ergebnis explizit nicht vom zunächst besten Retrieval-Seed.

Die zwei relativen Lücken `P2-P-132` und `P2-P-139` bleiben als Coverage-Signale erhalten. Die daraus erzeugten Top-3-Solverzustände wurden im anschließenden ACTIVE-Audit akzeptiert und werden ab v0.8.29.5 als zusätzliche Trusted-Nodes kanonisch geführt.

Diese Evidenz bestätigt den Architekturpfad `Trusted Retrieval -> Top-3 Local Fit -> Active Audit` **innerhalb des Anny-Raums**. Sie beweist weiterhin keine realanthropometrische Rekonstruktion externer Menschen.

### 5.3 Trust-Region Local Fit statt Ableitungsextrapolation

Der v0.8.29.4-Trace zeigte eine wichtige Nichtlinearität: Beim manuellen Brustfall verschlechterten sowohl `+0.05` als auch `-0.05` den gemessenen Brustumfang zunächst, während `+0.10` den Zielabstand deutlich reduzierte. Eine lokale Ableitung ist in solchen Situationen kein verlässlicher Extrapolator.

Ab v0.8.29.5 gilt daher für die lokalen Umfangscontroller Brust, Taille und Hüfte:

1. Vom aktuellen Zustand werden `+epsilon` und `-epsilon` **tatsächlich am Mesh gemessen**.
2. Wenn die lokalen Ableitungen widersprüchliche Vorzeichen zeigen oder beide kleinen Schritte den Zielabstand nicht verbessern, wird die Trust Region kontrolliert auf `+2epsilon` / `-2epsilon` erweitert, soweit die bestehenden Local-Bounds dies erlauben.
3. Akzeptiert wird ausschließlich ein **tatsächlich gemessener** Zustand mit kleinerem Zielabstand.
4. Es gibt keine Ableitungsextrapolation zu einem nicht gemessenen Morphwert.
5. Nach jedem Controller bleibt der bestehende globale `geometryScore`-Gate aktiv; eine technisch ungültige Messung oder schlechtere Gesamtgeometrie führt zum Rollback auf den auditierten Seed.

Die Local-Bounds bleiben unverändert. Es werden keine neuen DOFs freigeschaltet und keine Cross-Region-Rettungen zugelassen.

Die kanonische Höhe bleibt ein separater, eng begrenzter und bidirektional vermessener Core-Controller. Für sie gilt weiterhin die exakte Anny-Rest-Mesh-Bounding-Box-Höhe als einzige Solver-Statur.

### 5.4 Top-3 bleibt Produktionsstandard des Solver-POC

Retrieval liefert weiterhin Top-5 zur Vorschau; die ersten drei technisch gültigen Trusted-Seeds werden unabhängig lokal gefittet. Der beste sichere finale `geometryScore` gewinnt. Bei Gleichstand wird der kleinere lokale Abstand bevorzugt.

Weight bleibt nur Retrieval-/Diagnose-Prior. Der Local-Fit-Akzeptanzscore enthält ausschließlich die steuerbaren geometrischen Ziele Statur, Brust, Taille und Hüfte/Gesäß.

Ein veränderter Gewinner ist weiterhin `local-unaudited` und wird an `BANK -> ACTIVE` übergeben. Ein bereits im kanonischen Index vorhandener Accepted-Körper gilt dagegen sofort als Trusted Seed.

### 5.5 Messstatus und Human-Audit bleiben getrennt

`trusted` bedeutet weiterhin: dieser konkrete Körper wurde visuell akzeptiert. `solverEligible` bedeutet separat: die für den aktuellen Solver benötigten technischen Messungen bestehen den breiten Sanity-Gate.

Ein visuell guter Körper mit kollabiertem Umfangsschnitt wird nicht aus dem Human-Audit gelöscht, aber für die konkrete Retrieval-/Solverbewertung ausgeschlossen. Der bekannte fehlerhafte `shoulderJointBreadth`-Proxy bleibt vollständig außerhalb des Solverpfads.

### 5.6 Coverage Map wird vorbereitet, nicht erfunden

Neu ist `body-bank-coverage-prep-v1.json`. Dieses Manifest bereitet die nächste Abdeckungsphase vor, ohne Brust/Taille/Hüfte aus Anny-Core-Parametern zu erfinden.

Geplanter geometrischer Eingaberaum:

- Geschlecht,
- kanonische Rest-Mesh-Statur,
- Brustumfang,
- Taillenumfang,
- Hüft-/Gesäßumfang.

Gewicht bleibt als separater Retrieval-Prior. Für die 295 Trusted-Nodes müssen Brust/Taille/Hüfte im nächsten Coverage-Schritt exakt am Runtime-Rest-Mesh gemessen und durch den technischen Mess-Gate geschickt werden, bevor Coverage-Zellen vergeben werden.

Das Manifest enthält bereits die kanonische Trusted-Scan-Queue, Staturband-Verteilung und die bekannten relativen Lückenziele. Dies ist **Vorbereitung**, noch keine fertige Coverage-Karte.

### 5.7 Neuer Testpfad: 36er Coverage-Stress v1

Nach dem bestätigten 24er Architektur-GO wird kein weiterer nahezu identischer Architekturproof gebaut. Der bisherige Proof-Button führt ab v0.8.29.5 einen **36er geschlechtsbalancierten Coverage-Stress** aus.

Er behält die strengen Holdout-Regeln bei (Zielkörper, komplette Familie und Core-Nachbarn `<= 0.16` entfernt), dient aber primär zur Kartierung:

- Regression der bestehenden Architektur nach der Trust-Region-Änderung,
- Fehler nach Geschlecht und Staturband,
- Gewinner-Rang-Verteilung #1/#2/#3,
- relative Coverage-Gaps, bei denen Top-3 den neutralen Baselinekörper nicht schlägt.

Solche Gap-Fälle werden mit erhöhter Priorität in ACTIVE gestellt. Der Test behauptet ausdrücklich keinen neuen anthropometrischen Beweis.

### 5.8 Deployment-/BANK-Regeln bleiben gültig

Splash, Hauptlabel, HTML-Titel, `SAMMY_APP_VERSION` sowie JS-/CSS-Cache-Tags müssen dieselbe Version tragen. Die GitHub-Fassung bleibt unter 100 direkt sichtbaren Root-Dateien.

Der menu-safe Dual Viewport, unabhängige Kameras, Last-Interaction-Auswahl, optionales AutoFit pro Viewport, blinde Präsentation, 205-cm-Audit-Cap und das vertagte Kopf-/Head-Fat-Thema bleiben unverändert erhalten.

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

## 10. Nächster Gate nach v0.8.29.5

Die Grundarchitektur gilt nach dem 24er Top-3-GO als ausreichend bestätigt. Der nächste Gate ist **Abdeckung + Messqualität**, nicht ein weiterer neuer Solverentwurf.

### Gate A · 36er Coverage-Stress / Trust-Region-Regression

Der Coverage-Stress soll zeigen:

1. die Trust-Region-Umstellung verschlechtert den bestehenden Top-3-Pfad nicht systematisch,
2. Family-/Near-Neighbor-bereinigtes Retrieval bleibt im Median besser als Neutral,
3. Top-3 bleibt im Median nicht schlechter als Single Seed und Retrieval,
4. relative Lücken werden als konkrete Zielkörper/Familien exportiert statt durch größere Local-Bounds kaschiert,
5. neue Solverzustände bleiben nach menschlicher Prüfung überwiegend plausibel.

### Gate B · Coverage Scan der kanonischen Trusted Bank

Nach dem Stresslauf werden die 295 Trusted-Nodes für Statur/Brust/Taille/Hüfte technisch vermessen. Nur stabile Messungen erhalten Solver-Coverage-Zellen. Ziel ist eine explizite Karte von gut abgedeckten, dünn besetzten und fehlenden Regionen.

Neue Auditkörper werden anschließend **gezielt in den Lücken** erzeugt. Zufällige große Auditblöcke sind nicht mehr Standard.

### Gate C · Measurement Eligibility vor neuen Solvermaßen

Für jedes neue Zielmaß gilt zwingend:

`Messung stabil -> passender lokaler DOF vorhanden -> Wirkung im Kontext kontrollierbar -> erst dann Solverziel`.

Brust, Taille und Hüfte werden zunächst über viele Trusted-Körper auf Messkontinuität und Controllerreaktion geprüft. Kaputte Kombinationen dürfen maßspezifisch `solverEligible=false` werden, ohne den visuellen Trusted-Status zu verlieren.

### Gate D · externe Validierung

Erst nach ausreichender Coverage und Messstabilität folgt der erste unabhängige Body-Fit-Test gegen reale bzw. extern erzeugte anthropometrische Datensätze. Nutzerinputs bleiben zunächst klein: Geschlecht, Größe, Gewicht als Prior sowie Brust, Taille und Hüfte. Nicht eingegebene Maße dienen anschließend als unabhängige Validierungsgrößen.

Das vertagte Kopfgrößen-/Head-Fat-Thema bleibt außerhalb dieses Gates und wird später mit absolutem Größenbezug separat untersucht.

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
| 0.11 | 29.08.2026 | v0.8.29.3: kanonische Rest-Mesh-Statur im Body-Bank-Solver; Geometrie-Score von Weight-Prior getrennt; vollständiger Local-Fit-Trace; 16er Family-/Near-Neighbor-Holdout Proof v1.2; manuellen Solver-Kandidaten AA-S-2f9708e4 im ACTIVE-Seed erhalten. |
| 0.12 | 29.08.2026 | v0.8.29.4: 16er Family-Proof als GO dokumentiert; bidirektionales Controller-Probing; unabhängiger Top-3 Local Fit; Human-Audit von solverEligible getrennt; 24er Single-vs-Top-3 Family-Proof v1.3 als nächster Gate. |
| 0.13 | 29.08.2026 | v0.8.29.5: 61er ACTIVE-Audit kanonisch gemergt (295 trusted / 94 frontier / 37 negative); 24er Top-3-GO dokumentiert; Umfangs-Local-Fit auf gemessene Trust-Region ohne Ableitungsextrapolation umgestellt; Coverage-Prep-Manifest und 36er Coverage-Stress eingeführt. |
