# M3 authenticated Preview HTTP acceptance — 2026-11-17

## Decision
**Authenticated HTTP E2E: PASS.** **Browser UI acceptance: NOT YET VERIFIED.**
**Overall M3 remains OPEN; no Production promotion or release.**

## Exact environment and code
- GitHub Preview branch: `feature/studio-media-library-v1`, deployment code commit `9a9f91681e1c963d114af91847aabbd6be608574`.
- Immutable Vercel Preview deployment: `e-leap-platform-3p62gpo3w-kimluyenk84hvqy.vercel.app` (READY).
- Actual runtime `GET /api/research/bootstrap` returned HTTP 200 with `submissionsReady:true` and `previewDatabaseBindingVerified:true`.
- Neon Preview branch: `br-holy-surf-b3fhwfih` of `jolly-water-29205068`. Neon main `br-bitter-rice-b35yfm8y` was not touched.
- GitHub main baseline remained `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- A Vercel account-authorized protected deployment share session was used solely to access Preview; Deployment Protection was not disabled. Never log or publish that share token.

## Authentic logged-in HTTP execution
- An isolated synthetic Teacher (role=teacher) and a synthetic Student (role=student) were inserted into **Neon Preview only**, each with a randomly generated password or PIN, saved solely in a private temporary QA sandbox file.
- An isolated QA class and active assignment were created, with Teacher owning the class and Student member of it. No real student's credentials or records were reused.
- Ran the existing checked-in `scripts/qa/preview-submissions-e2e.mjs` **against the live Vercel Preview URLs and real Neon Preview**, using the synthetic credentials.
- **PASS**: Teacher login POST `/api/auth/login`, Student PIN login POST `/api/auth/student`, and two independent subsequent `GET /api/auth/me` session checks.
- **PASS**: Student GET assignments contains the exact active QA assignment.
- **PASS**: Student POST submissions created server receipt (HTTP **201**).
- **PASS**: Same request UUID, identical JSON returns HTTP **200**, `idempotent:true`, and identical receipt.
- **PASS**: Same request UUID with changed content was rejected **409 `IDEMPOTENCY_PAYLOAD_CONFLICT`**.
- **PASS**: Wrong activity rejected **400 `ACTIVITY_MISMATCH`**.
- **PASS**: Student submission GET after POST contains receipt.
- **PASS**: Teacher Responses GET contains same receipt; repeated GET still contains receipt after reload-equivalent request.
- Execution logged: `PASS Preview HTTP auth → Student assignment → Submit → same-ID replay → tampered replay denied → teacher Responses → reload`.
- This is **real authenticated HTTP**, not a handler/SQL mock test. It is **not** proof of interactive user-interface rendering or a real lesson's complete teaching session.

## Browser UI attempt and blocker
- Playwright 1.65.1 and Chromium were provisioned in an ephemeral Vercel sandbox. Attempted isolated Student and Teacher browser-context login → assignment → submit → Teacher Responses → reload.
- Chromium failed **at launch**, before navigating to any application page. The Vercel sandbox base image lacks required libraries (e.g. libglib-2.0, libnss3, libX11), and the process is unprivileged. This is **not** an application login failure.
- Browser UI / full teaching interaction must be executed in an environment with working Chromium system dependencies. Do not label M3 ACCEPTED solely from HTTP PASS.

## Cleanup verification
After capturing PASS, ran one Neon Preview-only transaction deleting exclusively the named QA fixture:
- 1 QA `events` row
- 1 QA `submissions` row
- 1 QA `assignments` row
- 1 QA `auth_class_members` membership
- 1 QA `classes` row
- 1 linked QA research `users` row
- 2 QA `auth_sessions` rows
- 2 synthetic `auth_users` rows
Follow-up SELECT: **4 classes, 3 auth_class_members, 0 assignments, 0 submissions, 0 remaining QA accounts, 0 Jigsaw material rows, 0 Jigsaw membership rows**. Existing Neon Preview schema and backup branches remain intact.
No passwords, PINs, session cookies, or deployment-share tokens are in this report or the repository.

## Next and only remaining gate
Run a real two-browser UI acceptance in an authorized Playwright/Chrome environment: login synthetic Teacher/Student separately, open Student Assignments, submit via visible controls, verify Teacher Responses UI after reload; then remove synthetic fixture and explicitly ask the user to approve M3 acceptance before advancing to AI Assistant and Auto Designer.
