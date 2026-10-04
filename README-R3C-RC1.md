# R3C RC1 — Unified Lesson Controls

This build makes the platform lesson-host the single owner of shared lesson controls.

## Shared across U1.1 and U1.2
- Role/status badge
- Teacher/Admin Presentation
- Teacher/Admin Timer
- Teacher/Admin Responses hub foundation
- Admin Edit in Studio
- Legacy internal role switchers/teacher tool strips hidden when hosted
- Next/Previous inside lessons are untouched and remain lesson-owned

## Architecture rule
Legacy U1.1/U1.2 receive a thin host adapter only. New lessons must implement the same `ELEAP_LESSON_HOST_API` contract via the Shared Runtime, not lesson-specific UI controls.
