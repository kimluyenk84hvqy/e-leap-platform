# E-LEAP GOLDEN ACCESS POLICY

Status: LOCKED FOR GOLDEN RELEASE CANDIDATE
Date: 2026-10-08

## 1. Admin
- Server authority: full platform administration.
- Includes all Teacher capabilities plus user/content/class/system administration.
- May open the fully operational Teacher workspace.
- May use read-only Student Preview for UI/flow review.
- Admin Student Preview must not create a real learner submission.

## 2. Teacher
- Operates assigned/owned classes, Live Class / QR, Follow Teacher, Assignments/Homework, Responses, Marking, Progress and Mock Test delivery.
- Cannot grant self Admin authority.
- Content governance is limited to explicit grants and protected-shell rules.

## 3. Student
### My Courses — class scoped
- Student sees only Published/Approved courses linked to active class memberships.
- Published/Approved lessons inside an enrolled course remain available after the Live Class ends so the learner can review lessons at home.
- Hidden/Draft/Archived content is not learner-visible.

### Homework — class scoped
- Student sees only assignments issued to classes in which the student has an active membership.
- Attempt limits, deadlines and late policy are enforced server-side.
- Score/rubric/feedback become visible only after feedback is released.

### Skills Lab — open learning library
- Available to signed-in students independent of class membership.
- Student may use any Published/Approved Skills Lab content at any time.
- Draft/Hidden/Archived material remains unavailable.

### Mock Tests — open learning library + controlled assessments
- Open Practice Mock: any signed-in student may use any Published/Approved open mock test at any time.
- Assigned/Scheduled Mock: Teacher/Admin may attach a mock to a class/session with deadline, attempt or scheduling controls.
- Reading/Listening should auto-score where answer keys support it.
- Writing/Speaking should enter the Marking workflow before released results appear in Student Progress.

### My Classes / Progress / Feedback
- Student sees only own active memberships, own learning record, own released feedback and own progress.

## 4. Guest
- Public/demo practice only.
- No authenticated learner record, real submission, class membership, protected feedback or progress storage.

## 5. TEST001 — QA exception only
- TEST001 is the dedicated QA student account.
- It may select/join any active class using the QA class chooser in order to test Courses, Homework, Live Class, Submission, Feedback and Progress.
- This permission must not be extended to ordinary students.
- TEST001 remains a real Student account for end-to-end QA; Admin Student Preview remains read-only.

## 6. Content publication rule
- Published/Approved: learner-visible subject to the access rules above.
- Draft/Hidden/Archived: learner-invisible.
- Live Session status must never be the sole condition for whether an enrolled student can review a published course lesson after class.

## Golden Release acceptance rule
This policy is part of the GOLDEN RELEASE contract. Code, API authorization, UI navigation and regression tests must preserve it unless a later version is explicitly approved and documented.
