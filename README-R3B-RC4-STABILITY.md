# R3B RC4 — Stability reset

- Presentation is transient; Teacher/Admin always enter a lesson in Teacher/Admin mode unless Presentation is explicitly activated in the current host.
- Removed service-worker stale-cache interference in Preview.
- Lesson loading overlay clears as soon as the lesson DOM shell exists; media continues in background.
- Removed mutation-observer role-enforcement loop from legacy U1.1/U1.2 adapters.
- U1.2 now exposes a programmatic host mode API; no hidden-button clicking.
- U1.1 continues to use its existing ELEAP_U11_UI mode API.
