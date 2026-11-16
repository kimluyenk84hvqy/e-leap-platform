# Neon Preview Migration Acceptance — PRE-FLIGHT (2026-11-16)

**Outcome: CONDITIONAL / NOT EXECUTED.** No SQL migration performed.

## Exact system targets

- GitHub preview: `feature/studio-media-library-v1`; production code `main` MUST NOT CHANGE.
- Neon project: `jolly-water-29205068` (`e-leap-research-db`).
- Target Preview: `br-holy-surf-b3fhwfih` (`preview/feature/studio-media-library-v1`).
- Protected-from-change target: Neon default `br-bitter-rice-b35yfm8y` (`main`).
- Backup created: `br-autumn-silence-b3obbeqv` (`backup/pre-submissions-migration-20261116`), parent Preview branch, parent LSN `0/3090760`, state READY, `no_compute=true`. Retain it; do not auto-delete.

## Exact source reviewed

`docs/migrations/20261116_preview_submissions_v2.sql`. In addition to transaction/empty-table guard/legacy table retention, it now checks legacy type fingerprint, inbound FK dependencies and dependent views, and uses short statement/lock timeouts. This is an unexecuted migration script.

## Direct read-only database results on Preview

| Check | Observed |
|---|---|
| `assignments` rows | 0 |
| `submissions` rows | 0 |
| `classes` rows | 4 |
| `auth_class_members` rows | 3 |
| `assignments.assignment_id` | BIGINT |
| `assignments.class_id` | BIGINT |
| `submissions.submission_id` | BIGINT |
| `submissions.student_user_id` | Missing |
| `submissions.client_request_id` | Missing |
| Incoming foreign keys to legacy tables | 0 |
| External view dependencies | 0 |
| Legacy backup table names | Unused |

## Recovery assessment

- Neon snapshot API **refused snapshot on this non-root Preview branch** (`not allowed to snapshot non-root branch`).
- Existing snapshot `E-LEAP PRE-GOLDEN 2026-10-08` belongs to Neon `main`; it is **not** a current Preview backup.
- A separate, READY, no-compute **branch backup** from the Preview was successfully created instead.
- The backup is a recoverable branch data copy at the recorded LSN, but a **restore rehearsal into a fresh compute-enabled branch has not been run**. Claim only backup availability, not proven end-to-end restoration.
- Migration transaction rolls back if any command raises before COMMIT. After COMMIT, a restoration is a separate, approved procedure; never silently switch Vercel's database endpoint.

## Critical unresolved launch gate

Vercel's `RESEARCH_DB_URL_DATABASE_URL` is an integration-managed sensitive variable targeted at both Preview and Production. Its metadata **does not expose a branch-specific endpoint**; no reliable evidence was found that the newly deployed Preview is actually connected to Neon Preview (rather than main) at runtime. Merely naming a Vercel Preview branch is insufficient.

**DO NOT EXECUTE** until a safe, read-only runtime branch-binding check conclusively identifies Neon Preview. Then obtain explicit, separate authorization for the Preview-only schema change.

## Acceptance plan after separate approval and verified branch binding

1. Reconfirm project, branch_id, DB name, row counts and dependencies.
2. Confirm backups and a recoverable restore route, preferably rehearse restore on a disposable branch after approval if needed.
3. Execute exact reviewed SQL **only on `br-holy-surf-b3fhwfih`**, never default branch.
4. Independently query columns, indexes and row counts; `/api/research/bootstrap` should report `submissionsReady:true`.
5. With synthetic test accounts only, test Student Submit → Neon → Teacher Responses → reload; duplicate requests, network loss, two concurrent devices, authorization and grading.
6. Do not merge to GitHub `main`, promote Vercel Production or write to Neon main without further project-owner approval.

## Other notes

A no-compute backup branch is inexpensive relative to a full second running compute but may still count towards Neon storage/branch quotas. Keep cost monitoring and retention under review; never auto-delete backups.
