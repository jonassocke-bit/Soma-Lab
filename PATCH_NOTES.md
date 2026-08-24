SAMMY v0.8.24.11 PATCH — FINAL MODULE BOOTSTRAP HOTFIX

Basis: v0.8.24.10
Geänderte Dateien:
- app.js
- index.html

Fix:
- Entfernt den frühen sammyInitUi()/autoStartRuntime()-Aufruf mitten im ES-Modul.
- Ein einziger finaler Bootstrap steht jetzt am absoluten Ende von app.js, nachdem alle SOLV/MASS/MORF const/let-Deklarationen initialisiert sind.
- UI-Initialisierung und MORF-UI-Initialisierung sind voneinander isoliert; ein sekundärer UI-Fehler darf den Körpermodell-Start nicht mehr blockieren.
- autoStartRuntime() wird unabhängig davon terminiert gestartet.
- v0.8.24.10 Profile/Section-v2 und Atlas-v2.5 bleiben unverändert enthalten.

Abnahme:
1. Splash muss von „Körpermodell wird vorbereitet …“ zu „SOMA Basis/Topologie wird geladen …“ wechseln.
2. App muss bis zum Mannequin booten.
3. Danach MORF öffnen und erst dann einen Quick starten.
