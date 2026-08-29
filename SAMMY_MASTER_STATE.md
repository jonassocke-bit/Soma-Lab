# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.12 · 29.08.2026 · App v0.8.29.4**

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

## 5. Aktueller Build v0.8.29.4 · BODY BANK SOLVER 1.1 · TOP-3 + BIDIRECTIONAL PROBING

### 5.1 Kanonische Body Bank

Der kanonische `body-bank-index-v1.json` bleibt inhaltlich bei **397 eindeutigen Nodes** aus Phase 2 plus abgeschlossenem 32er ACTIVE-Audit:

- 269 `trusted`,
- 91 `frontier`,
- 37 `negative`,
- 0 `unchecked`.

`negative` bleibt lokales Negativwissen. Kein Audit-Vote wird in eine globale Slidergrenze übersetzt. Der bekannte fehlerhafte `shoulderJointBreadth`-Proxy bleibt aus Retrieval und Auto-Gates ausgeschlossen.

Die erfolgreichen v0.8.29.3 Proof-/Manuallauf-JSONs werden als Solver-Evidenz im vollständigen Projektstand mitgeführt. Neue, durch Proof oder manuellen Solver erzeugte und noch nicht bewertete Kandidaten bleiben auf demselben GitHub-Origin über den bestehenden Pending-/ACTIVE-LocalStorage erhalten und werden nicht stillschweigend als `trusted` übernommen.

### 5.2 Belastbare Solver-Evidenz aus v0.8.29.3

Der Family-/Near-Neighbor-Holdout v1.2 entfernte pro Ziel:

1. den exakten Zielkörper,
2. die komplette `familyId`,
3. Core-Rezeptnachbarn mit Distanz `<= 0.16`.

Trotz dieses deutlich härteren Gates blieb die Architektur auf GO:

- Neutral-Median: `0.514685`,
- Retrieval-Median: `0.435545`,
- Single-Seed Local-Fit-Median: `0.303705`,
- Retrieval besser als neutral: `11/16`,
- Local Fit verbessert Retrieval: `11/16`,
- finaler Local Fit besser als neutral: `14/16`.

Damit gilt die Kernhypothese `auditiertes Retrieval -> kleiner lokaler Fit` als ausreichend gestützt, um den Solver gezielt weiterzuentwickeln. Dies ist weiterhin **kein Beweis realanthropometrischer Rekonstruktion**, weil Zielkörper und Zielmaße aus dem eigenen Anny-Raum stammen.

### 5.3 Kritischer Fund: Morphname bestimmt keine Wirkrichtung

Der vollständige v0.8.29.3-Trace zeigte, dass derselbe direkte Brust-Controller `measure-bust-circ-incr` abhängig vom konkreten Körperkontext gegensätzliche lokale Messableitungen besitzen kann. Im manuellen Kontrollkörper war die lokale Ableitung negativ; andere Proof-Körper zeigten positive oder erneut stark negative Ableitungen.

Daraus folgt verbindlich:

**Der Solver darf niemals aus `incr` / `decr` oder aus einem semantischen Morphnamen auf die aktuelle Messrichtung schließen.**

Jeder zugelassene Controller muss am konkreten Seed und im aktuellen bereits veränderten Körperzustand lokal vermessen werden.

### 5.4 Bidirektionales Controller-Probing

Ab v0.8.29.4 werden die vier erlaubten Local-Fit-Controller am konkreten Seed bidirektional geprobt:

- `core:height`,
- `measure-bust-circ-incr`,
- `measure-waist-circ-incr`,
- `measure-hips-circ-incr`.

Für jeden aktiven Controller werden, soweit die lokalen Bounds es erlauben, `+epsilon` und `-epsilon` getestet. Der Solver misst daraus die tatsächlichen lokalen Ableitungen und erzeugt mögliche Korrekturschritte aus der gemessenen Wirkung, nicht aus dem Morphnamen.

Der Trace speichert Probe-Ausgaben, Ableitungen, gewählte Richtung/Quelle, mögliche lokale Vorzeichenwechsel sowie Rollback-Gründe. Die kleinen bisherigen Local-Bounds bleiben unverändert. Es werden **keine neuen DOFs** freigeschaltet.

### 5.5 Top-3 Local Fit

Der Runtime-Solver verwendet weiterhin Trusted Retrieval. Neu ist die lokale Seedstrategie:

1. Retrieval erzeugt die Top-5-Vorschau.
2. Die Retrieval-Ränge `#1`, `#2` und `#3` werden unabhängig voneinander lokal gefittet.
3. Jeder Fit startet exakt vom jeweiligen auditierten Seed und bleibt in dessen lokalen Bounds.
4. Der kleinste zulässige finale `geometryScore` gewinnt; bei Gleichstand wird der kleinere lokale Abstand bevorzugt.
5. Nur der Gewinner wird dargestellt und - falls verändert - als `local-unaudited` an `BANK -> ACTIVE` übergeben.

Damit kann ein Seed, der vor Local Fit knapp schlechter gerankt war, gewinnen, wenn seine lokale Geometrie besser kontrollierbar ist. Der Solver darf dafür weder Cross-Region-Morphs noch größere Bounds benutzen.

