# SAMMY / BODY LAB / SOMA-LAB · MASTER STATE

**Kanonischer Projektstand · Version 0.6 · 28.08.2026 · App v0.8.28.4**

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

## 5. Aktueller Build v0.8.28.4 · BODY BANK PHASE 2 · BLIND MIX + DUAL VIEWPORT

### Ergebnis Phase 1 (v0.8.28.2)

Der erste 100er-Audit wurde abgeschlossen und als `Sammy_BODY_BANK_AUDIT_2026-08-28T19-10-48-878Z.json` ausgewertet.

Gesamtergebnis inklusive verdeckter Wiederholungen:

- 70 `Plausibel`,
- 26 `Unsicher`,
- 2 `Unplausibel`,
- 2 nicht bewertet,
- 4 von 5 verdeckten Wiederholungen exakt gleich bewertet.

Auf eindeutige Körper reduziert sind 66 akzeptierte Anker, 25 unsichere, 2 abgelehnte und 2 unbewertete Körper vorhanden.

Wichtige Human-Audit-Erkenntnis: Der Nutzer erklärte nach dem Lauf, dass **alle unsicheren Bewertungen ausschließlich dadurch entstanden, dass die Beine extrem lang wirkten**. Diese Aussage wird als Phase-1-Annotation `legs-too-long` gespeichert; sie ist keine globale Regel.

Die Phase-1-Auswertung zeigt zugleich einen Zusammenhang mit Annys Core-Achsen: Unsichere Körper lagen im Mittel deutlich höher bei `proportions` und `height` als akzeptierte Körper. Dies wird nur als Auswahlhinweis für Phase 2 genutzt, nicht als harte Grenze.

### Mess-/Diagnosekorrektur

Die visuellen Phase-1-Verdikte sind gültige Auditdaten. Die damals mitgespeicherten einfachen Umfangs-/Proxy-Snapshots sind jedoch **nicht für Body-Bank-Statistik freigegeben**: In einzelnen Fällen traten offensichtlich unbrauchbare Umfangs- und Schulterproxywerte auf.

Phase 2 speichert deshalb keine dieser einfachen Umfangssnapshots mehr. Stattdessen werden nur pose-unabhängige, geometrisch robuste Diagnosekennzahlen verwendet:

- Rest-Mesh-Körperhöhe,
- Hüftgelenkhöhe relativ zur Körperhöhe,
- Femur- + Tibia-Kettenlänge relativ zur Körperhöhe,
- Femur/Tibia-Verhältnis,
- Torso-Skelettkette relativ zur Körperhöhe,
- vertikales Becken-zu-Hals-Verhältnis,
- Schulter- und Hüftgelenkbreite relativ zur Körperhöhe.

Grundlage ist das **shape-abhängige exakte Anny/SOMA-Rest-Rig**, nicht die sichtbare Auditpose oder Animation. Diese Kennzahlen dienen zunächst nur zur Diagnose der langen-Beine-Grenze; daraus wird noch kein anthropometrischer Auto-Gate abgeleitet.

### Phase-2-Queue · blind gemischt

Der wissenschaftliche Inhalt des 400er Audits bleibt erhalten: Proportionsfamilien, absichtliche Extremkombinationen, breite Randstichproben und 20 verdeckte Wiederholungen. **Für die menschliche Bewertung wird die Queue jedoch vollständig blind durchmischt.**

Die neue Planfassung `body-bank-phase2-plan-v2.json`:

- mischt alle 400 Fälle deterministisch mit gespeichertem Shuffle-Seed,
- verhindert direkte Nachbarschaft derselben `familyId` bzw. desselben Elternankers,
- hält verdeckte Wiederholungen mit großem Abstand zum Original,
- zeigt dem Reviewer weder Testtyp noch Familie, Variantenrichtung, Ausgangsanker oder Wiederholungsstatus,
- enthält weiterhin 380 eindeutige Zielkörper + 20 verdeckte Wiederholungen.

Damit soll verhindert werden, dass der Reviewer eine sichtbare Änderungsserie erkennt und relativ zum unmittelbar vorherigen Körper urteilt.

### Erwachsenengröße

Für diesen Audit werden **keine Erwachsenen über 205 cm angezeigt**. Der Plan wird zunächst konservativ anhand der aus Phase 1 beobachteten Beziehung zwischen Anny-`height` und Rest-Mesh-Körperhöhe vorgekappt. Vor jeder Anzeige folgt zusätzlich ein harter, pose-unabhängiger Check der tatsächlichen Rest-Mesh-Statur. Falls ein Kandidat noch über 205 cm liegt, wird ausschließlich seine `height`-Komponente so weit reduziert, bis der exakte Rest-Mesh-Wert innerhalb der Grenze liegt. Die angepasste Rezeptur wird für verdeckte Wiederholungen identisch weiterverwendet.

