# Audited Body Bank PoC · v0.8.28.0

## Ziel
Der neue BANK-Pfad testet einen Architekturwechsel: globale Körperform wird nicht mehr live from-scratch durch den Solver erfunden, sondern aus einem vorbereiteten/auditierten Anny-Körperraum gewählt. Ein späterer lokaler Fitter darf nur kleine Korrekturen innerhalb bekannter Körperfamilien durchführen.

## Phase 1
- 95 eindeutige Anny-Basiskörper
- 5 verdeckte Wiederholungen zur Konsistenzmessung
- exakt 100 menschliche Bewertungen
- nur Anny-Core-Parameter: Gender, Adult-Age, Height, Weight, Muscle, Proportions, bei Frauen zusätzlich Cupsize/Firmness
- keine lokalen Spezialmorphs
- keine Solver-Rekonstruktionen
- sechs bestehende kanonische Referenzkörper aus `solver24-prior-v1.json` dienen nur als Zentren; deterministische Halton-Jitter erzeugen Vielfalt

## Audit-UI
Der Nutzer sieht nur den Körper. Sichtbar sind:
- Fortschritt
- Vorne / 3/4 / Seite / Hinten
- Plausibel / Unsicher / Unplausibel
- Zurück / Weiter

Es gibt absichtlich keine Kommentar- oder Fehlerbeschreibungspflicht. Nach einer Bewertung springt BANK automatisch zum nächsten Körper.

## Kontextabhängigkeit
Jeder Körper besitzt `bodyId`, vollständiges Anny-Rezept und `familyId`. `familyId` wird aus groben Bins von Height/Weight/Muscle/Proportions und bei Frauen Cupsize gebildet.

Ein `rejected` bedeutet ausschließlich:
> Dieser konkrete Körper ist in diesem lokalen Familienkontext ein negativer Referenzpunkt.

Es bedeutet ausdrücklich **nicht**:
> Der betreffende Sliderwert oder Morph ist global unzulässig.

## Audit-Export
`Audit JSON` enthält pro Fall:
- Case-/Body-/Family-ID
- Repeat-Beziehung
- Bewertung
- Bewertungszeitpunkt
- vollständiges Core-Rezept
- versteckte Mess-Snapshots der stabilen Basismaße
- einfachen automatischen Basischeck
- Erzeugungsmetadaten

Zusätzlich enthält der Export eine Zusammenfassung inklusive Übereinstimmung der verdeckten Wiederholungen.

## Nächster Gate
Erst nach Auswertung des 100er Audits wird entschieden:
1. Ist der reine Anny-Core-Raum ausreichend plausibel?
2. Welche akzeptierten Körper werden Anker?
3. Zwischen welchen nahen Ankern dürfen kleine, kontextabhängige lokale Morph-Schritte erzeugt und erneut auditiert werden?

Der bestehende Solver- und Forschungsstand bleibt archiviert und wird nicht gelöscht.
