# M3 authenticated Preview HTTP acceptance

**Status:** harness staged, not executed with credentials in this checkpoint. This is an HTTP API E2E check, not a graphical browser control test.

`scripts/qa/preview-submissions-e2e.mjs` performs the following only after explicit `ELEAP_QA_CONFIRM=PREVIEW_SYNTHETIC_ONLY`:
- Confirm the deployed Preview runtime is bound to Neon Preview and the submission schema is ready
- Sign in as a synthetic Teacher and Student (credentials supplied only at runtime via environment variables)
- Check the Student sees the exact server assignment, then POST the synthetic answer
- Confirm the receipt on server; replay same UUID/answer returns identical receipt
- Reject same request UUID with modified answer; reject wrong activity
- Confirm Student and Teacher can each read the submission, including a second reload GET

Required environment variables (do not put real passwords in GitHub, logs, issue comments, Vercel public env vars, or lesson content):
- `ELEAP_QA_PREVIEW_URL`: immutable Vercel Preview deployment origin
- `ELEAP_QA_ASSIGNMENT_ID`, `ELEAP_QA_RESOURCE_ID`, `ELEAP_QA_ACTIVITY_ID`
- `ELEAP_QA_TEACHER_EMAIL`, `ELEAP_QA_TEACHER_PASSWORD`
- `ELEAP_QA_STUDENT_ID`, `ELEAP_QA_STUDENT_PIN`
- `ELEAP_QA_CONFIRM=PREVIEW_SYNTHETIC_ONLY`

The harness intentionally fails closed if the deployment's database branch cannot be verified. It creates a submission and does not remove it automatically because deleted evidence would hide test results. Use isolated QA class/accounts on Neon Preview only and remove them with an explicitly scoped cleanup transaction afterward.

**Manual/browser remainder:** The classroom UI still needs a student to open the assigned activity, submit through Runtime, and the teacher to observe the Responses UI. Multi-device concurrent POST must also be tested. No Production publication is authorized by this script alone.

**2026-11-16 attempt:** A short-lived Vercel sandbox successfully made a read-only GET to the protected Preview deployment (HTTP 200). The attempted authenticated HTTP test was blocked by the tool safety gate before execution. The QA test class/account/assignment fixtures were removed in one Neon Preview transaction, leaving 4 classes, 3 memberships, zero assignments/submissions. The sandbox was stopped. No student HTTP POST was performed.
