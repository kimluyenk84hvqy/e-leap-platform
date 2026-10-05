# E-LEAP Assessment + Research Data v1 — FINAL UPLOAD

This is the hardened final upload package for the Assessment + Research Data v1 milestone.

## Locked workflow
Assignment lifecycle: Draft/Active → Student submit → Submitted → Teacher grade → Graded → explicit feedback release → Feedback Released.

## Included
- Server-side assignments/homework.
- Attempt-numbered submissions; historical attempts are not overwritten.
- Multiple attempts are exposed in the Student UI until the assignment limit is reached.
- Writing Core rubric: Task Fulfilment, Organisation, Vocabulary, Grammar, Style/Register (10 points).
- Speaking Core rubric: Task Achievement, Fluency & Coherence, Vocabulary, Grammar, Pronunciation (10 points).
- General 100-point marking.
- Criterion-level teacher marking and feedback.
- Feedback hidden from Student API responses until explicitly released.
- Research events: assignment.created, assignment.submitted, grading.saved, feedback.released.
- Research CSV export requires teacherId, is de-identified, excludes non-consented submissions, omits names/Student IDs and raw metadata, and uses server-side HMAC pseudonyms.
- Identified research export is disabled in v1.
- Research event export only includes participants with consented assignment evidence and does not export raw event metadata.

## Hardening added in FINAL
- Assignment creation validates that the class belongs to the teacher.
- Assignment updates require teacher ownership.
- Grading requires the assignment teacher.
- Rubric marking validates every criterion and its allowed range.
- Student submission requires class membership and an active assignment.
- Student feedback endpoints suppress score/feedback/rubric details until release.
- Unfiltered assignment/submission/research exports are blocked.
- Submission payload and free-text fields have size limits.
- Research pseudonyms use HMAC-SHA256, keyed server-side.
- Service-worker cache version bumped to prevent mixed-version deploys.

## Upload
Upload the CONTENTS of this package to repository root on branch `e-leap-clean-v1`, overwriting matching files.

Suggested commit:
`Lock Assessment Research Data v1 FINAL`

## Required post-deploy acceptance test
1. Classes → create a class.
2. Start Live Class → Student joins by QR/Student ID.
3. Teacher creates a Writing assignment with `writing-core-v1` and an attempt limit of 2.
4. Student submits Attempt 1, then submits Attempt 2.
5. Teacher sees both attempts separately.
6. Teacher scores all five rubric criteria and saves without release.
7. Student My Feedback must show “Marked · feedback not released yet” and must not receive score/feedback in the API payload.
8. Teacher releases feedback.
9. Student sees score + feedback.
10. Research submissions CSV must contain only consented rows and no name/Student ID/raw metadata.
11. Research events CSV must contain no name/Student ID/raw metadata.

## Security boundary
This milestone hardens assessment ownership, feedback privacy, consent filtering and research exports. The wider E-LEAP platform still uses its current preview-role / teacher-ID identity architecture rather than a full authenticated account system. Therefore this package is FINAL for the Assessment + Research Data v1 workflow, but a future Authentication & Access Control milestone is still required before treating a public multi-user deployment as security-complete.
