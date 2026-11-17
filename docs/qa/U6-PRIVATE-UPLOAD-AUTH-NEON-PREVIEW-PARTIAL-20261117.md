# E-LEAP U6 Reading — authenticated Preview QA and private media gate

Date: 2026-11-17
Status: **PARTIAL PASS / U6 NOT RELEASED** — verified original photo upload and U6 real Submit→Teacher Responses→Reload remain pending.

## Source and photo assets
- PDF: `Objective_PET_Students_Book_with_Answers pages Objective_PET_Students_Book_with_Answers pages 39-42(1).pdf`, PDF page 2, printed page 41.
- Original photographs: Mavis Carver, Anita Green, Neil Johnson. Original PNG SHA-256 and dimensions documented in `docs/qa/U6-P41-SOURCE-IMAGE-REVIEW-20261117.md`.
- Local upload pack created, not committed publicly: `ELEAP_U6_P41_PRIVATE_MEDIA_UPLOAD_PACK.zip`, with 3 original PNG, 3 same-source Q82 WebP derivatives, and a manifest. Pack SHA-256: `52bf80be440aa4032b9fd4801ad04f2ba3875548b0eed244196858afd7663d9b`.
- The local pack cannot be read directly from the remote Vercel sandbox by the current connector interface. **Do not claim it was uploaded**.

## Preview private storage configuration
- Verified Vercel Blob store `store_u4AgJ1AqUMRUMMz2`, private access, connected to project `prj_rSWRb3QTc8Li9ArcOAjh3RDxbrwF`.
- Added branch-scoped Preview-only env `STUDIO_U6_PRIVATE_UPLOAD_ENABLED=true`, `gitBranch=feature/studio-media-library-v1`. Not targeted at Production.
- New dedicated `api/u6-photo-upload.js` performs **server-side Blob put({access:'private'})**, Teacher/Admin authentication, Same-Origin checks, exact source-photo hash allowlist, PNG/WebP magic check, image dimensions for PNG, Blob head metadata verification and owner-bound `studio_media_v1` registration. It refuses production environment and mismatched store ID.
- Existing generic `api/studio-media.js` client upload remains **disabled**. No unsafe generic client-upload activation.
- Teacher `reading-jigsaw.html` has three file pickers, Upload button and resolved Media Library asset IDs for source draft. Student route already requires correct class, assigned A/B/C and verified source/asset IDs before streaming images.

## Actual authenticated QA against deployed Preview + real Neon Preview
- QA uses **dedicated synthetic Preview-only identities**, never actual learner accounts: one Teacher and three Students, separate QA class `d6611062-672a-4bf8-9c7d-7d9d37af9c20`. Their auth sessions are server-generated and time-limited; do not publish session tokens.
- **Four real server auth checks PASS**, HTTP 200 from `/api/auth/me` with expected Teacher/Student roles, on Vercel Preview.
- Dedicated U6 private photo POST rejected an intentionally invalid image with **HTTP 422** and correct message. This proves exact-content server validation; it does **not** prove a positive private Blob upload.
- Authentic A/B/C source draft and textbook's two original Reading questions were submitted to real Neon Preview through Teacher API. Initial save failed due to Neon JSONB JS-array serialization; fixed minimally in U6-specific `server/research/reading-jigsaw.js` by serializing four JSONB parameters. Retest: **source draft HTTP 200 PASS**.
- Assigned three separate authenticated Students A/B/C via Teacher API; all **200 PASS**.
- Three real Student requests for U6 account texts returned **423 SOURCE_REVIEW_REQUIRED** as expected while no photo assets exist (release gate works). No unapproved textbook content was released.
- Verified Neon Preview SQL for QA assignment `d763be6e-3a27-4d1a-95e0-658060610e27`: source page 41, 3 accounts, 3 labels, 2 questions, 3 member assignments, 0 asset IDs, text/photo verification both FALSE.
- CI `https://github.com/kimluyenk84hvqy/e-leap-platform/actions/runs/44000940365`: **SUCCESS** at `2f35cf9218922fa23f556fbba3a34db153175bde`.
- Immutable Vercel Preview at the same commit: **READY**, target Preview only: `https://e-leap-platform-1jj7u85a4-kimluyenk84hvqy.vercel.app`.
- Prior mocked-API real Chromium A/B/C walkthrough PASS, but **no real authenticated Chromium full-stack E2E** can be certified without uploaded and approved photo bytes.

## Remaining no-go gates
1. Transfer the authentic photo files through the authenticated Teacher upload UI to the *actual* Vercel Private Blob. Confirm three genuine asset IDs in `studio_media_v1`, private Blob `head` response, MIME, expected SHA-256 and Student authorized image stream. No placeholder media IDs.
2. Have Teacher verify actual page-41 text and photographs and explicitly confirm both reviews in source editor. Year estimates remain open responses.
3. Run actual Student A/B/C → all six Jigsaw stages → exact Evidence & Why quote → authentic Neon Preview Submit receipts → Teacher Responses → reload and ensure M3 regression passes; inspect desktop and mobile font readability.
4. Archive only synthetic QA records with explicit cleanup approval after acceptance.

## No-release decision
**U6 Reading remains blocked (source gate false). M3 LOCKED remains untouched. GitHub main, Neon main, and Vercel Production were not changed.** No fake upload, fabricated receipt, or unjustified PASS claim.
