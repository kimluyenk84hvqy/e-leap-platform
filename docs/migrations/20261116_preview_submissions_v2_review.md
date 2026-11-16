# Reviewed migration checkpoint — NOT EXECUTED

## Target and safety
Neon `e-leap-research-db` Preview branch `br-holy-surf-b3fhwfih` only.
**Never** run against default `main` branch `br-bitter-rice-b35yfm8y`.
The SQL at `docs/migrations/20261116_preview_submissions_v2.sql` is staged for review, not executed.

## Verified current facts (read-only)
- Legacy Preview assignments and submissions each contain zero rows.
- Assignment IDs, submission IDs and class references use BIGINT; active classes use UUID.
- Submission table lacks `student_user_id` and `client_request_id`.
- No foreign keys were found directly referencing legacy assignments/submissions on the checked Preview snapshot.
- Existing student class memberships and classes must not be touched.

## Migration behavior
Single transaction, locks only the two legacy tables, aborts if either is non-empty, checks that backup names do not exist, checks for newly introduced referencing FKs.
Renames both legacy tables to backup names and creates fresh UUID versions with the precise unique indexes checked by the API readiness gate.
Existing classes/auth_users are referenced, never dropped or rewritten.
On SQL failure PostgreSQL rolls back the transaction. A successful commit is **not** automatically rolled back; keep backups, validate, and require separate approval for any further changes.

## Before execution
1. Take a Neon snapshot or verify an available restore path and branch identity.
2. Confirm the Preview deployment is actually bound to the Preview Neon branch; branch names alone do not prove environment variable routing.
3. Re-run schema, row-count and FK checks. Require zero legacy rows.
4. Obtain explicit teacher/project-owner approval of this Preview-only migration.
5. Execute SQL only against `br-holy-surf-b3fhwfih`.

## After execution
Recheck columns and unique indexes; `/api/research/bootstrap` should report `submissionsReady:true`.
Then use synthetic accounts in Preview to test Student Submit → Neon → Teacher Responses → reload → grading.
Verify duplicate clicks, parallel devices and lost-response retry; do not publish the U6 lesson until full E2E checks pass.

## Production guard
No GitHub main merge; no Vercel Production deployment or promotion; no Neon main SQL.
