# E-LEAP M3 — Platform assignment / Responses integration checkpoint
Date: 2026-11-16

## Confirmed source-level fixes
- On `assets/js/app.js`, Student My Assignments now uses the same `ConfirmedAssignmentSubmission` service as Shared Runtime / Native Activity. The old direct POST without `clientRequestId` is removed.
- Server receipt is required for success. The service verifies authenticated Student, active exact assignment, resource/activity match and server submission ID.
- Assignment cards include exact `data-assignment-id` and `data-resource-id` for the bridge, which no longer matches items by index.
- Student submission/feedback reads use the authenticated cookie session. The old `studentCode` query hint is not used.
- Teacher assignment creation UI requires an Activity ID; the server will not accept a Student response if the assignment has no matching activity.
- User-visible Student button text now correctly describes submitting an answer, not opening a separate lesson.
- All touched files were syntax-checked by isolated JS parsing; static contract assertions verified code paths.

## API / Neon state
- Prior Neon migration and SQL-level persistence/uniqueness/reload smoke tests passed. Preview data was cleared.
- An authenticated HTTP smoke attempt was blocked by the tool safety gate *before* the request. QA fixture accounts and class were removed, and the Vercel Sandbox stopped.
- `scripts/qa/preview-submissions-e2e.mjs` is staged for execution only in an appropriately authorized environment, with credentials supplied at runtime, not committed.
- No successful authenticated browser Submit → Teacher Responses → reload E2E result has been observed, hence **M3 NOT ACCEPTED**.

## Release gates
- Do not merge Preview into GitHub main or promote Vercel Production.
- Do not modify Neon main.
- Next: authorized QA run must verify Teacher login, Student login, assignment access, Submit receipt, GET reload, Teacher Responses and wrong-class isolation.
- Then apply Jigsaw group assignment and content review to U6 only after this E2E gate.
