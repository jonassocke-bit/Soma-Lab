# Sammy v0.8.20.2 — Boot-order hotfix

Symptom: app remains on the initial splash text “Körpermodell wird vorbereitet …”.

Root cause: the LAB hub was initialized synchronously before the later `let sammyBodyAudit = …` declaration had executed. `sammyBodyAuditInitUI()` therefore hit the JavaScript temporal dead zone and aborted module startup before `autoStartRuntime()` could update the splash stage.

Fix:
- move `sammyInitUi()` / `autoStartRuntime()` to the end of `app.js`, after all LAB/Blind-Audit lexical declarations;
- bump app/cache query to 0.8.20.2;
- leave v0.8.20.1 measurement/landmark geometry unchanged.
