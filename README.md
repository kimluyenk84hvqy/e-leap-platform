# E-LEAP Teacher Live UUID Identity Fix

Purpose: fix Teacher Live falsely reporting `Research database unavailable` even though `/api/research/bootstrap` and `/api/research/classes` are healthy.

Root cause confirmed from live diagnostics:
- Research DB bootstrap: PASS.
- Classes API: PASS.
- Existing `classes.teacher_id` values are UUIDs.
- Older Teacher Live stored local teacher IDs as `teacher-<uuid>`, which is incompatible with UUID-backed class/session queries.

Changes:
- Teacher Live now uses a plain RFC-4122 UUID for `teacherId`.
- Existing incompatible `teacher-...` IDs are migrated automatically on first load while preserving the teacher name.
- Error messaging now surfaces the actual client/API message instead of collapsing everything to `Research database unavailable`.
- No lesson, assessment, database schema, or QR API changes.

Upload `teacher-live.html` to repository root on branch `e-leap-clean-v1`, overwrite the existing file, deploy, then hard refresh.

Suggested commit:
`Fix Teacher Live UUID identity for Research DB`

Expected test:
1. Open Live Class / QR.
2. Status should become `Live database ready`.
3. Create a new class.
4. Create Live Session.
5. Join Code + QR should appear.