Die 205-cm-Regel ist eine **Audit-Sampling-Grenze**, keine anthropometrische Aussage, dass größere Menschen unmöglich sind. Sie vermeidet nur extrem seltene Größen, die für die aktuelle Kartierung wenig Informationsgewinn liefern.

### BANK-only Dual Viewport

Nur im `LAB -> BANK`-Modus stehen zwei Viewports A/B zur Verfügung. Beide zeigen dieselbe Person und denselben Bewegungsframe, besitzen aber **unabhängige Kameras**:

- eigener Zoom, Orbit, Pan und Blickwinkel,
- letzter Klick / Touch / Orbit / Zoom wählt automatisch den aktiven Viewport,
- `Vorne`, `3/4`, `Seite`, `Hinten` und `AutoFit` wirken nur auf den aktiven Viewport,
- die aktive Ansicht wird dezent markiert,
- Pose/Animation bleibt absichtlich synchron, damit derselbe Bewegungsframe gleichzeitig aus zwei Richtungen beurteilt werden kann.

### Optionales AutoFit

`AutoFit` ist **pro Viewport separat ein-/ausschaltbar**.

- `AutoFit AN`: Beim Wechsel zur nächsten Person wird die Kamera so angepasst, dass der neue Körper ungefähr gleich groß im jeweiligen Viewport erscheint. Die aktuelle Blickrichtung bleibt erhalten.
- `AutoFit AUS`: Kamera, Zoom und Zielpunkt bleiben beim Personenwechsel exakt stehen.
- Ein expliziter View-Button (`Vorne`, `3/4`, `Seite`, `Hinten`) darf unabhängig davon neu einrahmen.

Damit ragt ein großer Körper nach einem kleinen nicht versehentlich aus dem Bild, ohne den bereits gewünschten manuellen Kamera-Lock abzuschaffen.

### Objektivitätsregel Schnellgrund

Der optionale Schnellgrund für `?` / `x` bleibt verfügbar, wird aber in v0.8.28.4 **nicht mehr mit `Beine zu lang` vorausgewählt**. Standard ist `kein Grund`, damit die bekannte Phase-1-Beobachtung den neuen Blind-Audit nicht vorprägt.

### Kopfmodell · bewusst vertagt

Eine Quellcodeprüfung von Anny zeigt: `height`, `weight`, `age` usw. sind separate Phenotypachsen; zusätzlich existieren lokale Kopf-Morphs wie `head-fat` und Kopf-Skalierungsachsen. Das beobachtete Verhalten, dass Kopfgröße bzw. Kopffett nicht automatisch anthropometrisch mit Körpergröße/Gewicht gekoppelt werden, ist daher überwiegend eine Eigenschaft des zugrunde liegenden Anny/MakeHuman-Modells und **kein aktueller BANK-Browserfehler**.

Diese Korrektur wird **nicht in den aktuellen Blind-Audit aufgenommen**, weil dort kein absoluter Größenmaßstab sichtbar ist und Kopfgröße derzeit keine kritische Zielgröße ist. Sie bleibt als spätere Aufgabe festgehalten: separate Prüfung mit bekannter Körpergröße und anthropometrischem Kopf-Körper-Verhältnis; erst danach ggf. semantische Kopplung von Head-Size/Head-Fat.

### Datenbasis Phase 2

Der Build enthält:

- `body-bank-phase1-audit-seed-v1.json`: konsolidiert die 95 eindeutigen Phase-1-Körper, Originalurteile und die nachträgliche `legs-too-long`-Annotation.
- `body-bank-phase2-plan-v2.json`: blind durchmischter 380+20-Plan mit 205-cm-Samplingregel, gespeichertem Shuffle-Seed und unverändertem lokalen Familienkontext für die spätere Auswertung.

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
- v0.8.28.4 setzt den Body-Bank-/Audit-Pfad als echten Blind-Audit fort: dieselben lokalen Proportions-/Extrem-/Randfälle werden objektiv durchmischt, mit BANK-only Dual-Viewport und optionalem AutoFit geprüft. Der Runtime-Lookup/Fitter bleibt weiterhin deaktiviert, bis dieser Raum ausreichend kartiert ist.

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

## 10. Nächster Gate nach v0.8.28.4

Der Nutzer auditiert die 400 Phase-2-Fälle und exportiert `Sammy_BODY_BANK_PHASE2_AUDIT_*.json`.

Danach werden mindestens getrennt bewertet:

