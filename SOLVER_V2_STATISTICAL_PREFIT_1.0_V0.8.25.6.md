# Solver V2 Statistical Prefit 1.0 · v0.8.25.6

## Bezug zu früheren Projektentscheidungen

Die Statistik war bereits in mehreren getrennten Schichten vorgesehen:

- Solver24 v1.3: sex-spezifischer Conditional Prior aus ANSUR Train+Validation, direkte Maße bleiben autoritativ.
- MASS + COMPOSITION v1: Weight als weicher Kontext, Weight-Ridge aus 24 Maßen + Alter + Geschlecht; RFM/FFMI nur als schwacher Composition Proxy.
- Influence-Phase: Influence-Daten werden Initialisierungs-/Jacobian-Prior für den späteren inversen 24-Ziel-Solver; Vorhersage fehlender Nutzermaße bleibt eine separate statistische Schicht.

Proof 1.5 nutzt diese Vorarbeit jetzt für einen **Canonical Prefit**, ohne die Schichten zu vermischen.

## Body Bank

`solver-v2-statistical-body-bank-v1.json` wird deterministisch aus `ansur-prediction-trainval-v1.json` erzeugt.

Pro Geschlecht werden acht Cluster gebildet. Gespeichert wird nicht ein synthetischer Mittelwertkörper, sondern der jeweils nächste **tatsächlich beobachtete Datenzeilen-Medoid**. Profile enthalten u. a. Größe, Gewicht, Schulter-/Hüftverhältnis, Waist/Stature, Crotch/Stature, Tibiale/Stature, Arm/Stature und eine niedrig gewichtete Chest-Depth/Breadth-Komponente.

Der reservierte ANSUR-Testsplit wird nicht gelesen oder verwendet.

## Runtime Prefit

Aus einem vollständigen 24er Zielvektor werden berechnet:

- nearest statistical archetypes;
- Weight-Prediction aus der bestehenden sex-spezifischen Ridge;
- RFM/FFMI-basierter schwacher `core:muscle`-Center;
- Schulter/Hüft-basierter schwacher `core:proportions`-Center;
- Height-Start relativ zur aktuellen gleichgeschlechtlichen/gleichaltrigen Sammy-Neutralform.

Ein kleiner Core-Surrogate-Schritt darf diese Zentren vor dem realen Mesh-Screening korrigieren. Die sieben reparierten Messreihen besitzen im Deep-Vektor weiterhin keine alten numerical interaction responses.

## Nicht enthalten

Dieser Prefit sagt **keine fehlenden Nutzermaße voraus**. Die Missing-Measure-Prediction bleibt die bereits getrennt geplante ANSUR-Statistikschicht. Proof 1.5 testet den inversen Solver bei vollständigen 24 Zielmaßen.
