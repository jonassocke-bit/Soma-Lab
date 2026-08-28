# BODY FIT DEPLOYMENT + DEFAULTS FIX 1.2 · v0.8.27.2

## Anlass
Der gemeldete Test zeigte weiterhin `Sammy · v0.8.27.0`. Damit war der Priority-Fix aus v0.8.27.1 im Browser nicht aktiv. Die unveränderten 70.4 kg waren deshalb kein Ergebnis des neuen Weight+Muscle-Masseschritts, sondern des alten v0.8.27.0-Pfads.

## Änderungen
- App-/Cache-Version auf 0.8.27.2 erhöht.
- Body-Fit-Kopf zeigt explizit `Build 0.8.27.2`, damit ein veralteter Deploy sofort sichtbar ist.
- Gewünschte Standardwerte gesetzt:
  - Größe 174 cm
  - Gewicht 88.5 kg
  - Brust 103 cm
  - Taille 86 cm
  - Hüfte/Gesäß 113 cm
- Fallbackwerte in `sammyBfInput()` identisch angepasst, nicht nur die HTML-Felder.
- Der v0.8.27.1 Priority-Fix bleibt vollständig enthalten: Größe → Masse über Weight+Muscle-Probes → Taille/Hüfte → erneute Massenrückkopplung → Taille/Hüfte Recovery → Frauenbrust separat.

## Testregel
Vor einem neuen Lauf müssen oben links `Sammy · v0.8.27.2` und im Body-Fit-Intro `Build 0.8.27.2` sichtbar sein. Wenn dort 0.8.27.0/0.8.27.1 steht, wurde nicht der neue Build ausgeführt.
