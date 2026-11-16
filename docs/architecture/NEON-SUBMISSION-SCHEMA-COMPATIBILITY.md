# Neon Preview / Submission P0 — schema compatibility gate
Date: 2026-11-16

## Observed via read-only Neon queries on Preview branch
Project: `e-leap-research-db`. Preview: `br-holy-surf-b3fhwfih`; main: `br-bitter-rice-b35yfm8y`.
- `assignments` exists but `assignment_id` and `class_id` are BIGINT, while `classes.class_id` is UUID.
- `submissions` exists but `submission_id` and `assignment_id` are BIGINT, and `student_user_id` is absent.
- `assignments` and `submissions` have zero rows on this Preview snapshot; `classes` has four rows and `auth_class_members` has three.
- Current API incorrectly assumes UUID types and auth-backed submission IDs. The old behavior could return HTTP 500 or show empty/incorrect Responses.

## Safety changes
`server/_submission-schema-contract.js` performs only SELECT/metadata reads and returns HTTP 503 `SUBMISSIONS_SCHEMA_UPGRADE_REQUIRED` when incompatible.
The API must not attempt INSERT, UPDATE, DELETE, or schema migration when the gate is closed.

## Required follow-up (not executed)
Prepare a reviewed migration **on Neon Preview only**, with:
1. Snapshot/restore plan and assessment of foreign keys referencing legacy `assignments` and `submissions`.
2. Preserve legacy empty tables under audited backup names, or choose new versioned tables.
3. Adopt UUID assignment/submission IDs, UUID student_user_id, UUID client_request_id and compatibility with UUID classes.
4. Add `UNIQUE(assignment_id,student_user_id,attempt_no)` named `idx_submissions_assignment_student_attempt_v2`.
5. Add `UNIQUE(assignment_id,student_user_id,client_request_id)` named `idx_submissions_idempotent_v2`.
6. Validate with six authenticated synthetic students before any release.
7. No Production/Neon main migration, promoting or merging without explicit approval.

## Scope
No migration, database writes or database deletion executed. Preview GitHub only. Vercel Production untouched.
