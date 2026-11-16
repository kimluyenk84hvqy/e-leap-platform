# U6 Reading — Teacher Review A/B/C acceptance (2026-11-16)

## Current test result
- Committed a teacher-only A/B/C review projection for the **unverified** Objective PET B1 Unit 6, Reading *My first day*, p.41.
- The six-step Jigsaw flow is preserved: Look & predict → Individual reading → Expert group → Home group → original book tasks → Evidence & Why.
- The existing A/B/C picker in Authoring Studio now uses the role projection to show exactly the chosen assigned-account text or Expert question. Other account blocks are omitted **from the rendered review**, while the original draft remains unchanged.
- At the Home/Complete stages, every review role sees the shared group task and both original textbook questions.
- The projection refuses unsupported roles, stages and verified/published input; no answer keys are fabricated.
- Verified against the actual Preview branch via isolated Node command: **15/15 tests pass, 0 fail**, plus `node --check assets/js/authoring-studio.js` passes.
- Review-only UI label explicitly says this is **not live learner access**.

## Boundaries — do not promote as an actual learner feature
This projection does not enforce Student access permissions, group membership or persisted Responses. It operates on a local Teacher Studio review draft, not a secure Student API. The provided source is a scanned page with paragraphs A/B/C and three photo captions; the exact passages and real photos still need direct teacher verification. Calendar years are subjective estimates and must not be auto-graded. The source text and textbook images are not committed to the public GitHub repository.

## Remaining acceptance
1. Teacher verifies the source transcription, images, page mapping and original tasks from the textbook PDF.
2. Build server-authenticated group/role assignment and individual text isolation before any student release.
3. Confirm Student Submit → Neon → Teacher Responses → Reload on Preview using real QA sessions.
4. Only then request publication approval; GitHub main, Vercel Production and Neon main remain untouched.
