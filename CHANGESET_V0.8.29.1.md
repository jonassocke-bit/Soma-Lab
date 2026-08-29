# CHANGESET v0.8.29.1

## Geändert

- `app.js`
  - `sammyBbsSearchRun()` implementiert.
  - Handler fail-fast gate.
  - Canonical/local Shape-Deduplizierung.
  - technischer Measurement-Sanity-Gate.
  - Retrieval verwirft katastrophale Mess-Snapshots.
  - Proof v1.1 mit Ersatz ungültiger Holdouts und `skippedTargets`.
  - ACTIVE fresh-session filtering gegen kanonischen Index.
- `body-bank-index-v1.json`
  - 32er ACTIVE-Audit kanonisch eingearbeitet.
  - 397 Nodes: 269 trusted / 91 frontier / 37 negative / 0 unchecked.
- `body-bank-active-audit-seed-v1.json`
  - App target v0.8.29.1; bereits kanonische Seed-Shapes werden bei frischen Sessions gefiltert.
- `index.html`, `style.css`
  - Versions-/Cachetags auf v0.8.29.1.
- `SAMMY_MASTER_STATE.md/.docx`
  - Proof-Ergebnis, Mess-Caveat, Hotfix und Active-Merge als kanonischer Stand.
- Proof-/ACTIVE-Export als Release-Evidence aufgenommen.
