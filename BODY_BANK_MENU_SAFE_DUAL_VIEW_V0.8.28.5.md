# BODY BANK · Menu-safe Dual View · v0.8.28.5

Ziel: Beide unabhängigen Audit-Viewports müssen gleichzeitig sichtbar sein, ohne den für das Bewertungsmenü reservierten Bildschirmbereich zu verbrauchen.

## Layoutregel

- Mobile/Bottom-Sheet: Der freie Bereich oberhalb des offenen BODY-BANK-Panels ist der Viewer. Dieser Bereich wird 50/50 in A und B geteilt.
- Desktop/Seitenpanel: Der Bereich links neben dem offenen BODY-BANK-Panel ist der Viewer und wird 50/50 geteilt.
- Die Grenze wird aus der aktuellen Panel-Geometrie berechnet und folgt deshalb auch dem manuellen Resize-Griff.

## Interaktion

- A/B bleiben echte getrennte OrbitControls.
- Letzte Pointer-/Touch-/Wheel-Interaktion bestimmt den aktiven Viewport.
- UI-Viewbuttons und AutoFit gelten nur für den aktiven Viewport.
- AutoFit arbeitet mit dem tatsächlichen Seitenverhältnis des jeweiligen halben Viewer-Bereichs.

Diese Regel ist ausschließlich im BANK-Audit aktiv.
