# E-LEAP Modular Source Map — pre-U2.1

Canonical module homes:

- `assets/js/controls/` — role controls, shell, contract, layout behavior.
- `assets/js/authoring/` — lesson model, layout/content block registries, media references.
- `assets/js/activities/` — activity registry and future activity-specific modules.
- `assets/js/grading/` — grading core and future attempt/scoring policies.
- `assets/js/assessment/` — Practice/Homework/Mock Test/Presentation policy.
- `assets/js/themes/` — theme tokens.
- `assets/js/media/` — media assets/resolution logic.
- `assets/js/quality/` — Quality Gate.
- `assets/js/runtime/` — lesson engine, runtime context, shared lesson runtime.
- `assets/js/live/` — Live Session client modules.
- `assets/css/controls/` — shared role-control layout and visual-state styling.
- `media/images/`, `media/audio/`, `media/video/` — physical media homes for new authored lessons.

Compatibility entrypoints remain at their legacy paths during migration. New code should import canonical modules when practical; existing Golden References continue through bridges to avoid regressions.
