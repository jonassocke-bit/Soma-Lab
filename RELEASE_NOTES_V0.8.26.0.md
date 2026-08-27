# RELEASE NOTES · Sammy v0.8.26.0

## REAL ANSUR STRESS GATE 1.0

v0.8.26.0 friert den in zwei Quick-Läufen bestätigten **Solver V2 Proof 1.6** als wissenschaftliche Baseline ein und fügt einen separaten Generalisierungs-/Extremtest hinzu. Die Solver-Mathematik selbst wurde nicht verändert.

### Was neu ist

- **10 tatsächlich beobachtete ANSUR-II-Testpersonen** statt Sammy-generierter Zielkörper.
- 4 typische Profile + 6 reale Randfälle; 5 Männer / 5 Frauen.
- Pro Person zunächst genau ein Solverlauf mit der bestehenden Statistical-Canonical-Screening-Pipeline.
- Alle 6 Randfälle erhalten automatisch einen zweiten deterministischen Far-Seed. Ein typischer Fall wird ebenfalls erneut gestartet, wenn der erste Lauf FAIL ist, ein hochverlässliches Restmaß >3 Observer-Units hat oder ein Plausibility-Hard-Fail auftritt.
- **Checkpoint nach jedem Seed und jeder Person**. Nach Safari-Neustart wird höchstens der unvollständige aktuelle Seed wiederholt.
- Zwei nicht optimierte Maße (`torso_height`, `upperleg_height`) werden als **Blind-Holdout** erst nach der Rekonstruktion verglichen.
- Der statistisch geschätzte Weight-Kontext wird gegen das reale ANSUR-Gewicht protokolliert, ist aber kein 24-Maß-Solverziel.
- Parameter-Range-Hits und die experimentelle Torso-Surface-Continuity werden diagnostisch exportiert, nicht als Stress-Gate erzwungen.
- Nach Abschluss können genau 10 anonymisierte Best-Rekonstruktionen direkt in **AUDT** blind bewertet werden.

### Datenhygiene für die nächste Phase

Die 10 Stresspersonen stammen ausschließlich aus `ansur-prediction-test-v1.json` und werden danach als **verbraucht** betrachtet. Die neue Datei `ansur-prediction-final-reserve-v1.json` enthält exakt **902 unangetastete Testpersonen** für die spätere Few-Measure-Prediction-Endvalidierung. Der Statistical Body Bank bleibt Train+Validation-only. `BUILD_REAL_ANSUR_STRESS_ASSETS_V0.8.26.0.py` reproduziert Suite und 902er-Reserve deterministisch aus dem unveränderten Testasset.

### Erwartete Laufzeit

Mit der in v0.8.25.9 gemessenen iPhone-Leistung sind etwa **1½–2 Stunden** für den vollständigen adaptiven Lauf realistisch. Der tatsächliche Umfang liegt bei mindestens 10 Solves und typischerweise 16 Solves (10 Primärläufe + 6 Edge-Re-Tests), zuzüglich eventueller Re-Tests auffälliger typischer Fälle.

### Wissenschaftliche Grenze

ANSUR II liefert Anthropometrie, aber kein 3D-Ground-Truth-Mesh der Personen. Dieser Gate beantwortet daher: **Kann Sammys eingefrorener Körper-/Solverraum reale, nie zum Statistical Prefit verwendete ANSUR-Messprofile gleichzeitig darstellen und bleibt die Lösung bei Randfällen seed-stabil?** Er beantwortet nicht, ob die sichtbare Bauch-/Brust-/Muskelverteilung exakt der historischen Person entspricht.
