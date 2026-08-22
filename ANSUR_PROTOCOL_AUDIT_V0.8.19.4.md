# SAMMY ANSUR PROTOCOL AUDIT · v0.8.19.4

## Scope
UI-/Visualisierungs-Patch auf Basis v0.8.19.3. Keine Änderung der ANSUR-Messdefinitionen oder der strikten Körperregion-Masks.

## Änderungen
- PROT-Header: Prev / Next / Info-Hold / Korrekt / Inkorrekt horizontal; kein Close-X.
- Bottom-Toggles in den scrollbar Inhalt verschoben.
- Audit- und Diagnostics-Export am Ende des Scrollbereichs.
- Measure-Overlay statuskodiert: grün/rot; ungeprüft neutral, aktive ungeprüfte Messung gelb.
- Linienbreite über TubeGeometry statt WebGL `linewidth`, damit iPhone/Safari die Breite tatsächlich darstellt.
- aktive Messung ca. 1.8x dicker als übrige Messlinien.

## Sicherheitsregeln unverändert
- PROT verwendet weiterhin MEAS-Messgeometrie.
- Strikte Region-Masks bleiben aktiv.
- Kein Whole-Body-Fallback bei fehlender Region-Mask.
- Links/rechts getrennte Körperregionen bleiben unverändert.
