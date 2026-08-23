# Sammy v0.8.21.3 — Solver24 v1.3

## Anthropometric Conditional Prior v1

V1.3 ergänzt eine demografisch/anthropometrische Rückkopplung für **alle 24 eingefrorenen ANSUR24-PROT-v1-Zielmaße**. Die Messgeometrie wird nicht verändert.

Datenbasis ist `ansur-prediction-trainval-v1.json` mit öffentlichen ANSUR-II-Daten. Verwendet wird ausschließlich die Train+Validation-Partition; die bisher zurückgehaltene Test-Partition bleibt unangetastet. Männer und Frauen erhalten getrennte Modelle. Für jedes Zielmaß wird ein standardisiertes Ridge-Conditional-Modell aus **Alter + den jeweils anderen 23 Zielmaßen** berechnet. Das Ergebnis ist pro Maß ein bedingter Erwartungswert, eine bedingte Standardabweichung und ein z-Score.

Wichtig: Ein direkt eingegebenes oder real gemessenes Maß bleibt maßgeblich. Der Prior ist eine diagnostische bzw. später weich gewichtbare Plausibilitätsschicht; er ersetzt ungewöhnliche reale Messwerte **nicht** stillschweigend durch einen Populationsmittelwert. ANSUR II bleibt dabei eine militärische Referenzpopulation und ist nicht automatisch das endgültige zivile Populationsmodell.

Im SOLV-Menü gibt es jetzt `Anthropometrischer Prior`. Dort werden alle 24 Maße einzeln bewertet. Ziel- und Rekonstruktionsdiagnostik werden auch in Summary/FULL gespeichert. Liegt das Alter außerhalb des ANSUR-Stützbereichs, wird das im Prior kenntlich gemacht; nur für die Priorberechnung wird das Alter an den verfügbaren Bereich geklemmt, niemals das eigentliche Zielalter.

## Stress-Modus

Die synthetisch von Slider-Kombinationen erzeugten Stress-Archetypen aus v1.2 sind nicht mehr die aktive Zielquelle. V1.3 verwendet acht **tatsächlich beobachtete ANSUR-Train+Validation-Maßvektoren**. Damit bleibt der Blind-Audit menschlich beurteilbar und testet nicht mehr versehentlich künstlich inkonsistente Zielkörper.

Der Donor-Satz enthält gezielt zwei männliche Fälle mit deutlich breiten Schultern (ca. 43,0 cm und 44,5 cm Biacromial Breadth), einen großen proportionalen Mann, einen real beobachteten schmaleren Oberkörper sowie vier weibliche Diagnosefälle. Jeder Zielvektor wird von zwei weit auseinanderliegenden Seeds rekonstruiert: **8 Ziele × 2 Seeds = 16 Blind-Audit-Körper**.

## Schichten bleiben getrennt

- **ANSUR24-PROT-v1 Messgeometrie:** unverändert.
- **Influence Prior:** Deep + Addendum, unverändert.
- **Anthropometric Conditional Prior:** statistische Konsistenz des 24-Maß-Vektors nach Geschlecht, Alter und den übrigen Maßen.
- **Mesh Form Guard:** kontrolliert Geometrie, die nicht eindeutig durch die 24 Zahlen bestimmt ist.
- **Fit Gate:** verwirft numerisch schlechte Rekonstruktionen.

Ein statistischer Prior über die 24 Zielzahlen kann zwei Meshes, die exakt dieselben 24 Werte treffen, nicht vollständig auseinanderhalten. Deshalb bleibt der Mesh-Form-Prior zusätzlich notwendig.

## Durchgeführte Prüfungen

- Conditional-Modelle: 5.156 ANSUR-Train+Validation-Zeilen; Test-Partition nicht verwendet.
- Sex-spezifische standardisierte Residuen liegen erwartungsgemäß bei etwa 1 SD; ca. 4,6–4,7 % überschreiten |2σ| und ca. 0,4 % |3σ|.
- Alle 8 Stress-Donors sind echte beobachtete Datenzeilen.
- Der alte synthetische v0.8.21.2-Stresslauf wird vom neuen Prior deutlich als inkonsistent erkannt; insbesondere mehrere männliche Chest-Breadth-Kombinationen lagen im neuen Leave-one-measure-out-Modell bei weit über |8σ|. Das erklärt, warum einige alte Stresskörper trotz formal gültiger Einzelmaße gequetscht wirkten.
- JavaScript-Syntax, JSON-Schema, 24er-ID-Übereinstimmung und ZIP-Integrität geprüft.
