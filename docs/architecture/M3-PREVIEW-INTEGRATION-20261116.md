# E-LEAP M3 Preview Integration Pass — 2026-11-16

## Scope completed in this pass
1. Hardened `server/research/submissions.js`: authenticated Student submissions now validate the incoming `resourceId` and `activityId` against the **server-side active assignment** and store only sanitized answer data; forged client score or identity fields are not persisted.
2. Corrected `teacherOwnsClass` to recognize the class's linked research staff user or authenticated owner UUID, consistent with existing classroom data.
3. Replaced the legacy `assets/js/assignment-submission-bridge.js` homework POST (missing UUID and using local telemetry proof) with a server-backed **Check Submission** action. It no longer matches assignments to cards by array index. On opening a uniquely matched card, it records exact resource and activity IDs as an untrusted navigation hint.
4. New `active-assignment-context.js` accepts that hint only if resource, activity, UUID and 12-hour time window all match. The server remains the permission authority.
5. `ELeapSharedLessonRuntime` and `ELeapNativeActivity` both submit through `ConfirmedAssignmentSubmission`, not `LocalSubmissionStore`; only a confirmed server receipt permits UI success.
6. Added `tests/submission-payload-contract.test.mjs`, `tests/teacher-ownership-contract.test.mjs`, and `tests/active-assignment-context.test.mjs`.

## Evidence / limitations
- Inspected and syntax-checked touched JavaScript via isolated evaluation.
- Executed pure-contract smoke cases: valid/mismatched resource/activity, missing and oversized answer, client-score stripping, exact assignment selection and expiry. All produced expected outcomes.
- Prior independent Neon Preview migration, persistence and uniqueness tests passed (see `docs/migrations/20261116_preview_migration_execution_report.md`).
- GitHub Preview commit `1531b83f2f9a9379c418e33d3b640677f4d04add` is Vercel READY.
- Neon Preview has 4 classes / 3 membership rows, and 0 assignments / 0 submissions after cleanup. No synthetic students remain.
- GitHub main remains `53868a0ea0e9a46982dcb95323460cd05b8a67c4`; no Production promotion and no Neon main writes.

## Do not overclaim
- Authenticated Student browser POST → real Teacher browser Responses → reload across two devices **has NOT been verified** in this pass. Vercel read-only fetch is not an authenticated browser POST actor.
- The UI bridge requires a uniquely matched assignment card; generic/unmatched cards intentionally get no assignment bridge rather than guessing.
- Studio save/publication and group Jigsaw assignments are separate remaining acceptance gates.
- Never run tests using real learners, disclose any passwords/DB URLs, or enable production on the basis of READY alone.

## Next acceptance gate
Automated browser test with synthetic Student and Teacher sessions on a Preview-only route; verify activity opens from an exact server assignment, receipt appears after POST, teacher sees same response, reload retains it, and wrong role, wrong class, duplicate click, lost acknowledgement, and concurrent devices remain isolated.
