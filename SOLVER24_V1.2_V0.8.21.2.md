# SAMMY v0.8.21.2 — Solver24 V1.2 / Moderate Stress Audit

## Ziel
Der vorige Standard-Blindtest war deutlich plausibler, lag aber überwiegend im normalen Formbereich. V1.2 ergänzt deshalb einen gezielten **Stress-Modus**, ohne absichtlich groteske Körper zu erzeugen. Die menschliche Plausibilitätsbewertung soll weiterhin sinnvoll möglich sein.

## Stress-Batch
- 8 feste, intern anonymisierte Rand-Archetypen
- 4 männlich / 4 weiblich
- bewusst moderate Kernbereiche (typisch ca. 0.27–0.78 statt 0/1)
- nur kleine bis mittlere lokale Abweichungen
- jeder Zielkörper wird vor Verwendung durch denselben Mesh-Guard geprüft; bei Bedarf wird seine Randstärke schrittweise Richtung Referenz reduziert
- 2 deutlich verschiedene kanonische Startkörper pro Ziel
- Ergebnis: **16 Blind-Audit-Körper**

Die Archetypen decken u.a. groß/schlank, klein/kurvig, kompakt/muskulös, groß/schlank weiblich, breiter Torso, Pear-Shape, langer Torso und fuller-bust ab. Die Namen werden im Audit nicht angezeigt.

## Form-Guard V1.2
Zusätzlich zu V1.1:
- Thigh ↔ Hip width ratio
- Thigh ↔ Hip cross-section area ratio
- Thigh taper über mehrere Bein-Schnitte
- Abdomen/Torso-Mid-Area relativ zu Chest/Waist
- Chest-area bzw. Chest-depth relativ zur Schulterbreite

Die Grenzen werden weiterhin aus den sechs kanonischen Referenzkörpern abgeleitet und mit breiten Sicherheitsmargen versehen. Das ist ein **Katastrophen-/Plausibilitätsguard**, kein Populationsmodell.

## Fit-Gate
Formplausibilität und Messfit sind getrennt. Jede Seed-Lösung erhält nun:
- `fitGate.status = ok | warn | fail`
- RMSE
- maximalen absoluten 24er-Maßfehler
- separates Hard-Fail bei eindeutig unbrauchbarem Fit

Damit wird ein optisch plausibler Körper mit z.B. mehreren Zentimetern Stature-Fehler nicht mehr als numerisch gültige Rekonstruktion behandelt.

## Unverändert
- Measurement schema: `ANSUR24-PROT-v1`
- PROT/ANSUR-24-Geometrie
- Deep + Addendum als Influence-Prior
- real-mesh local Jacobian / remeasurement
- striktes Solver24 Blind Audit

## Empfohlener Test
`LAB → SOLV → Stress → Blind-Test starten → AUDT`

Es sollten exakt **16** Auditkörper erscheinen. Bewerte nur klar erkennbare Formfehler; bei Körperformen, bei denen du dir anthropometrisch nicht sicher bist, lieber nicht künstlich streng urteilen.
