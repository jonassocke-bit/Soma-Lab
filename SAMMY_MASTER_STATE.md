# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.11 · 29.08.2026 · App v0.8.29.3**

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

## 5. Aktueller Build v0.8.29.3 · BODY BANK SOLVER · PROOF HARDENING 1.1

### 5.1 Kanonische Body Bank

Der kanonische `body-bank-index-v1.json` bleibt bei **397 eindeutigen Nodes** aus Phase 2 plus dem abgeschlossenen 32er ACTIVE-Audit:

- 269 `trusted`,
- 91 `frontier`,
- 37 `negative`,
- 0 `unchecked`.

`negative` bleibt lokales Negativwissen. Kein Audit-Vote wird in eine globale Slidergrenze übersetzt. Der bekannte fehlerhafte `shoulderJointBreadth`-Proxy bleibt aus Retrieval und Auto-Gates ausgeschlossen.

### 5.2 Bisherige Solver-Evidenz

Der erste 8er Proof aus v0.8.29.0 unterstützte die Architekturhypothese bereits deutlich, war aber wegen eines offensichtlich falschen Brust-Snapshots noch nicht als sauberer Solverbeweis geeignet.

Der reparierte Proof v1.1 unter v0.8.29.2 ergab:

- Neutral-Median: `0.45745`,
- Body-Bank-Retrieval-Median: `0.115095`,
- Local-Fit-Median: `0.115095`,
- Retrieval besser als neutral: 6/8,
- Local Fit nicht schlechter als Retrieval: 8/8,
- Local Fit tatsächlich verbessert: 1/8,
- ein technisch ungültiger Holdout (`chest = 42.96 cm`) wurde vom Measurement-Sanity-Gate korrekt übersprungen und ersetzt.

Der manuelle Test `Mann · 35 · 178 cm · 80 kg · Brust 100 · Taille 85 · Hüfte 100` lief vollständig durch und reduzierte den damaligen kombinierten Score von `0.788` auf `0.518`. Er erzeugte den unauditierten ACTIVE-Kandidaten `AA-S-2f9708e4`.

Diese Evidenz stützt weiterhin den neuen Hauptpfad, zeigt aber zwei methodische Schwächen des bisherigen Proofs: nahe Familiennachbarn konnten im Holdout verbleiben, und zwei unterschiedliche Körperhöhen-Definitionen wurden parallel verwendet.

### 5.3 Eine kanonische Körperhöhe im Body-Bank-Solver

Ab v0.8.29.3 verwendet der Body-Bank-Solver für Eingabe, Retrieval, Proof und `core:height`-Local-Fit **eine einzige Staturdefinition**:

`exact Anny rest-mesh bounding-box height`.

Die bisherige Measurement-Stack-Statur wird im Solver nur noch diagnostisch exportiert (`legacyMeasureStatureCm` und Differenz zur kanonischen Statur). Sie darf den Body-Bank-Score oder Height-Fit nicht mehr steuern. Damit wird die in v0.8.29.2 beobachtete systematische Differenz von ungefähr 2.4 cm nicht länger in zwei widersprüchlichen Solverpfaden verwendet.

Die allgemeine Messpipeline außerhalb des Body-Bank-Solvers bleibt davon unberührt; Messdefinition und Solverdefinition bleiben getrennte Arbeitsstränge.

### 5.4 Geometrischer Fit und Gewicht/Prior werden getrennt

Gewicht wird weiterhin als Seed-/Ranking-Prior und als Diagnose genutzt. Es ist jedoch **kein lokal steuerbares Ziel** in Solver 1.0 und darf deshalb den Local-Fit-Gate nicht retten oder verwerfen.

Ab v0.8.29.3 gilt:

- `geometryScore`: nur Statur + Brust + Taille + Hüfte/Gesäß,
- `weightPriorScore`: separater Diagnose-/Retrievalwert,
- `retrievalScore`: Geometrie plus schwach gewichteter Weight-Prior für die Seed-Rangfolge,
- `Local-Fit global gate`: ausschließlich `geometryScore`.

Weight/Muscle werden weiterhin nicht frei nachoptimiert. Cross-Region-Rettung bleibt verboten.

### 5.5 Family-Holdout-Proof v1.2

Der alte Exact-Body-Holdout wird durch einen härteren **16er Family-Holdout** ersetzt. Für jeden versteckten Zielkörper werden vor Retrieval ausgeschlossen:

1. der exakte Zielkörper,
2. die komplette `familyId`,
3. zusätzlich sehr nahe Core-Rezeptnachbarn mit `coreDistance <= 0.16`.

