# Assessment + Research Data v1 — Locked Contract

## 1. Assignment lifecycle
Draft/Active → Student submit → Submitted → Teacher grade → Graded → Feedback release → Feedback Released.

## 2. Attempts
Each submission has an immutable attempt number. Re-submission creates the next attempt and never overwrites previous evidence. Attempt limits are enforced server-side and reflected in the Student UI.

## 3. Productive-skill marking
Writing and Speaking are teacher-marked. E-LEAP must not fabricate automatic scores for open productive work.

## 4. Rubrics
Writing Core v1 (10): Task Fulfilment 2; Organisation 2; Vocabulary 2; Grammar 2; Style/Register 2.
Speaking Core v1 (10): Task Achievement 2; Fluency & Coherence 2; Vocabulary 2; Grammar 2; Pronunciation 2.
General v1: direct score out of 100.
All rubric criteria are required for a valid rubric grade and server-side range validation is mandatory.

## 5. Feedback privacy
A teacher may save a grade without releasing it. Student-facing API responses must not expose score, rubric scores, or feedback until `feedback-released`.

## 6. Research logging
Assessment events: assignment.created, assignment.submitted, grading.saved, feedback.released. Existing lesson/live events remain available operationally.

## 7. Research export
Default export is de-identified and consent-filtered. It excludes student name, Student ID, raw metadata, and identified exports. Pseudonymous research IDs are generated server-side using keyed HMAC. Event export excludes raw payload metadata and only includes participants for whom consent evidence exists.

## 8. Ownership / integrity
- Assignment create/update: teacher must own the class/assignment.
- Grade: grader must be the assignment teacher.
- Submission: learner must be associated with the assignment class.
- Unfiltered assessment/research reads are not permitted.

## 9. Ethics boundary
Operational storage does not itself authorize research use. Institutional approval, consent language, retention periods, data-access governance and deletion procedures remain research-governance responsibilities.

## 10. Platform security boundary
The current platform does not yet implement full authenticated user accounts. Assessment + Research Data v1 is functionally locked within the existing E-LEAP identity architecture; production-grade authentication/authorization remains a separate milestone.
