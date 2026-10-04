# E-LEAP Role Control Contract — OFFICIAL / LOCKED

This is the platform-wide source-of-truth contract before U2.1. Lessons provide content, answer keys/model answers, responses and capability metadata; lessons do not invent their own role-control layout.

| Mode | Locked controls |
| --- | --- |
| Teacher | Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR |
| Admin | Teacher controls + Edit in Studio / content administration when permitted |
| Student | Check · Reset · Submit · Score |
| Guest | Check · Reset · Score; never submit into learner/class records |
| Presentation | Show answer · Reset · Exit Presentation |

## Locked semantics
- Check = evaluate the current activity state without submitting it.
- Reset = restore the current activity to its initial state.
- Show answer = Teacher/Admin/Presentation only.
- Submit = Student submission into Responses/Progress.
- Score = correct / total / percentage; unanswered remains in the denominator.
- Teacher/Admin classroom controls stay grouped in one stable area.
- Presentation is intentionally minimal.
- When an activity does not support a contracted action, the platform disables/hides it by one shared rule; individual lessons may not improvise their own role UI.

## Modular source ownership
All role-control source now lives under `assets/js/controls/`:
- `role-control-contract.js` — immutable role matrix and semantics.
- `control-registry.js` — stable labels/action metadata.
- `teacher-controls.js`, `admin-controls.js`, `student-controls.js`, `guest-controls.js`, `presentation-controls.js` — role modules.
- `control-shell.js` — shared resolver/render model used by runtime and Studio.
- `host-control-shell.js` — host toolbar behavior for Golden References and authored lessons.

`assets/js/unified-lesson-controls.js` is now only a backward-compatible re-export, so existing lesson-host imports do not break.

## Scope
The contract is consumed by:
- lesson host / Golden Reference adapters;
- shared lesson runtime for authored lessons;
- native activity runtime;
- Authoring Studio role previews;
- future Courses / Skills Lab / Assignments / Mock Tests delivery shells.

U1.1/U1.2 content and locked Next/Previous behavior are not rewritten by this refactor.
