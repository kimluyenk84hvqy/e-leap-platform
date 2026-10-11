# R4 RC1.4.5 — Role Controls Modular Lock

Purpose: finish the role-control refactor before U2.1 so role buttons have one modular source of truth across E-LEAP.

## What changed
1. Created `assets/js/controls/` as the permanent role-control module home.
2. Moved host control implementation into `controls/host-control-shell.js`.
3. Kept `unified-lesson-controls.js` as a two-line compatibility entrypoint.
4. Moved the role matrix out of `assessment-policy.js`; that file now only re-exports the shared contract for backward compatibility.
5. Native activities consume the shared control renderer.
6. Shared authored-lesson runtime consumes the same control renderer for objective/open/reveal/poll action bars.
7. Authoring Studio Preview reads the same role model and now includes Admin preview.

## Locked contract
Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR
Admin: Teacher + Edit in Studio
Student: Check · Reset · Submit · Score
Guest: Check · Reset · Score
Presentation: Show answer · Reset · Exit Presentation

Unsupported activity actions are capability-disabled by shared code rather than improvised per lesson.

## Non-goals
- No rewrite of U1.1/U1.2 content.
- No change to locked Next/Previous behavior.
- No new scoring formula.
- No new Mock Test policy in this checkpoint.
