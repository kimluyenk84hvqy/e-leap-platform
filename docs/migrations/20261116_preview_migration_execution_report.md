# Neon Preview Migration Acceptance — execution report
Date: 2026-11-16

## Authorization and target
User explicitly authorized execution of the reviewed migration **only** on Neon Preview branch
`br-holy-surf-b3fhwfih` in project `jolly-water-29205068`.
GitHub main, Vercel Production and Neon main are excluded.

## Final preflight
- Neon Preview `br-holy-surf-b3fhwfih` was nondefault and READY; main `br-bitter-rice-b35yfm8y` remained default.
- Backups `br-square-dream-b3zz75rs`, `br-autumn-silence-b3obbeqv` retained. A restore drill from backup into `br-bitter-sound-b3g297nz` had already proven data readability.
- assignments=0; submissions=0; classes=4; auth_class_members=3; legacy IDs were BIGINT.
- Incoming FKs to the two old tables=0; external dependent views=0; backup table names unused.
- Deployed Vercel Preview `GET /api/research/bootstrap`: `previewDatabaseBindingVerified=true`, `submissionsReady=false` before migration.
- A first automated safety-name check refused to proceed before SQL because GitHub and Neon branch names have different expected prefixes. No SQL executed in that attempt. Then the check was corrected to compare the exact Neon branch ID and complete name.

## Execution
Source: `docs/migrations/20261116_preview_submissions_v2.sql` in GitHub Preview.
The source script was parsed into 15 executable statements (BEGIN/COMMIT supplied by Neon `run_sql_transaction`).
All 15 statements ran in **one transaction** addressed explicitly to `br-holy-surf-b3fhwfih`; the database returned success for all.

## Database post-validation
- `assignments.assignment_id` and `assignments.class_id` are UUID.
- `submissions.submission_id`, `submissions.assignment_id`, `submissions.student_user_id`, `submissions.client_request_id` are UUID.
- `idx_submissions_assignment_student_attempt_v2` and `idx_submissions_idempotent_v2` are UNIQUE over the required three columns each.
- Both empty legacy tables were retained as `assignments_legacy_20261116` and `submissions_legacy_20261116`.
- The deployed Vercel Preview health check returned HTTP 200 with `submissionsReady=true` and `previewDatabaseBindingVerified=true`.

## Synthetic data integration tests (Neon Preview ONLY)
Created: an isolated synthetic teacher identity (linked platform/research record), two synthetic student identities, one test class, two membership rows, one assignment, and one submission.
- A separate subsequent SELECT via the teacher/class relationship returned the student submission.
- A separate subsequent SELECT via the student's membership and assignment returned the submitted JSON response (reload/persistence at the SQL level).
- Reusing the same `client_request_id` created **zero** duplicate rows using `ON CONFLICT DO NOTHING`.
- Reusing the same `attempt_no` with another request ID also created **zero** duplicate rows.
- A second student posted independently against the same assignment. Both submissions were visible in a later read.

Cleanup was executed in one transaction: removed 2 submissions, 1 assignment, 2 memberships, 1 synthetic class, 1 research-user record and 3 synthetic auth-user records.
Post-cleanup: `classes=4`, `auth_class_members=3`, `assignments=0`, `submissions=0`; both legacy tables remain.

## Important acceptance limitation
These are real database writes and reads, **not a full browser/API end-to-end simulation**. The available Vercel URL fetch supports read-only GET and does not provide authenticated Student/Teacher POST sessions; the attempted protected deployment access was not successful. Therefore:
- **Migration: PASS**
- **Database persistence, uniqueness and teacher-query smoke test: PASS**
- **Authenticated Student UI Submit → API → Teacher Responses → browser reload: NOT YET VERIFIED**
- **Cross-device simultaneous POST and lost-network HTTP E2E: NOT YET VERIFIED**
Do not claim M3 learner Runtime acceptance or deploy this branch to Production before completing these tests.

## Protection
GitHub `main` remained `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
No Vercel Production promotion was issued and no Neon main write was issued.
Do not delete recovery branches or legacy tables without a separately approved retention/cleanup decision.
