# Sammy v0.8.28.4 — BODY BANK Blind Mix + Dual Viewport

## Audit-Objektivität

- Die 400 Phase-2-Fälle werden vollständig blind durchmischt.
- Aktueller Testtyp, Familie, Variantenrichtung, Elternanker und Wiederholungsstatus sind in der UI verborgen.
- Direkte Familien-/Elternnachbarschaft wird vermieden; verdeckte Wiederholungen liegen mit großem Abstand zum Original.
- Der optionale Schnellgrund ist standardmäßig leer statt `Beine zu lang`.

## BANK-only Dual Viewport

- Zwei gleichzeitig sichtbare Viewports A/B auf demselben WebGL-Canvas.
- Kamera A und B besitzen unabhängigen Zoom, Orbit, Pan und Zielpunkt.
- Letzte Interaktion wählt automatisch den aktiven Viewport.
- Vorne / ¾ / Seite / Hinten / AutoFit wirken nur auf den aktiven Viewport.
- Pose/Animation bleibt synchron in beiden Ansichten.
- Der Dual-Viewport existiert ausschließlich in `LAB → BANK`; die restliche App behält den bisherigen Einzelviewport.

## AutoFit

- Pro Viewport separat schaltbar.
- `AN`: Personenwechsel hält die sichtbare Körpergröße ungefähr konstant und bewahrt die Blickrichtung.
- `AUS`: Kamera bleibt beim Personenwechsel exakt stehen.

## Statur-Sampling

- Erwachsene über 205 cm werden nicht angezeigt.
- Planseitige konservative Vorbegrenzung plus harter Runtime-Check der exakten Rest-Mesh-Statur vor Sichtbarkeit.
- Die 205-cm-Regel ist nur eine Samplinggrenze für diesen Audit, keine globale anthropometrische Körpergrenze.

## Kopfmodell

Kopfgröße/Head-Fat wird nicht in diesen Audit aufgenommen. Die Anny-Quellcodeprüfung wurde im Master State als spätere separate Modellkorrektur dokumentiert.
