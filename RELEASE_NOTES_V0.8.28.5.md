# Sammy v0.8.28.5 — BODY BANK Menu-safe Dual Viewport

## Mobile Audit-Layout

- Im BANK-Modus belegen die beiden Viewports nicht mehr den gesamten Bildschirm hinter dem Bottom-Sheet.
- Auf iPhone/Portrait wird der freie Bereich oberhalb des BODY-BANK-Menüs mittig in A und B geteilt.
- Das Menü behält damit seinen eigenen unteren Bildschirmbereich und verdeckt Viewport B nicht mehr.
- Die verfügbare Viewer-Höhe folgt auch einer manuell geänderten Panelhöhe automatisch.

## Desktop

- Bei der Desktop-Seitenpanel-Anordnung teilen A/B den freien Bereich links neben dem BODY-BANK-Panel.

## Unverändert

- Letzte Interaktion wählt den aktiven Viewport.
- Kamera, Zoom, Orbit, Pan, Blickrichtung und AutoFit bleiben pro Viewport unabhängig.
- Pose/Animation bleibt zwischen A und B synchron.
- Änderung gilt ausschließlich für LAB → BANK.
