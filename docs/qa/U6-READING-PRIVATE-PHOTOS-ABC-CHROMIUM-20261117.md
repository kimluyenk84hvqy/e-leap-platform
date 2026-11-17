# U6 Reading — Private photos + 3-role Chromium verification (2026-11-17)

**Acceptance verdict: PARTIAL PASS (code, security contracts, mocked Chromium UI); SOURCE PHOTOS and authentic U6 Neon E2E PENDING.**

## Frozen scope
- Only Objective PET B1 Unit 6 Reading `My first day` and its directly relevant tests and API route were changed.
- M3 LOCKED remains approved and untouched. GitHub `main` at audit: `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- Work restricted to GitHub `feature/studio-media-library-v1` and Vercel Preview target `null`. No Vercel Production promotion or Neon main writes.

## Implemented
1. `server/research/reading-jigsaw-photo.js`: authenticated Student-only GET for a photo by specific assignment+asset UUID; requires active assignment, enrolled class, assigned A/B/C member and both verified source-text/photo gates. Validates asset is one of the three approved photos, active teacher-owner Media Library record, acceptable image MIME and private Blob path. No publicly exposed Blob URL or full-text A/B/C bundle.
2. `api/router.js`: registers the isolated `research/reading-jigsaw-photo` endpoint.
3. `reading-jigsaw.html`: three original photos are rendered as authenticated image requests in Step 1; Step 5 refers to those photos. Photo source must be present and verified, otherwise Student view fails closed. Assigned passage still remains isolated.
4. `server/research/reading-jigsaw.js`: Teacher cannot record photo verification with three invented, duplicate or unavailable media asset IDs. Photo records must be active private images owned by source creator, and Teacher must explicitly attest after reviewing textbook originals.
5. `tests/u6-reading-private-photos.test.mjs`: negative-path authorization and private-image UI assertions. Preview QA workflow includes this test. Existing authorization fixtures were amended for real UUID shape.

## Objective test evidence
- GitHub CI **SUCCESS** at `ec7c65e1fc2ad8fafec57ea64d7ddf9279cc6316`:
  https://github.com/kimluyenk84hvqy/e-leap-platform/actions/runs/43995642393
- Vercel Preview **READY** at same commit, target null:
  https://e-leap-platform-7a89x77kj-kimluyenk84hvqy.vercel.app
- Isolated real Chromium browser execution in a temporary Vercel Sandbox used actual `reading-jigsaw.html` and imported `ConfirmedAssignmentSubmission`, with mocked local authenticated API and **synthetic** A/B/C passage content + placeholder images. Output:
  `CHROMIUM_MOCKED_ABC_PASS ["A_JIGSAW_EVIDENCE_SUBMIT_UI_PASS","B_JIGSAW_EVIDENCE_SUBMIT_UI_PASS","C_JIGSAW_EVIDENCE_SUBMIT_UI_PASS"]`
- Each of 3 distinct browser contexts exercised: photographs (3 img tags), assigned single passage, individual notes, expert evidence and why, two home-partner notes, all 3 group photo+estimated-year rows, visible quote highlight, Evidence & Why Submit and synthetic receipt. 3 synthetic POST bodies recorded by local mock. Zero page exceptions.
- This Chromium result validates **UI under mocked APIs**, NOT the hosted Preview with real sign-in or Neon persistence. The earlier M3 browser PASS applies to shared assignment/Responses only, not to U6.

## Unresolved gates / no-go for final approval
1. Original p.41 PDF, transcription and protected three-photo ZIP were not accessible in the current runtime or searchable Project/Library sources. No re-cropping or pixel-level inspection was possible; prior audit explicitly noted leftover printed letters and colored borders. **No clean photos were manufactured or published.**
2. The real Teacher Media Library currently supports private uploads behind a feature gate. We did not enable that feature, invent asset IDs or verify actual uploaded photo bytes. Three real original photographic assets must be inspected and attached to a private authorized source before Teacher signoff.
3. The new photo streaming route has passed negative-path contract tests only; a positive **real private-blob streaming** test with three authenticated student sessions and uploaded images remains pending.
4. Real hosted Preview Chromium authentication for 3 Students A/B/C → U6 book work → actual Neon Preview receipt → Teacher Responses and reload is **not** yet executed, because source/asset approval remains locked. No fake signoff.
5. Before U6 acceptance: inspect originals; validate image purity, identity, and page questions; verify content; enable authorized private upload if operationally reviewed; run actual positive end-to-end with ephemeral QA fixtures, obtain permission before any destructive cleanup SQL; verify M3 regression.

## Release decision
**HOLD U6 Reading publication.** Keep M3 LOCKED and Production unchanged. CI/browser mock passes are not a substitute for genuine photographed source and live Student/Teacher E2E.
