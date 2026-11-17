# E-LEAP M3 — LOCKED / User-approved acceptance checkpoint

**Status:** M3 LOCKED (approved by project owner in the conversation on 2026-11-17).

**Scope locked:** Shared authenticated Student assignment → visible Submit control → Neon Preview persistence and receipt → Teacher Responses display → Teacher reload still displays the same receipt, including role-controlled access and idempotency protections.

## Sign-off basis

- Final report: [M3-FINAL-REAL-CHROMIUM-NEON-PASS-20261117.md](./M3-FINAL-REAL-CHROMIUM-NEON-PASS-20261117.md).
- Real Playwright Chromium with separate, authenticated Student and Teacher browser contexts, **six out of six UI checkpoints PASS** on the patched Preview.
- Actual Neon Preview submission receipt `03bfd4dd-47a9-456f-b71b-b459a8fbd3dc` confirmed independently by SQL before QA cleanup.
- Previous authenticated HTTP regression verified successful POST, idempotent replay, conflicting replay rejection, wrong-activity rejection, Student retrieval, and Teacher retrieval.
- P0 browser `fetch` receiver defect found and fixed at source commit `c5293c9583a5a215041b6a6a520d5a35f60782ae`, with 7/7 focused tests passing.
- Test evidence frozen at Preview feature head `1cff64b3da56d0c672fe71d121694adca6fb267f`; this checkpoint commit changes documentation only.

## QA cleanup verified

Neon Preview `br-holy-surf-b3fhwfih`: 4 pre-existing classes, 3 members, **0 assignments**, **0 submissions**, 0 QA accounts. All test fixtures, credentials, sessions and sandbox resources were removed.

## Strict boundaries

1. This approval **does not authorize** merging into GitHub `main`, promoting a Vercel deployment, or writing to Neon `main`. Production remains untouched.
2. M3 LOCKED covers the shared assignment/Responses foundation **only**. It is not a release approval for Reading U6 content, A/B/C learner publication, images, or any other course resource.
3. Preserve Role Control Contract for Teacher, Admin, Student, Guest, Presentation. No discretionary redesign.
4. New features AI Assistant and Auto Designer are a separate **post-M3** workstream requiring their own scope and acceptance criteria.
5. Future modifications that affect M3 behavior require regression testing; a proven defect may be fixed minimally with explicit evidence, without silently changing the locked contract.

## Source authorization

Project owner explicitly approved the proposed M3 closure after receiving the real Chromium + Neon PASS report. Record this checkpoint on Preview only. This note is an audit record, not a Production deployment request.
