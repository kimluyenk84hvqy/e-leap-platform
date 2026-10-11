# E-LEAP Production Foundation v1.0 — MASTER PASS Acceptance Checklist

Status: MASTER PASS CANDIDATE — requires UI acceptance test on Vercel Preview.

## Required acceptance flows
1. Teacher: Courses → Objective First B2 → Add Unit → Unit 2 → Add Lesson → U2.1 → Add Resource/BG.
2. Teacher: Advanced Skills → Writing → Essay Writing → Add Opinion Essay → Add BG.
3. Teacher: Skills Lab → Writing → Essay Writing → Opinion → Add Practice Set.
4. Teacher: Classes → New Class → New Learner → Enroll → Assignments → New Assignment → Student submits → Submissions → Review → Score + Feedback.
5. Student Preview: management controls hidden; Courses / Skills Lab / Assignments / Mock Tests / Classes / Feedback / Progress remain learner-facing.

## Cross-cutting gates
- Contextual shell controls: Add, Rename, Move, Move Up/Down, Hide/Show, Duplicate, Archive, Add Resource.
- Persistence: shell/resource/learner/class/assignment/submission changes survive browser refresh in Preview (localStorage adapter).
- Clean UI: no architecture/developer explanation copy on normal operational surfaces.
- Responsive: desktop/tablet/mobile layouts remain usable.
- No merge to main until all gates pass.

## Production boundary
This candidate uses browser-local persistence for management and learning workflow previews. Authenticated multi-user persistence, real file storage, QR generation and concurrency/load handling remain backend implementation work and are not represented as completed Production backend features.
