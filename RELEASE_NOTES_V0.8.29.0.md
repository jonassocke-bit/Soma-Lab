# RELEASE NOTES · Sammy v0.8.29.0
## BODY BANK SOLVER ARCHITECTURE 1.0 + ACTIVE AUDIT 1.0

### Neu

- Erster Body-Bank-Solver-POC im bestehenden `SOLV`-Panel.
- `body-bank-index-v1.json` aus dem v0.8.28.5 Phase-2-Audit: 246 trusted / 83 frontier / 36 negative / 15 unchecked.
- Trusted-only Top-K Retrieval mit echter Shortlist-Rekonstruktion und Meshmessung.
- Kleiner regional begrenzter Local Fit für Höhe, Brust, Taille und Hüfte/Gesäß.
- Globaler Non-Worsening-Rollback: ein insgesamt schlechterer Local Fit wird vollständig auf den auditierten Seed zurückgesetzt.
- 8er Blind-Proof mit acht held-out trusted Körpern; Gewicht wird weder gescored noch für die Proof-Vorauswahl benutzt.
- Proof nutzt den tatsächlichen Alterskontext des versteckten Zielkörpers.
- BANK erhält `ACTIVE` zusätzlich zu `PHASE 2`.
- 32 initiale Active-Audit-Fälle plus solvergenerierte Local-Fits/Ambiguitäten.
- Active-Votes aktualisieren sofort einen transparenten lokalen Learning-Store; akzeptierte Active-Körper werden zusätzliche Seeds.
- Resume-Fix springt bei alten offenen Fällen auf den ersten `unchecked`-Eintrag.

### Sicherheitsregeln

- `negative` bleibt lokales Negativwissen, kein globales Morph-/Sliderverbot.
- Weight/Muscle werden in Solver 1.0 nicht frei nachoptimiert.
- Keine Cross-Region-Rettung.
- Ein verändertes Rezept ist nie automatisch `audited`; nur exakte trusted/trusted-user-Rezepte sind auditierte Seeds.
- Known-bad `shoulderJointBreadth` ist aus Retrieval und Gates ausgeschlossen.
- Kopfgröße/Head-Fat bleibt vertagt.

### Unverändert

- BANK Dual Viewport, unabhängige Kameras, Last-Interaction-Auswahl und AutoFit.
- 205-cm-Audit-/Produktbereich.
- bestehender Phase-2-Audit.
- Legacy Body Fit v1.2 und historische Solver-Labs als Vergleich/Forschungsarchiv.
