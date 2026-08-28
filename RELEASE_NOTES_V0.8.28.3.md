# Sammy v0.8.28.3 — BODY BANK Phase 2 · Boundary / Extreme Audit

## Ziel

Der abgeschlossene v0.8.28.2-Human-Audit wird nicht verworfen, sondern direkt als Seed für einen gezielten zweiten Audit genutzt. Der Nutzer meldete, dass alle unsicheren Phase-1-Körper ausschließlich wegen extrem lang wirkender Beine unsicher waren. Phase 2 prüft diese Grenze lokal um akzeptierte Körperfamilien und erweitert gleichzeitig den Test deutlich in den Extremraum.

## Phase-2-Plan

- 380 eindeutige Zielkörper + 20 verdeckte Wiederholungen = 400 Bewertungen.
- 160 Proportionsfamilien-Fälle: 40 diverse HUMAN_ACCEPTED-Phase-1-Anker × vier nahe Proportionsvarianten.
- 160 absichtliche Extremraum-Fälle: 20 akzeptierte Anker × acht Core-Randmuster.
- 60 breite deterministische Randstichproben.
- Keine exakten Rezept-Duplikate unter den 380 Zielkörpern.

## Neue Diagnosebasis

Die in Phase 1 gespeicherten einfachen Umfangs-/Schulterproxy-Snapshots werden nicht weiter für Body-Bank-Entscheidungen benutzt. Phase 2 exportiert stattdessen pose-unabhängige Kennzahlen aus dem exakten shape-abhängigen Anny/SOMA-Rest-Rig plus Rest-Mesh-BBox: Körperhöhe, Hüftgelenkhöhe, Beinsegmentkette, Femur/Tibia, Torso-Kette sowie Schulter-/Hüftgelenkbreite als absolute Werte und Verhältnisse.

Diese Kennzahlen sind zunächst Diagnosevariablen. Es wird daraus weder ein globaler `proportions`-Grenzwert noch ein anthropometrischer Hard-Gate abgeleitet.

## UI

- Bewährte schnelle ✓ / ? / ×-Bewertung bleibt unverändert.
- Zoom/Orbit bleiben über Personenwechsel stabil; nur Viewport-Schaltflächen reframen.
- Posen, Loops und importierte Animationen bleiben verfügbar.
- Neuer optionaler persistenter Schnellgrund für ? / ×; Startwert `Beine zu lang`, außerdem Beine zu kurz, Torso/Proportion, Masse/Breite, Sonstiges oder kein Grund.
- Testtyp/Familienfortschritt wird knapp angezeigt, Morphwerte bleiben verborgen.

## Datenartefakte

- `body-bank-phase1-audit-seed-v1.json` — konsolidierter Phase-1-Seed mit 95 eindeutigen Körpern und Nutzerannotation.
- `body-bank-phase2-plan-v1.json` — vollständiger reproduzierbarer 400er Prüfplan.

## Unverändert

- Kein Runtime-Body-Lookup.
- Kein lokaler Family-Fitter.
- Kein freier From-Scratch-Solver als neuer Produktpfad.
- Legacy-Solver-/ANSUR-Labs bleiben als Research-Archiv erhalten.
