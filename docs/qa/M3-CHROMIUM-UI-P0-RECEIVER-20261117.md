# M3 UI Acceptance — Chromium discovery, P0 bug fix and gated verification
Date: 2026-11-17

## Decision
**M3 is NOT yet ACCEPTED.** Production remains unchanged.

## Preview scope
- Branch: `feature/studio-media-library-v1`
- Broken baseline: `64519bff3bd32def108d0c7e5bec4e7aa2e54784`
- P0 fix: `c5293c9583a5a215041b6a6a520d5a35f60782ae`, READY on immutable Vercel Preview deployment `e-leap-platform-leponkgjr-kimluyenk84hvqy.vercel.app`
- Neon Preview only: `br-holy-surf-b3fhwfih`. Never touched Neon main or GitHub main.
- Environments remain protected. The existing Vercel-identity-authorized temporary Preview share link was used for browser navigation; no credentials or share secrets were committed.

## Actual Chromium UI test — previously failing before fix
1. Installed Chromium dependencies in an ephemeral **Vercel Sandbox only** (shared libs and fontconfig). Initial Chromium had `FATAL ... SkFontMgr_FontConfigInterface.cpp:163 Not implemented`; installing fontconfig + DejaVu/Liberation resolved browser crashes.
2. Created one synthetic Teacher and one synthetic Student with independent random credentials in Neon Preview and a separate QA class and assignment.
3. Started two independent Playwright Chromium browser contexts and used actual application UI forms.
4. **PASS:** Student form login, Teacher form login, and each authenticated session role check.
5. **FAIL on baseline:** Student clicked the real visible Submit button; the modal remained open and a browser dialog reported `Submission NOT confirmed: Failed to execute 'fetch' on 'Window': Illegal invocation`. This is an actual application defect, not a simulated failure.
6. **Minimal fix:** change shared `ConfirmedAssignmentSubmission` default `fetchImpl` from bare `globalThis.fetch` to `(...args)=>globalThis.fetch(...args)`, preserving its receiver. No unrelated features were modified.
7. **PASS:** 7/7 focused unit tests including new browser-receiver regression on the fixed code; new Preview deployment READY.

## Follow-up Chromium test on the fixed Preview
- The first attempt to sign in to the new Preview timed out before navigation, and its ephemeral sandbox stopped unexpectedly. Therefore **this attempt was not marked PASS**.
- A second isolated Chromium environment with Linux browser dependencies was created.
- The browser successfully exercised the fixed Preview *with HTTP route mocks*, keeping Student and Teacher in **independent contexts**:
  - Student login UI form: PASS
  - Teacher login UI form: PASS
  - Student visible assignment modal and Submit, without `Illegal invocation`: PASS
  - Teacher Responses UI displays synthetic submission: PASS
  - Teacher reload still displays it: PASS
- Exact summary: `MOCKED_BROWSER_UI_PASS ["student-login-form","teacher-login-form","student-submit-modal-and-fetch","teacher-responses","teacher-reload"]`.
- These are **real Chromium DOM interactions with explicitly mocked API responses**; they are *not* authenticated end-to-end HTTP calls to live Neon.

## Prior authentic HTTP evidence
On 2026-11-17, a full authenticated HTTP E2E executed on an earlier Preview deployment with real Neon Preview: Student+Teacher login, assignment, POST receipt HTTP 201, idempotent replay 200, altered request conflict 409, wrong activity 400, Student reload, Teacher Responses reload — all PASS. See `M3-AUTHENTICATED-LIVE-HTTP-PASS-20261117.md`. That run **preceded** the minimal browser `fetch` fix.

## Cleanup and safety
- Following the UI tests, deleted **only** `__QA_M3_UI_20261117__` synthetic class, assignment, membership, linked user, sessions and two QA auth users on Neon Preview.
- Final Neon Preview query: **4 classes, 3 memberships, 0 assignments, 0 submissions, 0 QA accounts**. No live learning records deleted.
- Credentials and temporary share links are never to be committed or published; ephemeral browser sandbox must be stopped after running.

## Remaining single acceptance gate
Execute **one combined UI + authenticated real Neon Preview test on the fixed deployment** in an uninterrupted browser session: two separate real login sessions, Student visible Submit → server receipt → Teacher visible Responses → reload. Save PASS logs then remove isolated QA users/data. Only propose `M3 ACCEPTED` once this passes. No AI Assistant or Auto Designer until M3 is approved.
