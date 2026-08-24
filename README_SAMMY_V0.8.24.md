# Sammy v0.8.24.0 — Solver24 Calibration + Proportion + Stability

## Was dieses Update ändert

Der Pass bleibt als **später Override hinter v0.8.23 MASS + ANSUR24-PROT-v2** und verändert keine Zielmaße stillschweigend.

- hält vorhandene semantische Arm-/Unterarm-DOFs bei großen Residuen im lokalen Jacobian,
- priorisiert Körperhöhe und vertikale Beinsegmentierung kontrolliert,
- schützt eine bereits gut getroffene Körperhöhe vor späteren Umfangs-Pässen,
- prüft die Arm-Proportion relativ zum **eigenen Zielkörper** (kein Population-Normalisieren),
- erkennt unteraktuierten Messzeilen und dämpft sie statt andere Körperteile zu verbiegen,
- gewichtet die noch provisorische `chest_breadth` bewusst schwächer, statt einen unvalidierten Korrekturoffset einzubauen,
- führt bei praktisch festgefahrenen Seeds einen begrenzten Rescue-Pass aus,
- exportiert einen Bias-/Sättigungs-/Under-actuation-Report,
- berichtet getrennt `bestFit` und `bestObjective`, wenn Masse/Plausibilität und reine Messgüte verschiedene Seeds bevorzugen.

## Anwenden

Entpacke die Dateien in einen beliebigen Ordner. Im lokalen Checkout von `jonassocke-bit/Soma-Lab`:

```bash
python /pfad/zum/apply_sammy_v0824.py
node --check app.js
```

Das Script erwartet exakt den aktuellen v0.8.23.0-Basisstand, verweigert eine Doppelanwendung und ändert nur:

- `app.js`: Runtime-Version, drei Cache-Keys und der neue Late-Override am Dateiende,
- `index.html`: sichtbare/cache-relevante Versionsmarker,
- `BUILD_MANIFEST_V0.8.24.0.json`: neues Build-Manifest.

## Danach testen

1. App neu laden und Version `0.8.24.0` kontrollieren.
2. **SOLV → Stress · ANSUR real**: 8 Ziele × 2 Seeds.
3. FULL JSON exportieren.
4. **AUDT** blind bewerten und Audit JSON exportieren.
5. Besonders vergleichen: `forearm_circumference`, `stature`, `crotch_height`, `chest_breadth`, `neck_circumference`, Seed-Stalls und `measurementCalibrationAudit`.

## Wichtig

Es wurde absichtlich **kein neuer, nicht existierender Forearm-Morph erfunden**. Der Pass verwendet die im aktuellen Prior real vorhandenen Lowerarm-Fat/Muscle/Scale-DOFs. Wenn der neue Under-actuation-Report weiterhin zeigt, dass damit der ANSUR-Forearm nicht erreichbar ist, ist der nächste saubere Schritt ein neuer geometrischer Morph/Influence-Kalibrierungslauf — nicht ein noch stärkeres Solver-Gewicht.
