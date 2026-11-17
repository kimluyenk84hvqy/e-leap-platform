# U6 Reading — 6-stage Jigsaw Preview QA pass (2026-11-17)

## Scope and evidence
- Objective PET B1 Unit 6, book page 41, **My first day**. User-supplied scanned page and teacher transcription were inspected; two original tasks are photograph-to-account matching and open estimates of years starting secondary school.
- Original printed names: Mavis Carver, Anita Green, Neil Johnson. No fixed year key appears on that page. The separate Language focus section is not substituted for Reading tasks.
- Original photograph crops were revisited. The three source crops retain printed labels and decorative border; tighter **local-only teacher-review** crops remove printed names but crop parts of faces/frames. They have **not** been approved or uploaded to shared Media Library.
- The source is still flagged unverified in the authoring workflow. Avoid publishing student-accessible full textbook passages or image assets to the public GitHub repo.

## Implemented on Preview only
- `reading-jigsaw.html` now gives the Student **six interactive Jigsaw stages**, not only static instructions: (1) Look & predict, (2) Individual reading for assigned account, (3) same-account Expert group, (4) Home group exchange, (5) both original Reading exercises collaboratively completed for A/B/C, (6) Evidence & Why and Submit.
- Learners record two clues, expert-group evidence/explanation, each partner's shared clue, and a confirmation of two-way teaching/listening.
- Before Submit, the learner must supply those note fields and check that the home group exchange occurred. The group task requires three names/photographs and three estimated years, each photograph used exactly once.
- The learner's own matching name and year in Evidence & Why must agree with the A/B/C group worksheet.
- Evidence highlight still searches only the **one passage provided by server authorization**. Submitted response now includes the three group outcomes; the common M3 locked Submit contract is **not changed**.
- Working notes use browser `sessionStorage` scoped to assignment and user and are removed after successful Submit. This is a client learning aid, not a verified collaborative synchronization engine. A group must still share verbally; no automated cross-device synchronization is claimed.

## Tests
- Preview source/API regression suite: **22/22 PASS** on the previous stage commit.
- Added final checks of required Expert and Home notes: **4/4 focused PASS**.
- True Chromium DOM interaction on READY Preview **with mocked API responses**: `U6_CHROMIUM_JIGSAW_PASS`, confirming all six stages render; early Submit blocked; completing individual, expert, home and book tasks allows Submit; Evidence highlights a phrase; exactly one POST; payload includes A/B/C.
- **No authenticated U6 Reading A/B/C end-to-end with real Neon content and three independent learners has been performed on this feature.** The existing M3 foundation was separately locked after real-authenticated browser acceptance; do not conflate these.
- The photo pack is PRIVATE TEACHER REVIEW, not publication approval. The source-text/photo verification gate is unchanged and must stay closed until approved.

## Acceptance decision
**Teacher Preview Jigsaw interaction PASS; U6 CONTENT RELEASE NOT APPROVED.**
Neon main, GitHub main, Vercel Production not modified. Keep M3 LOCKED intact.