1. **Lange-Beine-Grenze:** Zusammenhang zwischen `legs-too-long` und den neuen exakten Rest-Rig-Kennzahlen (`hipJointHeightRatio`, `legChainRatio`, `torsoChainRatio`) innerhalb einzelner Körperfamilien.
2. **Kontextabhängigkeit:** ob ähnliche Skelettverhältnisse in verschiedenen Körperfamilien unterschiedlich bewertet werden und deshalb lokale statt globale Grenzen nötig bleiben.
3. **Extremraum:** welche der absichtlich weit getriebenen Core-Kombinationen noch plausibel sind und wo echte lokale Ablehnungsregionen beginnen.
4. **Breite Randabdeckung:** ob außerhalb des bisherigen komfortablen Innenraums weitere plausible Inseln existieren.
5. **Reviewer-Konsistenz:** 20 verdeckte Wiederholungen, getrennt nach Proportions-, Extrem- und Randfällen.
6. **Zusammenhängender akzeptierter Raum:** ob genug `HUMAN_ACCEPTED`-Anker und lokale Übergänge für einen ersten Lookup-Prototyp vorhanden sind.

Erst wenn diese Auswertung brauchbar ist, folgt der nächste technische Proof:

- Top-K-Lookup auf akzeptierten Anny-Rezepten,
- zunächst nur mit wenigen stabilen Eingaben,
- anschließend sehr kleiner anatomisch gerouteter lokaler Fitter,
- kein freier From-Scratch-Solver.

Wenn die langen-Beine-Unsicherheit durch einen klaren, aber familienabhängigen Skelettbereich erklärt werden kann, wird daraus **keine globale `proportions`-Grenze**, sondern ein lokaler Audit-/Korridorhinweis für die jeweilige Körperfamilie.

## 11. Abbruch-/Entscheidungsregel

Wenn bereits der konservative Anny-Core-Raum überwiegend unplausibel ist oder sich keine ausreichend zusammenhängende akzeptierte Körperbank aufbauen lässt, wird nicht automatisch ein noch komplexerer Solver gebaut. Dann muss die Eignung von Anny als Basismodell selbst neu bewertet werden.

## 12. Änderungsprotokoll

| Version | Datum | Änderung |
|---|---|---|
| 0.1 | 22.08.2026 | Master State eingeführt; Landmark-/Messpipeline als damaliger Schwerpunkt dokumentiert. |
| 0.2 | 28.08.2026 | Auf aktuellen Projektstand konsolidiert. From-Scratch-Solver nicht mehr bevorzugter Produktpfad; Audited Body Bank / lokale Körperfamilien als neue Hauptarchitektur. BODY BANK AUDIT PoC v0.8.28.0 und verpflichtende synchronisierte Master-State-/SAMMY_CURRENT-Exports festgelegt. |
| 0.3 | 28.08.2026 | GitHub Pages Hotfix v0.8.28.1: Cache-Busting-/Versionsdrift aus v0.8.28.0 korrigiert; synchroner HTML/JS/CSS-Deployment-Gate und `.nojekyll` als Exportregel ergänzt. |
| 0.4 | 28.08.2026 | BODY BANK v0.8.28.2: manueller Zoom/Orbit bleibt über Personenwechsel erhalten; nur expliziter Viewport-Wechsel reframed. Statische Posen, Gang-/Stress-Loops und importierte Animationen direkt im Audit. Review-Kontext wird gespeichert; numerische Audit-Snapshots sind pose-unabhängig. |
| 0.5 | 28.08.2026 | BODY BANK v0.8.28.3: Phase-1-Audit konsolidiert; alle Unsicherheiten als nutzerbestätigtes `legs-too-long`-Signal dokumentiert. Neuer 400er Grenz-/Extremraum (160 Proportionsfamilien, 160 Extremfälle, 60 breite Randfälle, 20 verdeckte Wiederholungen). Fehleranfällige Phase-1-Umfangssnapshots aus dem Bank-Pfad entfernt; stattdessen exakte Anny-Rest-Rig-Bein/Torso-Verhältnisse. Optionaler persistenter Schnellgrund ohne Kommentarzwang. |
| 0.6 | 28.08.2026 | BODY BANK v0.8.28.4: 400er Queue vollständig reviewer-blind durchmischt und aktuelle Testkategorie verborgen; direkte Familien-/Elternnachbarschaft vermieden und Wiederholungen weit getrennt. BANK-only Dual-Viewport mit Last-Interaction-Auswahl und unabhängigem Kamera-/AutoFit-Zustand. Erwachsenenanzeige hart auf <=205 cm Rest-Mesh-Statur begrenzt. Schnellgrund standardmäßig leer. Kopfgröße/Head-Fat nach Anny-Quellcodeprüfung als spätere separate Modellkorrektur dokumentiert und bewusst aus dem Audit herausgehalten. |
