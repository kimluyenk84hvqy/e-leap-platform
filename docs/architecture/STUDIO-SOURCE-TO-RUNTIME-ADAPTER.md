# M1 → M3 safe adapter checkpoint (Preview)
The Source-to-Studio Review Adapter maps one explicitly structured Reading task into the existing E-LEAP `screen.combo` + `blocks` authoring format (Read → Answer → Compare), with an open response activity for each original question.

**Intentionally never** creates MCQ grading keys from teacher-supplied text, AI guesses or placeholder data. All imported blocks remain within a screen flagged `sourceReviewDraft`; the existing shared `auditLesson` rejects its publication. This prevents the legacy authoring normalizer from inserting default answer A as a scored key.

`verifyComboStateTraversal` reuses `comboStep`, `setComboStep`, `activeComboBlocks` from the shared Teaching Combo registry; it verifies each step has learner-facing content. This checks the data shape, **not** DOM/browser interaction or authenticated server submissions.

No direct user-facing import UI or AI calls are enabled yet. Next engineering step: place the adapter behind an explicit teacher-only Studio review action with traceable page refs, then add a server-trusted answer approval path before converting to a scored activity. Do not attempt to auto-publish.

M1 and M3 remain PARTIAL until real source verification, full runtime integration, role-controlled responses, visual tests and authorized end-to-end QA pass.
