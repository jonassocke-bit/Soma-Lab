# BODY BANK SOLVER · Hotfix + Active Merge · v0.8.29.1

## Zweck

v0.8.29.1 repariert den fehlenden manuellen Retrieval-Handler aus v0.8.29.0, übernimmt den zurückgegebenen 32er ACTIVE-Audit in den kanonischen Body-Bank-Index und trennt den positiven Architektur-Proof ausdrücklich von der weiterhin offenen Messqualifikation für Brust/Hüfte.

## Runtime-Fix

`#sammyBbsSearch` referenzierte in v0.8.29.0 `sammyBbsSearchRun()`, die Funktion war im gebauten `app.js` versehentlich nicht enthalten. Safari warf deshalb beim Klick einen `ReferenceError`.

v0.8.29.1 enthält den Handler vollständig:

- Input lesen und Ausgangskörper sichern.
- Trusted-Seed-Retrieval starten.
- Shortlist real am Mesh vermessen.
- Top-5 rendern.
- Export und Local Fit freischalten.
- Fehler sauber in den bestehenden Diagnostics-Pfad schreiben.

Zusätzlich prüft `sammyBbsInitUI()` alle sechs BODY-BANK-SOLVER-Handler fail-fast. Der Release-Gate prüft dieselben Symbole statisch.

## ACTIVE-Audit kanonisch übernommen

Zurückgegebener ACTIVE-Export:

- 23 accepted
- 8 uncertain
- 1 rejected
- 0 unchecked

Kanonischer Index nach Merge:

- 397 Nodes
- 269 trusted
- 91 frontier
- 37 negative
- 0 unchecked

15 zuvor offene Phase-2-Nodes werden in-place klassifiziert. 17 Boundary-Midpoints werden als neue Nodes ergänzt. Bereits lokal im Browser vorhandene Learning-Nodes werden nach stabilem Shape gegen den kanonischen Index dedupliziert.

## Proof-Ergebnis und Mess-Sanity

Der erste v0.8.29.0-Proof ergab:

- Neutral median 1.15446
- Retrieval median 0.20260
- Local Fit median 0.20129
- Retrieval besser 6/8
- Local Fit nicht schlechter 8/8
- Local Fit tatsächlich verbessert 3/8

Das unterstützt die Body-Bank-Architektur deutlich. Gleichzeitig enthielt ein Holdout einen offensichtlich falschen Brustumfang von 39.61 cm. Deshalb ist der Architekturpfad vorläufig `GO`, die Brust-/Hüft-Messqualifikation aber nicht freigegeben.

v0.8.29.1 ergänzt einen breiten technischen Sanity-Gate für Statur/Brust/Taille/Hüfte. Er dient nur dazu, katastrophale Mess-Snapshots aus Retrieval/Proof zu halten. Er ist kein anthropometrischer Plausibilitätsfilter und repariert keine Messdefinition.

Proof v1.1 ersetzt technisch ungültige Holdouts deterministisch durch gleichgeschlechtliche Alternativen und exportiert verworfene Ziele als `skippedTargets`.
