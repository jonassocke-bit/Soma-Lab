# Release Notes · Sammy v0.8.29.2

## GitHub Visible-Version / Cache Hotfix

Dieser Hotfix behebt ausschließlich einen inkonsistenten Versionsmarker im Splash von v0.8.29.1. Dort stand noch `v0.8.28.4`, obwohl der eigentliche Build bereits neuer war.

Zusätzlich erzwingt ein neuer statischer Deployment-Gate die Übereinstimmung von Runtime-Version, HTML-Titel, Hauptversionslabel, Splash-Version sowie JS-/CSS-Cache-Tags.

Die Solver-/Body-Bank-Funktionalität ist gegenüber v0.8.29.1 unverändert.
