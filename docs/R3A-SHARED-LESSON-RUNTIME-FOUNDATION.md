# R3A — Shared Lesson Runtime Foundation v1.0

## Purpose
Stop lesson-specific controller growth. All new E-LEAP lessons use structured data + shared activity templates + one role-aware runtime.

## Locked principles
1. U1.1/U1.2 remain Golden UX references and compatibility lessons until native parity is proven.
2. New lessons do not own role logic, responsive CSS, research logging, media resolution, Submit/Check/Reveal logic, or presentation authorization.
3. Role comes from platform runtime context. Presentation is a Teacher/Admin mode, never a role.
4. Student reveal is activity-policy controlled. Teacher reveal is role-controlled and armed before item reveal.
5. Typography/layout are owned by the E-LEAP Design System, Poppins-first.
6. Lesson content is data; interaction is a renderer. Changing interaction must not require rewriting content.
7. Research events are emitted by the runtime, not hand-coded inside each lesson.

## This checkpoint implements
- Canonical runtime context.
- Activity type registry.
- Native shared runtime foundation.
- Poppins-first design system tokens/components.
- Native lesson/activity/media schemas.
- Runtime QA lab with MCQ, role-bound reveal, and writing examples.
- Activity template metadata for future AI authoring.
- RC5 standalone guard carried forward in lesson-host.

## Not yet claimed as PASS
- Real server authentication / signed claims.
- Full media library UI.
- PPT/DOCX/PDF AI importer.
- Full renderer parity for every activity type.
- Migration of U1.1/U1.2 into native schema.

## Next gate
R3B: complete core renderers (MCQ, T/F, Fill, Matching, Listening, Speaking, Writing), shared submission/autosave policy, media resolver, and responsive QA before rebuilding U1.


## RC2 audit hardening
- Fail-closed role default is Guest.
- Guest navigation excludes Mock Tests.
- Answer text is no longer embedded in reveal-button DOM attributes.
- Teacher MCQ reveal is role-bound and armed before per-option reveal.
- Production security still requires authenticated server-issued claims and server-protected answer keys.
