# Foundation Lab — M1 Source Structure & M3 Interactive Runtime (Preview-only)
Scope: Preview Studio `/studio/?view=foundation`. Requires existing Studio permission; no new endpoints, no paid model calls, no data migrations.

## Implemented
- `source-structure-intake.js`: deterministic line-aware intake for *teacher-extracted text* with explicit UNIT, TASK, PASSAGE, Qn, A)-D), KEYn and AUDIO markers. Parses lesson structure, original task/questions/options and input line numbers. Marks every supplied key and audio reference as **unverified**, identifies missing material, never guesses answers.
- `foundation-lab.js`: isolated 3-phase Read → Answer → Compare DOM runtime with selectable preview roles, actual clickable radio inputs, Next/Previous, Check, Reset, Score and teacher/presentation-only Show answer **for synthetic bundled fixture only**. User-pasted answer keys are never scored or revealed as verified. No persistence or learner submission.
- `authoring-studio.js`: authorized Studio-only Preview route and visible navigation to Foundation Lab.
- Regression tests cover extraction, missing audio, synthetic checking, unanswered denominator and untrusted-key refusal.

## Important limits / NOT accepted yet
**M1 partial:** This is not PDF/PPT/audio extraction and does not use LLM. It requires teacher-extracted structured text. Correct matching of text to an original scanned textbook must be independently reviewed. Line markers are locations in pasted content, not authoritative page locators.

**M3 partial:** A functional isolated interaction lab is **not** the shared, production-grade role-controlled Studio lesson runtime. Student Submit, Responses, Live Class/QR, persistence, certified presentation interaction, per-activity scoring and browser-driven E2E tests have not passed. The synthetic fixture simulates source-verified keys solely for automated/UI demonstration. No publication or real learners.

## Next acceptance gates
1. Trustworthy PDF/PPT/media extraction and source/page alignment with bounded size and private access.
2. Canonical adapter linking structured activity into Studio blocks and shared authorized runtime; per-step response persistence.
3. Server-trusted evidence registry; never accept teacher-approval metadata directly from client.
4. Full automated browser E2E across Teacher/Admin/Student/Guest/Presentation, including Check/Reset/Submit/Score/Show answer.
5. Visual 16:9 screenshots, 26px+ instructional text where appropriate, no spill/blank panels.
6. Explicit review and sign-off before M1 or M3 is marked complete.
