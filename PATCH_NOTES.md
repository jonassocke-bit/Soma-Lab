SAMMY v0.8.24.14 PATCH
MORPH OBSERVATORY v1.3 · ATLAS v2.6 SECTION DEBUG

Basis
- v0.8.24.13 (working boot baseline)

Geänderte Dateien
- app.js
- index.html
- morph-sections-v2.1.js

Wichtig: Der normale App-Bootstrap wurde NICHT umgebaut.
Außer Versionsnummer/Cache-Key liegen die funktionalen Änderungen ausschließlich im MORF/Atlas-Pfad bzw. im weiterhin lazy geladenen Section-Modul.

Atlas v2.6
- erzwingt für jede MIN/REFERENZ/MAX-Aufnahme die feste Measurement-T-Pose
- behält Rest-Mesh Rot/Blau aus Atlas v2.5
- behält SOMA-Skelett-Inset rechts unten
- zeichnet die echten Profile-Sections des v2.1-Geometrie-Engines direkt ins Atlasbild:
  - 25 % = Cyan
  - 50 % = Gelb
  - 75 % = Violett
  - taxonomy topSection = dickere Linie
- zeigt bei genau einem erwarteten Limb-Segment zusätzlich den aktuellen kanonischen ANSUR-Umfang als weiße gestrichelte Linie:
  - upperarm -> upperarm_circumference
  - lowerarm -> forearm_circumference
  - upperleg -> thigh_circumference
  - lowerleg -> calf_circumference
- pro Kachel werden topSection A/B/Umfang sowie der ANSUR-Umfang als Zahlen ausgegeben
- Bulk Atlas ZIP wurde auf Schema/Filename v2.6 angehoben und enthält Section-/ANSUR-Debugdaten im manifest.json

Profile Section API
- gleiche v2.1-Messlogik wie im erfolgreichen v0.8.24.13 Quick
- zusätzlich computeSectionGeometry() für den Atlas
- die Section-Geometrie wird NICHT in FULL-JSON aufgebläht; sie wird nur beim Atlasexport on demand berechnet

Kompatibilität
- abgeschlossene MORF-Runs aus v0.8.24.13 werden in v0.8.24.14 weiter geladen
- deshalb ist KEIN neuer Quick-Lauf nötig, um Atlas v2.6 zu prüfen
- das Section-Modul bleibt lazy: es wird erst bei MORF/Atlas benötigt und kann den normalen Sammy-Start nicht blockieren

Prüfungen vor Verpackung
- node --check app.js: OK
- node --check morph-sections-v2.1.js: OK
- TypeScript ES2020 Parser: 0 Syntaxfehler in beiden JS-Dateien
- HTML IDs: 450, keine Duplikate
- Section-Geometry API mit synthetischem Mesh getestet: 25/50/75%-Kurven werden erzeugt
