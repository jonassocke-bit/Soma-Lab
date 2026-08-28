# BODY FIT MINIMAL · Prototype 1.0 — v0.8.27.0

## Zweck

v0.8.27.0 beginnt einen neuen Produktionspfad für den Avatar-Aufbau. Der bisherige Solver-V2/ANSUR24-Zweig bleibt als Forschungsarchiv erhalten, ist aber nicht mehr der Produktionspfad.

## Eingabe

Die vereinbarte 5-Maße-Maske bleibt erhalten:

- Körpergröße
- Gewicht
- Brustumfang
- Taillenumfang
- Gesäß-/Hüftumfang

Geschlecht und Alter sind Kontext. Bei Frauen kommt zusätzlich ein Cup-Control `Auto / A–H` hinzu.

## Statistik vs. Geometrie

ANSUR II wird nur noch statistisch verwendet. Aus dem `train+validation`-Datensatz werden per sex-spezifischem kNN64 wenige robuste Guide-Werte geschätzt:

- Biacromial-/Schulterrahmen
- Schritthöhe
- Taillenbreite
- Hüftbreite

Diese Werte sind Priors/Guides und keine 24-Maß-Zielvektoren. Held-out Test/Final Reserve werden nicht verwendet.

## Automatischer Fit

Der Fit ist absichtlich klein:

1. neutraler Anny-Grundkörper + Gender/Alter
2. statistischer Proportions-Prior
3. Körperhöhe direkt über `core:height`
4. Schritthöhe weich über `measure-upperleg-height-incr`
5. Schulterrahmen weich über `measure-shoulder-dist-incr`
6. Gewicht über geschlossenes Meshvolumen + Dichteproxy, primär `core:weight`
7. Taille/Hüfte nur mit großzügigem Deadband und jeweils direktem lokalen Morph
8. Männerbrust nur sehr weich; keine Breadth/Depth-Zwangsoptimierung
9. Frauenbrust als eigener Block
10. ein kleiner Gewichts-Recheck nach regionalen Änderungen

Keine Cross-Region-Rettung, keine 24-Maß-Hierarchie, keine ±115/130-%-Auto-Extrapolation.

## Gewicht ↔ Volumen

Das Eingabegewicht bleibt getrennt von der laufenden Avatar-Schätzung. Die Schätzung nutzt das aktuelle geschlossene Low-LOD-Meshvolumen und den vorhandenen Composition/Density-Proxy. Nach manuellen Änderungen wird die Schätzung aktualisiert, der Körper aber nicht zwanghaft zurückoptimiert.

## Frauenbrust

Rippenkorb und Brust werden getrennt behandelt. Cup A–H verwendet vorläufig EU/DE-artige 2-cm-Schritte der Brust-minus-Unterbrust-Differenz. `Auto` wählt aus Eingabe-Brustumfang und aktuellem Unterbrustbereich eine Stufe und passt nur `core:cupsize` an.

Zusätzlich wird ein volumetrischer Cup-Morph-Proxy exportiert: Differenz des geschlossenen Meshvolumens zwischen aktuellem Cup und demselben Körper mit `core:cupsize=0`, geteilt auf beide Brüste. Das ist ein Avatar-/Morph-Volumenproxy und ausdrücklich keine klinische Brustvolumenmessung oder BH-Fitting-Angabe.

## Manuelle Makroregler

Nach dem Auto-Fit stehen bewusst einfache Controls bereit:

- Fülle
- Muskulatur
- Bauchprojektion (`stomach-pregnant-incr` neutral umbenannt)
- Gesäß
- Oberschenkel
- Oberarme
- Frauen-Cup A–H / Auto

## Anti-Grotesk-Regel

Automatische Korrekturen sind regional, klein und besitzen große Deadbands. Ein natürlicher Anny-Körper mit einigen Zentimetern Restabweichung ist ausdrücklich besser als ein numerisch genauer, aber unplausibler Körper.
