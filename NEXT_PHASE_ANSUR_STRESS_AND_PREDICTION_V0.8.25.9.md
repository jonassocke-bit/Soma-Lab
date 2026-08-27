# Nächste Phase nach Proof 1.6 PASS — Stress, reale ANSUR-Validierung, Few-Measure Prediction

## Was der aktuelle PASS tatsächlich beweist

Proof 1.6 zeigt, dass Sammy aus 24 ANSUR24-PROT-v2-kompatiblen Zielmaßen **modellgenerierter versteckter Körper** aus weit entfernten Seeds reproduzierbare Körperlösungen finden kann. ANSUR-II-Train+Validation unterstützt dabei die Initialisierung.

Das beweist noch nicht, dass beliebige reale Personen aus ANSUR oder spätere Nutzer mit wenigen Eingaben gleich gut rekonstruiert werden.

## Meilenstein A — Extreme-but-plausible Stress Suite

Keine frei kombinierte Sammlung unmöglicher Einzel-Extrema. Bevorzugt werden tatsächlich beobachtete bzw. multivariat plausible Körperprofile:
- sehr groß / sehr klein,
- schwer / leicht,
- breite / schmale Frames,
- lange / kurze Beine relativ zum Torso,
- ungewöhnliche, aber beobachtete Kombinationen,
- männlich / weiblich getrennt.

Bewertung bleibt: Fit, Seed-Konvergenz, Holdout, Rig, Conflict-Schutz, Blind-AUDT und Surface Continuity.

## Meilenstein B — Held-out Real-ANSUR Inverse Validation

`ansur-prediction-test-v1.json` bleibt vom Statistical Body Bank getrennt und wird als echte Testpartition verwendet.

Für jede Testperson werden verfügbare direkte ANSUR-Maße als Zielwerte verwendet. Ein Teil der Maße wird dem Solver gegeben; weitere verfügbare Maße werden als Holdout zurückgehalten. Damit wird geprüft, ob Sammy nicht nur seine eigenen synthetischen Körper zurückfinden kann, sondern reale anthropometrische Datensätze sinnvoll invers abbildet.

## Meilenstein C — Few-Measure Prediction + Eingabemaske

Die Datenbasis dafür existiert bereits im Projekt und muss nicht neu erfunden werden. `ansur-prediction-trainval-v1.json` / `ansur-prediction-test-v1.json` enthalten bereits eine deterministische sex-stratifizierte 70/15/15-Aufteilung, 26 Zielgrößen und 11 bewusst als nutzerfreundlich eingestufte Candidate Inputs.

Der bereits definierte `default5` ist:
1. Körperhöhe,
2. Gewicht,
3. Brustumfang,
4. Taillenumfang,
5. Gesäß-/Hüftumfang.

Geschlecht und Alter sind dabei kostenloser Kontext und zählen nicht zu den 5–7 eigentlichen Nutzermessungen. Zusätzliche Kandidaten sind Schulterbreite, Crotch Height/Innenbein, Schulter→Schritt, Oberschenkel-, Handgelenk- und Wadenumfang.

Nach der Stress-/Real-ANSUR-Validierung wird daraus die Produktionspipeline aufgebaut:

**Nutzereingaben → fehlende ANSUR-Maße mit Unsicherheit prognostizieren → vollständiger Zielvektor → Statistical Canonical Start → Solver V2 → Surface/Plausibility-Prüfung → Körper.**

Regeln:
- direkt eingegebene Maße bleiben autoritativ,
- prognostizierte Maße erhalten Unsicherheiten und entsprechend geringere Solvergewichte,
- jede Prognose darf vom Nutzer überschrieben werden,
- die UI zeigt keine technische 24-Maß-Pflichtliste.

Geplante Eingabestufen:
- **Default 5:** Körperhöhe, Gewicht, Brust-, Taille- und Gesäß-/Hüftumfang; Geschlecht + Alter als Kontext;
- **Empfohlen 7:** Default 5 plus zwei per Cross-Validation ausgewählte Zusatzmaße (voraussichtlich Frame/Länge);
- **Erweitert:** weitere direkt bekannte Candidate Inputs für höhere Individualität.

Die konkrete Feature-Auswahl wird auf ANSUR Train+Validation per Cross-Validation gewählt. Der held-out Testsplit bleibt bis zur finalen Prüfung unberührt.