Der Proof ist auf den Produktbereich 140–205 cm begrenzt und weiterhin geschlechtsbalanciert. Er vergleicht:

`neutraler Anny-Start -> family-bereinigtes Trusted Retrieval -> kleiner Local Fit`.

GO bleibt bewusst ein einfaches Architektur-Gate:

- Retrieval-Median < Neutral-Median,
- Local-Fit-Median <= Retrieval-Median.

Zusätzlich werden Fallzahl, Retrieval-bessere Fälle, lokale Verbesserungen und die tatsächlich ausgeschlossenen Body-/Family-/Near-Neighbor-Zahlen exportiert. Der Proof repariert keine fehlerhafte Brust-/Hüftmessung; der breite technische Measurement-Sanity-Gate bleibt vorgeschaltet.

### 5.6 Vollständiger Local-Fit-Trace

Ab v0.8.29.3 schreibt jeder zugelassene Controller einen Trace-Eintrag, auch wenn **keine** Änderung erfolgt. Gründe sind unter anderem:

- `within-deadband`,
- `morph-missing`,
- `local-bound`,
- `weak-derivative`,
- `no-improvement-rollback`,
- `improved`.

Damit ist sichtbar, ob Höhe, Taille, Hüfte und Brust tatsächlich versucht, bewusst nicht benötigt oder wegen fehlender lokaler Wirksamkeit verworfen wurden.

### 5.7 ACTIVE Audit und erhaltenes Solver-Ergebnis

Der aus dem erfolgreichen v0.8.29.2-Manuallauf erzeugte Kandidat `AA-S-2f9708e4` wird zusätzlich im statischen ACTIVE-Seed erhalten. Er bleibt **unauditiert**, bis er in `BANK -> ACTIVE` mit ✓ / ? / × bewertet wurde. Auf Geräten, auf denen derselbe Kandidat bereits im lokalen Pending Store liegt, wird er über die stabile Shape-ID dedupliziert.

Der Human-in-the-loop-Lernpfad bleibt transparent:

- `accepted` -> `trusted-user`,
- `uncertain` -> `frontier-user`,
- `rejected` -> `negative-user`.

Anny selbst wird nicht trainiert.

### 5.8 Deployment-/BANK-Regeln bleiben gültig

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

## 10. Nächster Gate nach v0.8.29.3

Der nächste Entscheidungs-Gate ist der **16er Family-Holdout-Proof v1.2**.

### Gate A · 16er Family-Holdout

Der Proof muss mindestens zeigen:

1. Retrieval-Median < kanonisch höhenangepasster Neutralstart-Median.
2. Local-Fit-Median <= Retrieval-Median.
3. Zielkörper, komplette Familie und Near-Neighbors wurden tatsächlich aus dem Retrieval-Pool ausgeschlossen.
4. Kein Cross-Region-Controller und keine freie globale Weight/Muscle-Suche wurde benötigt.
5. Die Ergebnisse bleiben technisch gültig und im 140–205-cm-Produktbereich.

Ein GO bestätigt die Architektur deutlich stärker als der bisherige Exact-Body-Holdout. Ein HOLD führt zuerst zur Analyse von Bankabdeckung, Messqualität oder lokalen DOFs; nicht automatisch zu einem komplexeren Solver.

### Gate B · ACTIVE Audit der neuen Solverzustände

Nach dem Family-Proof werden nur tatsächlich neue Solver-/Grenzkandidaten in `BANK -> ACTIVE` bewertet. Der bereits erhaltene Kandidat `AA-S-2f9708e4` gehört ausdrücklich dazu.

Zu prüfen ist insbesondere:

- ob Local-Fit-Ergebnisse überwiegend akzeptiert werden,
- ob Rejections lokal bleiben,
- ob neue Accepted-Körper die Retrieval-Abdeckung sinnvoll erweitern,
- ob der Solver wiederholt dieselben unsicheren Korridore anfordert.

### Gate C · danach erst Solver-Ausbau

Erst nach A/B werden zusätzliche Freiheitsgrade oder weitere Nutzereingaben ergänzt. Bevorzugt werden nur Maße, die geometrisch stabil messbar sind und passende lokale DOFs besitzen.

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
| 0.11 | 29.08.2026 | v0.8.29.3: kanonische Rest-Mesh-Statur im Body-Bank-Solver; Geometrie-Score von Weight-Prior getrennt; vollständiger Local-Fit-Trace; 16er Family-/Near-Neighbor-Holdout Proof v1.2; manuellen Solver-Kandidaten AA-S-2f9708e4 im ACTIVE-Seed erhalten. |
