# E-LEAP U6 Reading — Authentic photographs + large/bold typography / Preview-only QA

Date: 2026-11-17
Verdict: **TYPOGRAPHY AND CODE GATES PASS; PHOTOGRAPH UPLOAD AND LIVE END-TO-END REMAIN BLOCKED. NOT A RELEASE.**

## User-locked scope
- Priority 1: the **three authentic printed p.41 photos** from Objective PET B1 Reading `My first day`.
- Priority 2: **large bold legible projected typography** across all six Jigsaw activities.
- Locked baseline M3 and its Student Submit/Teacher Responses contract **must not change**.
- GitHub main, Neon main, Vercel Production must not change.

## Photo asset provenance
- Recovered exact user PDF, pages 40–43; printed **p.41 is second PDF page**.
- Source PDF SHA-256: `847f0729f0bd614ab24daf3c8b9dd21b66a01a28f249a3f30c64fbd6b5dff665`.
- Local three-image pack `U6_READING_P41_ORIGINAL_PHOTOS_REVIEW_FINAL.zip` prepared, original photographic pixels preserved.
- Mavis Carver PNG: `fd749a893ec2a46f7949c0490c93225bd72ca58276753e6abd4d01c326c2e7bb`.
- Anita Green PNG: `296e6ec023996e998b0a9e068264ae47e9b37e3c38577bfca48662253f5a9aa3`.
- Neil Johnson PNG: `a4cb1aa5db2674cec7701b28106f202ed05b40bd78832865b3398f8a2be1ab69`.
- All image checksums were independently reverified from container files this session.
- Source photos are low resolution, not AI substituted, not publicly committed into GitHub.
- **No authenticated Private Blob upload was executed**; no verified Teacher-owned asset UUIDs are available for linking into an actual U6 assignment. Studio Media upload is explicitly feature-gated by `STUDIO_MEDIA_UPLOAD_ENABLED` AND `STUDIO_MEDIA_PRIVATE_STORE_VERIFIED`. Vercel Preview project metadata contains neither variable, so protected upload was not enabled or bypassed.

## Large, bold learner screen
- Updated `reading-jigsaw.html` on feature Preview branch, commit `ce732fece43accc85f4e4d86fc5b78a7fe7b964a`.
- Learner h1: 40–56 px, 900 weight; h2 30–38 px, 900 weight.
- Passage: 25–29 px, 700 weight; Evidence passage 25–29 px.
- Step navigation: 21–25 px, 900 weight; actions 22–27 px, 900 weight.
- Prompts/questions and form fields: 23–29 px with bold weights; labels and photographed caption enlarged.
- Responsive layout (desktop 3 columns for photos; single column narrow screens). Learner shows explicit visible photo error rather than silently presenting a blank photo.
- No changes to the six-stage order, server student-assigned account isolation or existing ConfirmedAssignmentSubmission contract.

## Automated verification
- Added `tests/u6-reading-projector-typography.test.mjs` and included it in Preview's existing test workflow. CSS minimum type size, font weights, photo error handling, six-stage presence, Evidence highlight and Submit binding are checked.
- GitHub Actions workflow `43998444362` completed **SUCCESS** on `36634a00991bd6e1c2689481bed27328ec18663b`.
- Vercel Preview deployment at that exact commit: **READY**, target **preview** (not production): `https://e-leap-platform-6ccsdwwgx-kimluyenk84hvqy.vercel.app`.
- Historic A/B/C real Chromium UI test with **mocked APIs** PASS is recorded separately in `U6-READING-PRIVATE-PHOTOS-ABC-CHROMIUM-20261117.md` and does not replace a new positive Private Blob/Neon authenticated test.

## Remaining required work before U6 sign-off
1. Verify privacy/access settings of the actual Vercel Blob store for Preview, enable Studio Media uploads **only after** private upload/callback security is proven. Upload exactly these three original images as Teacher (with the matching U6 source creator ID), obtain genuine persistent asset UUIDs and confirm their SHA-256/dimensions. Do not fabricate identifiers.
2. Save the three real asset IDs into a Teacher-owned U6 Reading source draft. Directly compare A/B/C text and textbook exercises against the source scan, then attestation; no year-answer key.
3. Open deployed Preview with three genuinely authenticated Students A/B/C; verify true image bytes, access-denied tests and responsive/desktop presentation; run Jigsaw → Evidence/Why → actual Neon Preview Submit → Teacher Responses → reload, plus M3 regression.
4. Obtain U6 Teacher acceptance. Keep Preview-only until separately approved for any production release.

## Protection verified
- GitHub `main` remained `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- No SQL was sent to Neon main, no changes made to existing M3 Submit/Responses handlers, and no Vercel Production promotion.
