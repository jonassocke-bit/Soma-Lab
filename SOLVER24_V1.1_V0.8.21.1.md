# Sammy v0.8.21.1 · Solver24 V1.1

## Warum dieser Zwischenstand
Beim Review des hochgeladenen BODY-AUDIT-Exports fiel auf, dass der Audit **663 Legacy-ANSUR-D3-Fälle** enthielt (`sourceRunId` begann mit `ansur-d3-...`) und nicht den neuen Solver24-Blindlauf. Die visuellen Befunde sind wertvoll für den alten D3-Pfad, dürfen aber nicht still als Solver24-V1-Ergebnis interpretiert werden.

## Änderungen

- **AUDT ist jetzt strikt Solver24-Blind.** Es wird nur der neueste abgeschlossene Solver24-Blindlauf geladen. Falls keiner existiert, zeigt AUDT eine klare Meldung statt automatisch D2/D3 einzublenden.
- Standard-Blindtest bleibt bewusst klein: **3 versteckte Zielkörper × 3 Seeds = 9 Rekonstruktionen**.
- Audit-Export ist jetzt `sammy-body-plausibility-audit-v2` und enthält `sourceType`, `sourceSchema`, `sourceAppVersion` und `sourceRunId`.
- Der Zähler „bewertet“ bezieht sich nur noch auf die aktuell geladenen Fälle.
- **Konservativer Mesh-Form-Guard** im Solver24: sechs kanonische Referenzkörper definieren pro Geschlecht einen breiten zulässigen Korridor. Überwacht werden: Oberschenkel Breite/Tiefe, Taillen-Kontinuität (Breite/Tiefe oberhalb/unterhalb), Halsbasis/Hals-Verhältnis, Hals- und Halsbasis-Querschnitt, Halslänge relativ zur Körperhöhe und Schulter-Level-Differenz.
- Der Guard ist absichtlich **kein aggressiver Shape-Prior**. Er verwirft nur katastrophale Ausreißer; innerhalb des breiten Korridors entscheidet weiter der 24-Maß-Fit + bestehende Parameter-Regularisierung.
- Versteckte Blind-Zielkörper werden vor dem Solve durch denselben Guard geprüft. So auditieren wir nicht versehentlich schon unplausibel erzeugte Zielkörper.
- Plausibilitätsmetriken/-Score werden in Solver24-FULL und Summary protokolliert.

## Nicht geändert

- `ANSUR24-PROT-v1` und alle 24 Messgeometrien bleiben eingefroren.
- Deep + Addendum / 65 Solverparameter bleiben der Einfluss-Prior.
- Körbchengröße/Brustvolumen ist **noch nicht** als neues Zielmaß eingebaut; das folgt erst nach stabilem Body-Solver.

## Test

1. `LAB → SOLV → Standard → Blind-Test starten`.
2. Warten bis 9 Rekonstruktionen fertig sind.
3. `Blind Audit öffnen` oder `LAB → AUDT`. Es müssen **9 Fälle**, nicht 663, erscheinen.
4. Alle 9 nur visuell mit ✓/✕ beurteilen, Fehlerstellen/Kommentar optional.
5. `Audit JSON` und `Solver24 FULL JSON` exportieren.
