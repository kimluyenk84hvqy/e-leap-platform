# E-LEAP GOLDEN READINESS — 2026-10-08

Target: **E-LEAP GOLDEN RELEASE 1.0 – OPERATION READY**

## PASS / LOCKED
- Unified sign-in with server-authoritative roles.
- Admin full authority; Admin can operate Teacher workspace.
- Student access policy: Courses/Homework class-scoped; Skills Lab/Mock Tests open library when Published/Approved.
- TEST001 is QA-only and may choose/test across active classes and see all Published/Approved courses.
- Homework backend ownership and submission rules.
- Student score/feedback hidden until release.
- Marking/grade API ownership and release semantics.
- Shell catalog server persistence.
- Recovery packaging workflow present (`.github/workflows/eleap-recovery-packages.yml`).
- Main DB migration applied for `must_change_password`, `platform_shell_state`, `research_feedback` and indexes.

## INTENTIONAL DEPENDENCY
- Supabase private-media signing remains an active dependency for legacy/private lesson media. Do not pause/delete Supabase until private media is migrated to another signed-media service and regression-tested.

## FINAL BLOCKER BEFORE GOLDEN 1.0
### Mock Tests end-to-end
The shell hierarchy is present, but the currently Published mock-test library does not yet contain a fully operational assessment resource proving the complete path:
1. Student opens an Open Practice Mock.
2. Reading/Listening objective items auto-score.
3. Writing/Speaking responses enter Marking Center.
4. Teacher/Admin saves grade and optionally releases feedback.
5. Student sees only released feedback.
6. Scores feed My Progress.
7. Assigned/Scheduled Mock can apply class/window/attempt rules without changing the open-library policy.

GOLDEN 1.0 must not be stamped until this path passes.

## FINAL REGRESSION GATE
After Mock Tests pass, run one final role smoke test:
- Admin: all governance + Teacher operations.
- Teacher: owned classes, Live, Homework, Marking, Progress.
- Student: own class/course/homework/data only; Skills Lab/Mock open library.
- Guest: public practice only; no saved learner submissions.
- Mobile: sign-in, navigation, lesson controls, submission buttons.

## RELEASE RULE
Only after all gates pass:
- stamp GOLDEN commit,
- generate fixed Core package,
- generate dynamic Content package,
- retain DB/media/restore manifests,
- record commit SHA, DB schema version, dependency list and checksums.
