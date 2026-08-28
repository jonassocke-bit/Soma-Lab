# BODY BANK AUDIT · VIEW / MOTION · v0.8.28.2

## Ziel
Der visuelle Plausibilitäts-Audit soll einen Körper nicht nur in einer starren T-Pose prüfen. Gleichzeitig darf die Bedienung die Vergleichbarkeit nicht zerstören: ein vom Auditor eingestellter Zoom/Orbit muss über Personenwechsel hinweg exakt erhalten bleiben.

## Kameraregel
- Beim **ersten Öffnen** von BODY BANK wird einmal auf die gespeicherte Standardansicht eingerahmt.
- Danach bleiben manueller **Zoom und Orbit** bei Personwechsel, Vote, Zurück/Weiter sowie Pose-/Animationswechsel bestehen.
- Nur ein expliziter Wechsel von **Vorne / ¾ / Seite / Hinten** setzt eine neue definierte Kameraansicht und rahmt neu ein.
- Die gewählte View-ID wird in der Audit-Sitzung gespeichert.

## Posen und Bewegung
Statisch:
- T-Pose
- Stehen
- Kniebeuge
- Laufpose
- Action-Pose

Eingebaute Loops:
- Gang-Loop
- Rig-Stress

Import:
- `.fbx`
- `.npy`
- `.npz`

Für abspielbare Bewegungen stehen Play/Pause und 0.50×, 0.75×, 1.00×, 1.25× und 1.50× zur Verfügung.

## Wissenschaftliche Trennung
Die visuelle Pose ist **Review-Kontext**, nicht Teil der Körperidentität. Die beim Vote versteckt gespeicherten Grundmaße werden deshalb über `measureCurrentRestShape()` aus der pose-unabhängigen Rest-Shape erzeugt. So kann z. B. eine Kniebeuge oder ein Gangframe die numerische Audit-Snapshot-Basis nicht verändern.

## Auditexport
Jede bewertete Case-Zeile kann zusätzlich speichern:
- aktive View-ID,
- Pose-/Motion-ID und lesbaren Namen,
- läuft/pausiert,
- Animationstempo,
- bei Imports: Animation-ID, Name, Quelle und aktueller Frame,
- Kameradistanz, Zoom und FOV.

Bewertungen bleiben weiterhin lokal an exakten Körper/Körperfamilien gebunden; diese Erweiterung erzeugt keine globalen Morph-Grenzen.
