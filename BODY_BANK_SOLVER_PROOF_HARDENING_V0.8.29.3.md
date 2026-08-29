# BODY BANK SOLVER · Proof Hardening 1.1 · v0.8.29.3

## Ziel

v0.8.29.3 härtet die erste Body-Bank-Solverarchitektur, ohne ihren Scope zu vergrößern. Der Stand reagiert direkt auf den erfolgreichen v0.8.29.2-Proof und den manuellen 178/80/100/85/100-Lauf.

## Änderungen

### 1. Kanonische Statur

Der Body-Bank-Solver benutzt ab jetzt ausschließlich die exakte Anny-Rest-Mesh-Bounding-Box-Höhe als Solver-Statur. Die ältere Measurement-Stack-Statur wird nur noch diagnostisch exportiert.

### 2. Score-Trennung

- `geometryScore`: Statur + Brust + Taille + Hüfte/Gesäß.
- `weightPriorScore`: separat; Gewicht ist nicht lokal steuerbar.
- `retrievalScore`: Geometrie + schwacher Weight-Prior für die Seed-Rangfolge.
- Local-Fit-Akzeptanz und Rollback: ausschließlich `geometryScore`.

### 3. Family-Holdout Proof v1.2

Der Proof steigt von 8 auf 16 Fälle. Für jeden versteckten Zielkörper werden vor Retrieval entfernt:

- der Zielkörper selbst,
- die komplette `familyId`,
- Core-Rezeptnachbarn mit Distanz <= 0.16.

Der Proof bleibt geschlechtsbalanciert und auf 140–205 cm begrenzt. Die tatsächlichen Ausschlusszahlen werden je Fall exportiert.

### 4. Vollständiger Local-Fit-Trace

Höhe, Taille, Hüfte und Brust schreiben jetzt auch dann einen Trace-Eintrag, wenn kein Schritt angenommen wurde. Mögliche Gründe: `within-deadband`, `morph-missing`, `local-bound`, `weak-derivative`, `no-improvement-rollback`, `improved`.

### 5. ACTIVE-Kandidat erhalten

Der erste erfolgreiche manuelle Solverlauf aus v0.8.29.2 erzeugte `AA-S-2f9708e4`. Dieser Shape wird im statischen ACTIVE-Seed erhalten und bleibt unauditiert, bis er in BANK -> ACTIVE bewertet wird.

## Bewusst unverändert

- keine neuen Solver-DOFs,
- keine freie Weight-/Muscle-Optimierung,
- keine Cross-Region-Rettung,
- keine Kopf-/Head-Fat-Änderung,
- kein globales Ableiten von Slidergrenzen aus Audit-Rejections,
- bekannte Schulter-Joint-Metrik bleibt ausgeschlossen.
