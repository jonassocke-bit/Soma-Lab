# Release Notes · Sammy v0.8.28.1

## GitHub Pages Hotfix
- Keine Änderung an Body-Bank-Sampling, Audit-Logik oder Solver-/Messwissenschaft.
- `index.html` lädt `app.js` und `style.css` jetzt mit `?v=0.8.28.1` statt versehentlich weiter mit `?v=0.8.27.2`.
- Titel, Splash, globale Versionsanzeige und `SAMMY_APP_VERSION` sind auf 0.8.28.1 synchronisiert.
- `.nojekyll` wird für GitHub Pages mit ausgeliefert.
- Neuer Deployment-Gate prüft Versionsgleichheit zwischen HTML, JS und Cache-Busting-URLs.
