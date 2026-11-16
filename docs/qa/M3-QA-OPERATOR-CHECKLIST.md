# M3 Preview QA — one-time operator handoff
Date: 2026-11-16

## Verified current preflight
- Neon target: `jolly-water-29205068` / Preview branch `br-holy-surf-b3fhwfih`.
- One active Admin account with password, three Student accounts with PIN, **no Teacher account** in `auth_users` at the last read-only check. No existing assignment or submission.
- Preview deployment at code SHA `b89fd5bfcf081c4edd70705e155130c43d7b8745` is READY.
- GitHub `main` remains unchanged at `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- Last full isolated Node test: 20 passed, 0 failed; not authenticated browser E2E.

## Safe operator setup: no passwords shared in chat
1. Sign into **Preview** as the existing Admin (do not use Production). Provision a dedicated, clearly marked synthetic Teacher with its own temporary password via the Admin user-management UI. Do not use a real teacher identity.
2. Create one QA class owned by that Teacher and one active assignment with the exact `resourceId` and **nonempty** `activityId`. Use a synthetic test Student, with a six-digit PIN assigned or set through the class join path; do not use a real learner.
3. Confirm with read-only checks that the Teacher can view the QA class and the Student belongs to it. No user password or PIN must be written in GitHub source, logs, documentation or in ChatGPT messages.
4. In GitHub repository → Settings → Environments create `preview-qa`; optionally require reviewers for dispatch. Set its secrets:
   - `ELEAP_QA_PREVIEW_URL` (immutable Vercel Preview deployment URL, not Production)
   - `ELEAP_QA_ASSIGNMENT_ID`, `ELEAP_QA_RESOURCE_ID`, `ELEAP_QA_ACTIVITY_ID`
   - `ELEAP_QA_TEACHER_EMAIL`, `ELEAP_QA_TEACHER_PASSWORD`
   - `ELEAP_QA_STUDENT_ID`, `ELEAP_QA_STUDENT_PIN`
5. GitHub Settings → Secrets and variables → Actions → Variables: set `ELEAP_QA_E2E_ENABLED=true`, then push an innocuous change **only** on `feature/studio-media-library-v1`. This triggers the Preview-only authenticated job; reset the variable to `false` immediately afterward. Do not merge workflow into main solely to run it.
6. Accept only an authenticated job PASS which asserts Teacher session, Student session, exact assignment, POST receipt, idempotent replay, changed-payload rejection, Student reload, Teacher Responses and Teacher reload.
7. Independently verify **visible UI** on two signed-in browsers/devices; the HTTP harness alone does not prove that the user-facing Responses page renders correctly.
8. Retain the QA evidence, then explicitly remove isolated QA data on Neon Preview only; never delete legacy backups or mutate Production.

## Blockers and boundaries
- These QA accounts and secrets have not been provisioned by this checkpoint.
- No authenticated E2E has run: this document is an operator checklist, not an acceptance certificate.
- Only run with dedicated synthetic identities and authorization; do not reuse actual class accounts.
- Final release still requires an explicit production promotion approval after all tests pass.
