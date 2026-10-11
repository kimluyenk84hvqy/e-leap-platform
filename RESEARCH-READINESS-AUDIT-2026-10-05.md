# E-LEAP Research / Assessment Readiness Audit — 2026-10-05

## Ready for classroom use when Research DB is configured
- Classes API: create, rename/update, archive/restore status.
- Start Live Session: class + lesson + teacher -> session + unique join code.
- QR / Join: QR resolves to `join.html?code=...`; participants can join by code/name/student information supported by the join flow.
- Live Responses: `response.submitted` learning events from Student live sessions are persisted to the Research DB events table and are visible to Teacher Live.
- Five lessons are selectable in Teacher Live: U1.1, U1.2, U2.1, U2.2, Informal Letter L1.

## Implemented but NOT yet research-grade / production-final
### Marking
- Teacher Submissions page supports score + feedback review.
- Current generic submission/grade store is localStorage-based (`assets/js/learning-core.js`, `assets/js/submissions.js`).
- Live event answers/scores can reach Research DB through events, but teacher marking itself is not yet persisted as a dedicated server-side grading record.

### Rubrics
- Writing/Speaking authoring model supports rubric/criteria fields and quality gate warnings.
- There is not yet a complete criterion-by-criterion rubric marking UI + server-side rubric score storage for all skills.

### Homework / Assignments
- Homework delivery policy and assignment/submission model exist.
- Current assignment/homework persistence is still local development storage; there is no complete Research DB assignments/submissions/grades schema and API yet.

### Research dataset completeness
- Research DB currently has classes, sessions, participants, and learning events.
- It does not yet have normalized server-side tables for assignments, submissions, rubric criterion scores, teacher feedback revisions, or final released grades.
- Therefore interaction/session data collection is usable now, but longitudinal assessment/marking data collection is not yet complete enough to call the ministerial-research data layer FINAL.

## Next platform milestone recommended
`E-LEAP Assessment + Research Data v1`
1. Server-side assignments table.
2. Server-side submissions / attempts table with Submit Count semantics.
3. Rubric definitions + criterion scores for Writing/Speaking/Reading/Listening as applicable.
4. Teacher marking / override / feedback / release records.
5. Homework deadline / attempt / status tracking.
6. Research export with anonymised learner key, class, lesson, activity, attempt, score, rubric dimensions, timing, and feedback history.

This audit intentionally distinguishes working classroom features from research-grade persistence so the platform is not declared complete prematurely.
