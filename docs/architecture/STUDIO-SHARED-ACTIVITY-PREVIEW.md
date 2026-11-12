# Shared Native Activity Smoke Mount — Reading Review (Preview)
After source intake handoff, Studio's teacher-only Properties panel mounts the existing `ELeapNativeActivity` with `type:'type'`, mapped from the original ungraded Reading discussion block.
- This reuses `controls/control-shell.js`, the shared activity renderer and its Reset behavior.
- The preview is constructed without an answer key, student identity, session or submission; it does not claim verified grading.
- It does **not** modify learner-facing screen data, grant student access, enable publishing or create a new runtime.
- The panel is only in the authenticated teacher/admin Studio authoring experience. It is not an end-to-end test of Student Submit/Responses or classroom rendering.
- Source review drafts remain browser-local and blocked by the shared Quality Gate.
Next acceptance: build explicit verified MCQ conversion after a trusted server approval workflow, then test end-to-end with browser automation.
