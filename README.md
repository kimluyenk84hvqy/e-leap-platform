# E-LEAP CLEAN V1.1 MASTER

This is the clean source baseline for branch `e-leap-clean-v1` and future lesson production.

Locked foundations: Modular Source Architecture; Role Control Contract; Control Layout & Visual State Contract; Lesson Template Contract v1.0.

New lessons use Poppins, the VMMU/Faculty institutional cover, fresh military-green theme, standard smart templates, shared activity/grading controls, asset-based media references, and Quality Gate validation.

U1.1/U1.2 remain Golden References. U2.1 is the first Golden Authoring Test.

# E-LEAP CLEAN V1 MASTER

This is the clean-source baseline for **E-LEAP — English Learning, Engagement and Assessment Platform**.

## Purpose
- one clean master source instead of chained RC patches;
- modular functional ownership so defects can be fixed locally;
- U1.1/U1.2 retained as Golden References during migration;
- all new lessons (starting with U2.1) use structured authoring/runtime data rather than lesson-specific code.

## Active module map
- `assets/js/controls/` — Role Control Contract + Teacher/Admin/Student/Guest/Presentation shells.
- `assets/js/authoring/` — lesson model, layout/content/media references.
- `assets/js/activities/` — activity registry and future activity modules.
- `assets/js/grading/` — scoring core and attempt semantics.
- `assets/js/assessment/` — Practice/Homework/Mock Test/Presentation policy.
- `assets/js/themes/` — theme tokens.
- `assets/js/quality/` — authoring/publish quality gates.
- `assets/js/runtime/` — lesson engine/runtime context/shared runtime.
- `assets/js/live/` — live-session transport.
- `assets/js/media/` — media asset/resolver layer.
- `assets/css/controls/` — role-control layout and visual states.
- `courses/` — Course → Unit → Lesson structured data.
- `lessons/` — Golden/legacy lesson renderers retained only for migration compatibility.
- `media/images`, `media/audio`, `media/video` — destination for new media assets.
- `data/` — registries, policies, authoring data and platform shell data.
- `studio/` — Authoring Studio shell.

## Compatibility rule
Small bridge entrypoints remain in `assets/js/` so U1.1/U1.2 keep working while the clean runtime is adopted. New features must be implemented in the functional folders above, not in new root-level monoliths.

## Locked references
- U1.1 and U1.2 remain Golden References.
- Next/Previous behavior remains locked.
- Role Control Contract remains locked.

## Next milestone
U2.1 is the first **Golden Authoring Test** created on this clean modular source.
