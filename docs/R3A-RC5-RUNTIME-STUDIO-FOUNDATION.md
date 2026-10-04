# R3A RC5 — Runtime + Studio Foundation

This candidate consolidates the role UX discovered during Preview QA.

- Student: official Submit; no Teacher reveal unless activity policy explicitly enables it.
- Guest: public practice with Check answer / Finish practice; no official progress or research-linked identity.
- Teacher: lesson delivery controls only; reveal and responses are role-bound.
- Admin: teacher-side lesson behavior plus Edit in Studio.
- Teacher with explicit `content:manage` grant also receives Edit in Studio.
- Studio is a separate authoring surface. Runtime is not an inline content editor.
- Studio foundation supports structured title/instruction/prompt edits, activity type selection, answer/model data, add/duplicate/remove/reorder, local draft save, and publish/request-publish staging.
- Production authentication and server-side persistence/publish enforcement remain required before live learner data or real publishing.
