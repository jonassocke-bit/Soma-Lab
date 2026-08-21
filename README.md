## v0.8.16 · ANSUR D3 Alignment Audit

Basis: v0.8.15. Scope bleibt strikt auf ANSUR LAB / BODY SPACE / Diagnose beschränkt. Startup, Anny/SOMA, Rig, MEAS, R2, R5, DIMENSIONS und die ANSUR-Prediction A/B/C wurden nicht umgebaut.

### Warum D3
D2 zeigte im Stresslauf einen T24-Truth-RMSE von rund 3,67 cm, obwohl alle 24 realen ANSUR-Vergleichsmaße bekannt waren. D3 zerlegt diesen gemeinsamen Fehler diagnostisch.

### Audit-Logik
- 24 Single-Tests: jedes ANSUR-Maß isoliert am echten Mesh.
- Bei allen Singles außer Stature bleibt die echte ANSUR-Stature als Größenanker aktiv, damit ein Breiten-/Umfangsmaß nicht durch triviales globales Hochskalieren „gelöst“ wird.
- 8 Bundles: Brust-Querschnitt, Schulter+Brust, Taille, Becken/Gesäß, Hals, Arme, Beine, vertikale Proportionen.
- Nicht getestete Maße werden nur schwach am neutralen sex-/altersgleichen Sammy-Ausgangskörper regularisiert.
- Real-Mesh-Refinement; kein R5-Canonicalization im Audit.
- Zusätzlicher Rescue-Pass für schwer erreichbare Singles/Bundles.
- Sensitivitätsbasierte Bound-Diagnose: nur die zehn laut Forward-Jacobian relevantesten Slider werden für das Range-Signal betrachtet.

### Automatische Diagnose-Signale
- reachable / partial: isoliertes Maß gut erreichbar.
- mapping: großer, gerichteter Restbias ohne entsprechendes sensibles Bound-Signal.
- range: schwer erreichbar und relevante Slider stoßen an Grenzen.
- conflict: Bundle deutlich schlechter als die zugehörigen Singles.

Diese Labels sind Diagnose-Signale und werden nicht automatisch als Offsets oder Mapping-Korrekturen angewendet.

### Laufgrößen
Quick 3 × 32 = 96 Fits
Standard 8 × 32 = 256 Fits
Deep 16 × 32 = 512 Fits
Stress 30 × 32 = 960 Fits

Der Lauf ist resumierbar und speichert nach jedem fertigen Fit.
