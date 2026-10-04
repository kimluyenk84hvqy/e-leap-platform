# Strict Review — R4 RC1.1 → RC1.2

## Verdict before fixes
RC1.1 was **not ready to lock** as a universal activity contract. Syntax passed, but behavioral consistency was incomplete.

## Critical observations
- A visible button is not proof of a connected function. Controls must be capability-driven per current activity.
- Automatic scoring must never infer a denominator only from answered/correct DOM markers; it must use the full answer key where available.
- Open speaking/writing/reflection cannot be assigned a fabricated automatic numeric score.
- Reset must clear response, correctness styling, temporary submit state, and multi-round state; otherwise a second attempt is contaminated by the first.
- `presentationExpected` is a teacher model/reveal source, not automatically a student answer key.

## RC1.2 connection matrix
### U1.1
- Objective auto-grade + Check/Reset/Submit/Score: screens 6, 7, 9, 10, 11.
- Response-bearing but teacher-reviewed: speaking/open-response/homework/exit activities; Reset + Student Submit, no fabricated Score.
- Reveal/navigation/content-only screens: no misleading Student Check/Submit; Reset only where there is reversible learner interaction.
- Screen 9 matching/selection Reset retained; screens 10–11 now clear v4 inline values and correctness classes.

### U1.2
- 23 activities total.
- Objective answer-key activities use Check/Reset/Student Submit/Score, including the six-video previous-lesson activity and all `expected` / `optionExpected` exercises.
- Six-video reset restores round 1 and clears all six answers/submission markers.
- `presentationExpected` activities remain teacher/model-response tasks for Student mode: no false auto-score.
- Productive homework is submit/review, not auto-grade.

## Platform-wide rule for future content
Courses, Skills Lab, Assignments/Homework, and Mock Tests must declare activity capabilities through the same contract. Mock Tests may change feedback policy (e.g. no Check/reveal during an attempt), but must reuse the same grading result schema.