### 5.6 Human-Audit-Status und Solver-Eignung sind getrennt

Ein `HUMAN_ACCEPTED` / `trusted` Körper bleibt wertvolles visuelles Plausibilitätswissen. Eine technisch kaputte Brust-/Taillen-/Hüftmessung darf diesen Human-Vote nicht nachträglich löschen.

Ab v0.8.29.4 wird deshalb explizit getrennt:

- `trusted`: visuell akzeptierter Körper im auditierten Körperraum,
- `solverEligible`: die für den aktuellen Solver benötigten technischen Messungen bestehen den breiten Measurement-Sanity-Gate.

Ein `trusted`, aber aktuell solver-ineligible Körper wird aus der betreffenden Retrieval-Shortlist ausgeschlossen. Sein Auditstatus bleibt erhalten. Der gleiche Gate wird auch auf den finalen Local-Fit-Zustand angewandt; ein technischer Ausfall führt zum Rollback auf den auditierten Seed.

### 5.7 Kanonische Statur und Scoretrennung bleiben verbindlich

Der Body-Bank-Solver verwendet weiterhin ausschließlich die **exakte Anny-Rest-Mesh-Bounding-Box-Höhe** als kanonische Statur. Die ältere Measurement-Stack-Statur bleibt Diagnosewert.

Scoretrennung:

- `geometryScore`: Statur + Brust + Taille + Hüfte/Gesäß,
- `weightPriorScore`: separater Retrieval-/Diagnosewert,
- `Local-Fit global gate`: ausschließlich steuerbare Geometrie.

Weight/Muscle werden weiterhin nicht frei nachoptimiert.

### 5.8 Neuer Proof v1.3 · 24er Family-Holdout mit Single-vs-Top-3

Der nächste Architekturtest umfasst **24 geschlechtsbalancierte Family-Holdouts** im Produktbereich 140–205 cm. Die bisherigen Ausschlüsse bleiben identisch: Zielkörper, komplette Familie und Core-Nachbarn `<= 0.16` werden verborgen.

Für exakt dieselbe Retrieval-Shortlist werden vier Stufen verglichen:

`Neutral -> Retrieval -> Single-Seed Local Fit (#1) -> Top-3 Local Fit (#1-#3)`.

Damit wird der Zusatznutzen von Top-3 isoliert, ohne gleichzeitig Bank, Holdout-Regel oder Morphraum zu verändern.

GO-Gate:

- Retrieval-Median < Neutral-Median,
- Top-3-Median <= Single-Seed-Median,
- Top-3-Median <= Retrieval-Median.

Zusätzlich werden Top-3-Zusatzgewinne pro Fall, Gewinner-Rang und alle drei lokalen Controller-Traces exportiert.

### 5.9 Deployment-/BANK-Regeln bleiben gültig

Splash, Hauptlabel, HTML-Titel, `SAMMY_APP_VERSION` sowie JS-/CSS-Cache-Tags müssen dieselbe Version tragen. Der statische Release-Gate prüft diese Marker gemeinsam.

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

## 10. Nächster Gate nach v0.8.29.4

Der nächste Entscheidungs-Gate ist der **24er Top-3 Family-Holdout Proof v1.3**.

### Gate A · Architektur unter Top-3

Der Proof muss zeigen:

1. Family-/Near-Neighbor-bereinigtes Retrieval schlägt den kanonisch höhenangepassten Neutralstart im Median.
2. Top-3 Local Fit ist im Median nicht schlechter als der Single-Seed-Fit von Retrieval-Rang #1.
3. Top-3 ist nicht schlechter als das unveränderte Retrieval.
4. Die Gewinner entstehen ausschließlich aus den erlaubten anatomischen Controllern und unveränderten kleinen Local-Bounds.
5. Technisch kaputte Messungen werden als `solver-ineligible` verworfen, ohne Human-Auditwissen zu löschen.
6. Controller-Richtung wird aus bidirektional gemessener lokaler Wirkung bestimmt, nicht aus dem Morphnamen.

Ein GO bedeutet: Die Kernarchitektur `Trusted Retrieval -> Top-3 Local Fit -> Active Audit` ist für den nächsten Ausbau stabil genug. Danach soll **kein weiterer nahezu identischer Architekturproof** gebaut werden.

### Gate B · ACTIVE Audit der neuen Gewinner

Nur tatsächlich veränderte Top-3-Gewinner werden als `local-unaudited` in `BANK -> ACTIVE` gestellt. Zu prüfen ist:

- Akzeptanzrate der neuen Solverzustände,
- wiederkehrende Frontier-/Negativkorridore,
- ob einzelne Retrieval-Ränge überproportional unplausible lokale Gewinner erzeugen,
- ob neue Accepted-Körper die Bankabdeckung sinnvoll erweitern.

### Gate C · danach Maßabdeckung / reale Validierung

Nach erfolgreichem Gate A/B beginnt der nächste echte Ausbau:

- Body-Bank-Abdeckung gezielt verbreitern,
- nur geometrisch stabile und lokal kontrollierbare weitere Maße ergänzen,
- externe/realistische Daten für Missing-Measure-Priors und Validierung nutzen,
- Solver-Erfolg außerhalb des rein eigenen Anny-Holdout-Raums prüfen.

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
