# Sammy v0.8.25.4 — SOLVER V2 PROOF 1.4

## Zweck

v0.8.25.4 ist **kein neuer Mess- oder Target-Generator-Umbau**. Die Version reagiert gezielt auf den validierten Quick-Lauf aus v0.8.25.3 / Proof 1.3 und fügt genau eine diagnostische Eskalation hinzu: **Direction C · Fresh-Wide Jacobian Rescue**.

Der v1.3-Quick war erstmals ein belastbarer WARN-Lauf: Testvalidität PASS, vier unterschiedliche Round-trip-Targets, keine trivialen Seeds und keine Duplikate. Die besten Lösungen aller vier Targets waren nicht mehr FAIL, aber die Seed-Reproduzierbarkeit blieb zu schwach.

## Befund aus Proof 1.3

Validierter Quick-Lauf `solver-v2-proof-2026-08-26T21-10-22-658Z-kovj5`:

- Overall weighted RMS: **1.1295 Protocol Units**
- Overall RMSE: **0.8029 cm**
- Round-trip non-fail: **100 %**
- akzeptierte Seeds: **62.5 %**
- Median non-target holdout: **0.6612 cm**
- mittlere derived Seed-Streuung: **3.0709 cm**
- max. high-reliability residual: **3.3553 u**
- Direction B: **8/8 Seeds verbessert**, 5/8 final akzeptiert
- zwei Seeds meldeten echten `stalled`-Status; ein weiterer Seed blieb nach fünf kontinuierlich verbessernden B-Pässen noch FAIL.

Gegenüber Proof 1.2 verbesserte das adaptive Rescue-Budget die Hauptwerte deutlich, beseitigte aber die Basin-/Seed-Abhängigkeit nicht. Besonders aussagekräftig waren:

- Target 3 · Seed 2: nach starkem Fortschritt Stillstand bei **1.3908 cm / 2.3524 u**.
- Target 4 · Seed 2: Stillstand bei **5.3668 cm / 8.8800 u**.
- Target 1 · Seed 1: nach fünf weiter verbessernden B-Pässen noch **1.8255 cm / 2.8957 u**.

Die v1.3-Historien zeigen dabei, dass der kompakte semantische B-Ranker in den problematischen Zuständen stark auf Height-/Leg-/Torso-Length-DOFs fokussiert. Globale Mass-/Proportionsachsen und andere plausible Familien können dadurch trotz großer Restfehler außerhalb des lokalen Kandidatensatzes bleiben. Das ist noch kein Beweis für einen Rankingfehler — aber genau diese Alternative muss vor einem Architektur-Umbau sauber ausgeschlossen werden.

## Neu: Direction C · Fresh-Wide Jacobian Rescue

Direction C läuft **nur**, wenn ein normaler Round-trip-Seed nach Direction B weiterhin FAIL ist. Conflict-Controls erhalten Direction C absichtlich nicht.

Ablauf pro C-Pass:

1. Ein breiterer lokaler DOF-Pool wird aufgebaut.
   - alle verfügbaren Core-Achsen werden explizit exponiert;
   - dominante Restmaß-Familien erhalten direkte/top-measure Kandidaten;
   - restliche Plätze werden mit dem vorhandenen semantischen B-Ranking gefüllt.
2. Für **den gesamten Pool** wird am aktuell gestallten Körper ein neuer realer Mesh-Jacobian gemessen.
3. Erst danach werden die Spalten numerisch nach ihrer lokalen, reliability-normalisierten Residual-Korrelation gerankt.
4. Nur die besten frisch gemessenen Spalten gehen in den regularisierten LS-Schritt und die reale Mesh-Line-Search.
5. Der Pass darf nur übernommen werden, wenn das echte Objective besser wird.

Konfiguration:

- Quick: Pool 22 → 12 ausgewählte DOFs, max. 2 C-Pässe
- Standard: Pool 26 → 14 DOFs, max. 2 C-Pässe
- Deep: Pool 30 → 16 DOFs, max. 3 C-Pässe

C verwendet bewusst **keine alten Deep-Interaction-Zahlen** für die finale Auswahl. Deep/Semantik bestimmt nur den günstigen Wide-Pool; die tatsächliche Auswahl kommt aus dem frisch am aktuellen Mesh gemessenen Jacobian.

## Diagnosewert

Proof 1.4 soll die nächste Architekturentscheidung trennen:

- **C rettet gestallte Seeds:** Candidate-Ranking / zu enger lokaler DOF-Satz ist der Hauptengpass. Dann kann die Produktionsarchitektur einen breiteren Fresh-Jacobian-Eskalationspfad übernehmen.
- **C verbessert kurz, stallt aber weiterhin:** lokale Konditionierung / nichtlineare Basin-Struktur ist wahrscheinlicher; danach ist ein strukturell gestufter oder Multi-start/Canonical-Restart-Solver sinnvoller als weitere Ranking-Tweaks.
- **C verbessert gar nicht:** deutlicher Hinweis gegen einen bloßen Rankingfehler; dann sollte die inverse Architektur selbst überarbeitet werden.

## Unverändert

- ANSUR24-PROT-v2 Messdefinitionen und v0.8.24.26 Messgeometrie
- Repair-v1.6-Regel für die sieben reparierten Maße
- kein Konsum alter Interaction-Residuals dieser sieben Maße
- Acromion-abhängige Ziele nur über frische aktuelle Real-Mesh-Jacobians
- Reliability-Gewichte
- Proof-Target-/Seed-Validität v1.2
- synthetischer Target-Generator
- Direction A und Direction B
- PASS/WARN/FAIL-Grenzen
- Blind AUDT mit Best-Fit + Far-Seed-Rekonstruktion

## Erwarteter Test

Zuerst wieder **Quick**. Standard ist erst sinnvoll, wenn Direction C zeigt, ob die drei verbleibenden v1.3-Fehlseeds auf einen zu engen Kandidatenraum oder auf eine echte Basin-/Identifizierbarkeitsgrenze zurückgehen.
