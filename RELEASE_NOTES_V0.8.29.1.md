# RELEASE NOTES · Sammy v0.8.29.1

## BODY BANK SOLVER Search Hotfix + Active Merge

- Fehlenden `sammyBbsSearchRun()`-Handler ergänzt; `1 · Bank suchen` ist wieder ausführbar.
- BODY-BANK-SOLVER-UI prüft Handler jetzt fail-fast beim Initialisieren.
- Release-Gate prüft alle BODY-BANK-SOLVER-Handler vor dem Packen.
- Zurückgegebenen 32er ACTIVE-Audit kanonisch in `body-bank-index-v1.json` übernommen.
- Index jetzt: 397 Nodes / 269 trusted / 91 frontier / 37 negative / 0 unchecked.
- Canonical/local Learning-Nodes werden nach stabilem Shape dedupliziert.
- Frische ACTIVE-Sitzungen filtern bereits kanonisch bekannte Seed-Shapes aus.
- Technischer Measurement-Sanity-Gate für katastrophale Statur/Brust/Taille/Hüfte-Snapshots.
- Blind-Proof Schema v1.1 ersetzt ungültige Holdouts deterministisch und exportiert `skippedTargets`.
- Master State auf 0.9 / App v0.8.29.1 aktualisiert.

## Interpretation des ersten Proofs

Der v0.8.29.0-Proof war auf dem gemeinsamen internen Score deutlich positiv: 1.15446 → 0.20260 → 0.20129 Median. Er ist damit ein positives Architektur-Signal, aber keine Freigabe der Brust-/Hüftmessung. Ein Holdout lieferte einen klar falschen Brustumfang von 39.61 cm. Diese Messqualität wird separat weiter geprüft.
