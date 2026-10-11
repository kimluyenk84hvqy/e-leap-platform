# Audit — R4 RC1.4.5 Role Controls Modular Lock

## Result
PASS for static/source audit before Preview verification.

## Checks completed
- 69 JavaScript files: syntax PASS.
- 45 JSON files: parse PASS.
- 53 relative ES-module imports checked: 0 missing.
- Locked role matrix smoke test: Teacher/Admin/Student/Guest/Presentation PASS.
- Capability model smoke test: unsupported controls are disabled by shared model rather than redefined per lesson.
- U1.1 resource tree unchanged byte-for-byte from the current baseline.
- U1.2 resource tree unchanged byte-for-byte from the current baseline.
- `lessons/` unchanged byte-for-byte.
- `engine/lesson-host.html` unchanged byte-for-byte.
- Existing `unified-lesson-controls.js` import path retained through a compatibility re-export.

## Important architecture outcome
The permanent control implementation now lives under `assets/js/controls/`. Runtime, native activities and Studio Preview read the same contract/resolver. This removes the prior duplicate role matrices from `assessment-policy.js` and Authoring Studio.

## Locked role contract
Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR
Admin: Teacher + Edit in Studio
Student: Check · Reset · Submit · Score
Guest: Check · Reset · Score
Presentation: Show answer · Reset · Exit Presentation

Preview deployment is still required as the final browser confirmation because browser-only DOM/media behavior cannot be fully validated by static syntax/import checks alone.
