# BODY BANK SOLVER 1.2 · TRUST REGION + ACTIVE MERGE + COVERAGE PREP · v0.8.29.5

## Ausgangslage

Der 24er Family-/Near-Neighbor-Holdout aus v0.8.29.4 blieb klar positiv: Neutral-Median 0.87234, Retrieval 0.390525, Single-Seed 0.31155, Top-3 0.26887. Top-3 verbesserte den Single-Seed-Pfad in 9/24 Fällen zusätzlich; die Gewinner kamen 15x aus Rang 1, 3x aus Rang 2 und 6x aus Rang 3. 22/24 Top-3-Endzustände schlugen den neutralen Start.

Der anschließende 61er ACTIVE-Audit enthält 49 accepted, 11 uncertain und 1 rejected. 29 Körperformen waren gegenüber dem bisherigen kanonischen Index neu; davon wurden 26 akzeptiert und 3 als unsicher bewertet.

## 1. Kanonischer ACTIVE-Merge

`body-bank-index-v1.json` enthält jetzt 426 eindeutige Nodes:

- 295 trusted
- 94 frontier
- 37 negative
- 0 unchecked

Der exakte Human-Vote bleibt lokal. Accepted Solver-Endpunkte werden als Trusted Nodes geführt, zertifizieren aber keine Interpolationskante. Solver-Kantenhinweise bleiben ausdrücklich `edge-unaudited`.

Stale LocalStorage-Learning-/Pending-Einträge, deren exakte Form bereits im neuen kanonischen Index enthalten ist und deren Vote nicht neuer als der Index ist, werden beim Laden bereinigt. Spätere lokale Votes bleiben als lokales Overlay erhalten.

## 2. Trust-Region Local Fit

Brust/Taille/Hüfte verwenden keine Ableitungsextrapolation mehr.

Pro Iteration:

1. ±epsilon tatsächlich am Mesh messen.
2. Bei Vorzeichenwechsel oder wenn beide kleinen Schritte nicht helfen: kontrolliert ±2epsilon messen, soweit die unveränderten Local-Bounds dies erlauben.
3. Nur einen tatsächlich gemessenen Zustand mit kleinerem Zielabstand akzeptieren.
4. Sonst Rollback auf den Zustand vor diesem Controller-Schritt.
5. Finaler Measurement-Sanity-/Geometry-Gate bleibt aktiv.

Die kanonische Höhe bleibt separat eng begrenzt und bidirektional vermessen. Keine neuen DOFs, keine größeren Bounds, kein Cross-Region-Rescue.

## 3. Top-3 bleibt Standard

Retrieval zeigt Top-5; die ersten drei technisch gültigen Trusted-Seeds werden unabhängig lokal gefittet. Der beste sichere finale Geometry-Score gewinnt. Veränderte Gewinner werden blind an BANK → ACTIVE übergeben.

## 4. Coverage Prep

`body-bank-coverage-prep-v1.json` bereitet die nächste Abdeckungsphase vor. Es enthält die 295 Trusted-Nodes als Runtime-Scan-Queue, Staturband-Verteilung und bekannte Lückenanker.

Wichtig: Brust/Taille/Hüfte werden nicht aus Core-Parametern geschätzt. Coverage-Zellen dürfen erst nach exakter Runtime-Rest-Mesh-Messung und technischem Sanity-Gate vergeben werden.

## 5. 36er Coverage-Stress

Der frühere Proof-Button ist jetzt ein Coverage-/Regressionstest, kein neuer Architekturbeweis. 36 geschlechtsbalancierte Targets werden weiterhin mit Zielkörper-, Family- und Near-Neighbor-Holdout geprüft.

Exportiert werden zusätzlich:

- Staturband pro Fall,
- Gewinner-Rang #1/#2/#3,
- relative Coverage-Gaps (Top-3 schlägt Neutral nicht),
- Aggregation pro Geschlecht × Staturband,
- priorisierte Gap-Targets für den nächsten Audit-/Coverage-Schritt.

