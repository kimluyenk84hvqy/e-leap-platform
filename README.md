# E-LEAP Authentication & Access Control v1 — FINAL PATCH

This is a small overlay patch for the current E-LEAP clean branch. It intentionally contains **no lesson media/video**.

## What this patch adds
- Real Teacher/Admin sign-in with email + password.
- Persistent server-side sessions stored in Neon; HttpOnly, SameSite=Lax cookie.
- Stable Student identity by Student ID, protected by Student PIN + valid live-class join code.
- Role guards: admin / teacher / student.
- Ownership guards: Teacher sees/controls own classes; Student sees own enrolled classes/assignments/submissions.
- Server-side protection for Classes, Live Sessions, Live Responses, Assignments, Submissions, Marking, Research Export.
- Research export remains pseudonymous and consent-filtered.
- Legacy `/api/research/users` open identity creation is disabled.
- Persistent login throttling: 8 failed staff logins in 15 minutes locks the email for 15 minutes.
- One-time Admin bootstrap protected by environment secret.

## Required Vercel environment variables
Set for Preview + Production before first setup:

- `E_LEAP_ADMIN_BOOTSTRAP_KEY` — long random secret used only for first Admin creation.
- `RESEARCH_PSEUDONYM_KEY` — long random secret dedicated to research pseudonymization.
- Existing Neon variable remains supported, e.g. `RESEARCH_DB_URL_DATABASE_URL`.

Recommended also:
- `E_LEAP_SESSION_SECRET` — reserve a long random app secret; used as pseudonym fallback only if `RESEARCH_PSEUDONYM_KEY` is absent.

## First deployment
1. Overlay this ZIP at repo root on the current clean branch.
2. Deploy Preview.
3. Open `/api/research/bootstrap` with GET. Expect `ok:true, ready:true`.
4. Open `/auth-setup.html` once and create the first Admin using `E_LEAP_ADMIN_BOOTSTRAP_KEY`.
5. Open `/admin-users.html` as Admin and create Teacher account(s).
6. Teacher signs in at `/login.html`.
7. Open `/teacher-live.html`, create a class/session, and scan the QR.
8. Student joins at `/student-access.html` using Join Code + Student ID + Student PIN.

## Important compatibility note
Authentication uses new non-destructive tables `auth_users`, `auth_sessions`, `auth_class_members`, `auth_login_attempts` so it does not overwrite the earlier Research Data v1 identity tables.
Existing pre-auth test classes are not automatically claimed by a new authenticated Teacher account. For the acceptance test, create a fresh class after sign-in.

## Lock criterion
This patch has passed static/source audit only. Do **not** label the milestone LOCKED until live E2E passes all scenarios in `AUTH-ACCESS-CONTROL-V1-AUDIT.md`.
