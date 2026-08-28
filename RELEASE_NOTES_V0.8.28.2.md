# Release Notes · Sammy v0.8.28.2

## BODY BANK Audit · View / Motion

v0.8.28.2 erweitert ausschließlich den BODY-BANK-Audit-Pfad und lässt die vorhandenen Mess-/Solver-/Research-Labs bestehen.

- **Persistente Audit-Kamera:** manueller Zoom und Orbit bleiben beim Wechsel des Körpers, beim Voting sowie bei Pose-/Animationswechseln unverändert. Nur ein expliziter Klick auf **Vorne / ¾ / Seite / Hinten** darf neu einrahmen.
- **Statische Posen:** T-Pose, Stehen, Kniebeuge, Laufpose und Action-Pose können direkt im BANK-Audit gewählt werden.
- **Bewegungsprüfung:** Gang-Loop und Rig-Stress stehen als eingebaute Loops zur Verfügung; Play/Pause und 0.50×–1.50× Tempo sind direkt im Audit steuerbar.
- **Eigene Animationen:** vorhandene Motion-Import-Funktion wird direkt im BANK-Audit zugänglich; `.fbx`, `.npy` und `.npz` können importiert und abgespielt werden.
- **Auditdaten bleiben körperbezogen:** Pose/Animation ändern nicht die Body-ID und erzeugen keine neue Körperfamilie.
- **Pose-unabhängige numerische Snapshot-Basis:** beim Vote werden die internen Grundmaße aus der Rest-Shape gemessen, nicht aus dem aktuell animierten Frame. Bewegung kann dadurch die versteckten Audit-Messwerte nicht verfälschen.
- **Review-Kontext:** Export speichert zusätzlich Ansicht, Pose/Animation, Lauf-/Pausezustand, Tempo und Kamerazustand der Bewertung.

Die 95 einzigartigen Anny-Core-Basiskörper + 5 verdeckten Wiederholungen und die lokalen/contextual Auditregeln aus v0.8.28.0 bleiben unverändert.
