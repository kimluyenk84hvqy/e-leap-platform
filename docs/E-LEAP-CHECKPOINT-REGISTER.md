# E-LEAP Checkpoint Register

Purpose: keep stable, security, assessment, research, lesson, and production milestones distinct. Never treat an errored deployment as a rollback baseline.

| Type | Checkpoint / evidence | Status | Keep / action |
|---|---|---|---|
| Stable | `E-LEAP_FULL_5_LESSONS_ASSESSMENT_RESEARCH_V1_FINAL (1).zip` | Full source snapshot, 2026-10-05 | **KEEP OFFLINE** as primary rollback package |
| Stable | `E-LEAP_FULL_5_LESSONS_FINAL_2026-10-05(1).zip` | Earlier full 5-lesson snapshot | **KEEP OFFLINE** as secondary rollback package |
| Security | Vercel Preview commit `16140c2` – Authentication & Access | Deployment errored; represents security/access-control work, not a stable build | Keep commit/source history; deployment may expire by retention policy |
| Assessment | Assessment/Research Data V1 contract + `submission-v2.schema.json`, `assignment-v2.schema.json`, `assessment-data.js` | Present in primary stable snapshot | **LOCK CONTRACT**; regression-test after classroom changes |
| Research | Research API/data/export foundation (`api/research/*`, research-data services) | Present in primary stable snapshot | **KEEP**; do not weaken data minimisation / IDs |
| Lesson | 5-lesson full package: U1.1, U1.2, U2.1, U2.2, Academic Skills Informal Letter L1 | Present in primary stable snapshot | **KEEP** as current lesson compatibility baseline |
| Production | `https://e-leap-platform.vercel.app/` | Current public Production alias | **PUBLIC**; promote only after Preview QA |
| Production | Vercel project admin | Private admin surface | **PRIVATE** |
| Production | GitHub repository | Source-of-truth repository | **PRIVATE / collaborators only** if repository is private |
| Classroom RC2 | Follow Teacher + Class Response Board | Added in this package as Preview candidate | **TEST IN PREVIEW FIRST**; do not promote until end-to-end class QA passes |

## Promotion gate for Classroom RC2
1. Teacher creates Live Class; QR/student join shares the same session.
2. Follow Teacher defaults ON. Student Previous/Next is disabled while locked.
3. Teacher changes screen; joined students move to the matching activity within polling delay.
4. Student submits; response reaches server with session + activity IDs.
5. Teacher Response Board defaults to the current teacher activity and shows one latest response per participant/activity.
6. Teacher can hide names and can temporarily show all activity responses.
7. Follow Teacher OFF returns navigation control to students.
8. Existing Check / Reset / Show answer / Submit / Score and Assessment/Research Data contracts still pass.

## Rollback rule
If any acceptance item fails in Preview, do **not** promote. Return to the primary Stable ZIP/source or the last known Ready Production commit.
