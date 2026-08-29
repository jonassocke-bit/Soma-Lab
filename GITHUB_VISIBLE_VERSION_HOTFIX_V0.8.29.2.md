# GitHub Visible-Version / Cache Hotfix · v0.8.29.2

## Gefundener Fehler

`index.html` aus v0.8.29.1 enthielt gleichzeitig:

- `<title>Sammy v0.8.29.1</title>`
- `app.js?v=0.8.29.1` und `style.css?v=0.8.29.1`
- sichtbare Hauptversion `Sammy · v0.8.29.1`
- **aber im Splash weiterhin `v0.8.28.4`**.

Damit konnte ein korrekt deployter neuer Stand beim Start wie ein alter Build aussehen. Das war ein Paketfehler, kein Fehler des Nutzers.

## Fix

- Splash-Version auf `v0.8.29.2` synchronisiert.
- Runtime auf `SAMMY_APP_VERSION=0.8.29.2` angehoben.
- HTML-Titel, sichtbare Version und JS-/CSS-Cache-Tags auf `0.8.29.2` gesetzt.
- Build-Gate ergänzt: Splash, Titel, Hauptlabel, Cache-Tags und Runtime müssen exakt dieselbe Version tragen.

## Nicht verändert

- Body-Bank-Index und kanonische Auditdaten
- Solver Retrieval / Local Fit
- ACTIVE Audit
- Measurement-Sanity-Gate
- UI außerhalb der Versionsanzeige
