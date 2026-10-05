# E-LEAP Teacher Live · Server Identity Fix

This patch fixes the remaining Teacher Live class-creation failure after the Research DB and classes API were confirmed healthy.

Root cause addressed:
- Teacher Live was inventing a local UUID and using it directly as `teacher_id`.
- The existing Research schema treats `classes.teacher_id` as a real server-side `users.user_id` and may enforce a foreign key.
- A locally invented UUID therefore cannot reliably create classes/sessions.

Changes:
- Teacher Live first creates/recovers a real teacher user through `/api/research/users` using a stable preview `externalAuthId` stored locally.
- It then uses the returned server `user_id` for class and session operations.
- Class loading is scoped to that server teacher identity.
- Adds an explicit `+ New class` button so class creation is no longer hidden inside a dropdown option.
- Existing class selection and new-class mode are clearly separated.
- Real API errors are shown as `Create failed: ...` for further diagnosis if necessary.
- No database schema changes.
- No lesson files changed.

Upload `teacher-live.html` to repository root on branch `e-leap-clean-v1`, overwriting the existing file.

Suggested commit:
`Fix Teacher Live server identity and new class flow`
