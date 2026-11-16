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


## Independent backup recovery drill — 2026-11-16
- Original Preview branch: `br-holy-surf-b3fhwfih` (not altered).
- Saved no-compute branch: `br-square-dream-b3zz75rs` (`backup/e-leap-preview-pre-submissions-v2-20261116`).
- Restored a *new test branch* **from that backup**, rather than restoring over Preview: `br-bitter-sound-b3g297nz`, `drill/restore-preview-backup-20261116`.
- Test branch state: READY; on the new branch read-only SQL confirmed `classes=4`, `auth_class_members=3`, `assignments=0`, `submissions=0`, legacy submission key `BIGINT`.
- **Recovery drill passed for branch creation and data readability.** Rebinding an existing Vercel deployment / replacing a live branch was **not rehearsed**. The drill branch remains available and may use compute capacity; do not delete the backup branch.
- A second independently generated preflight backup `br-autumn-silence-b3obbeqv` also exists. Do not confuse it with the drill branch.

## Runtime branch-binding — BLOCKED
- Vercel Preview uses integration-managed, `sensitive` database variables; their metadata lists Preview/Production targets but does not reveal a branch-specific endpoint. Attempts to obtain a comparable host through managed connector metadata did not establish a verified branch match.
- Read-only Neon queries on Preview and main show the **same** old `BIGINT` submission/assignment key types and `classes=4`; these are not sufficient to distinguish the branches through a generic health endpoint.
- No proven read-only deployment-to-branch attestation exists yet. **Do not run migration solely based on Git branch name or a Vercel READY build.**
- Next gate: an authenticated diagnostic of the effective Preview connection endpoint or a trusted Vercel/Neon integration mapping (sanitized branch ID only) that is conclusively tied to deployed runtime. Avoid disclosing connection strings/passwords.
- No schema migration, production change, live submissions or Student→Teacher E2E were executed.


## Final read-only binding attestation (2026-11-16)
- Preview Vercel deployment for Git SHA `b76375f11631b938249ca38247aa16b3fdffac13` reached **READY**.
- Deployed `GET /api/research/bootstrap` returned HTTP 200, `previewDatabaseBindingVerified: true` and `submissionsReady: false`. This is a real Vercel runtime invocation (not a local simulation).
- The Preview-only check evaluates the **same effective URL selected by `getResearchDb()`** against the verified Neon Preview compute endpoint identity. It returns a boolean, never a connection string or password. The successful read-only DB health check confirms connectivity.
- Backup recovery drill: `br-bitter-sound-b3g297nz` was created **from** backup `br-square-dream-b3zz75rs`, became READY and returned `classes=4`, `auth_class_members=3`, `assignments=0`, `submissions=0`, and legacy submission ID type `BIGINT` in read-only SQL. No production or Preview live branch restore/switchover performed.
- **PRE-FLIGHT GATES 1 and 2 now passed:** deployed Preview DB branch binding, plus independently readable recovery copy. A complete switchover rehearsal is intentionally not part of this test.
- **MIGRATION NOT EXECUTED.** Await separately explicit user approval for migration on **only** `br-holy-surf-b3fhwfih`. Before any SQL execution, independently check current row counts, inbound FKs, source branch identity and backups again.
