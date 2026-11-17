# E-LEAP — U6 Reading "My first day" — scoped Preview QA gate
Date: 2026-11-17
Verdict: **PARTIAL TECHNICAL PASS / SOURCE & REAL-BROWSER ACCEPTANCE PENDING. NOT RELEASED.**

## Freeze boundary
- Accepted foundation: M3 LOCKED, as documented in `docs/qa/M3-LOCKED-APPROVED-20261117.md`.
- Target: `feature/studio-media-library-v1` Preview, NOT GitHub main / Vercel Production / Neon main.
- At this audit, GitHub main stayed `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- No Submit/Responses framework or production changes were made in this U6-only stage.

## Observed technical evidence
1. Preview at commit `af47b2bd3f5239e67b67603b0adeb26a62b4da13` returned Vercel READY, Preview target null:
   `https://e-leap-platform-2sbeub5za-kimluyenk84hvqy.vercel.app`.
2. GitHub Actions workflow `E-LEAP M3 Preview QA` for the same commit completed SUCCESS:
   `https://github.com/kimluyenk84hvqy/e-leap-platform/actions/runs/43993917511`.
3. U6-specific frontend contains six stages: Predict, Assigned, Expert, Home, Book Tasks, Evidence & Why.
4. U6 passage is fetched from the authenticated server for only the student's allocated A/B/C account. Its public learner HTML does not embed original book passages.
5. Student working spaces exist for two individual clues, expert evidence and interpretation, and the two other readers' notes. A/B/C book-task group answers require a distinct photo choice per account and a freely estimated year/period.
6. U6-only fix `bda5efddf8d3bc0c1d2f5008f8c5eda387262729` keeps an assigned-account excerpt visible *inside* Evidence & Why, with highlighted quote and jump-to-evidence. U6-only regression test appended at `af47b2b...`.
7. The source verification endpoint refuses approval if three media asset references are missing; source text and photograph verification both must be recorded before Student access.

## Source/media status — NOT PASSED
- The earlier audit identified the genuine scanned textbook printed p.41, three accounts, three original photos, and two original exercises.
- The original local PDF and protected review photo ZIP are **not attached/mounted in this execution**. Consequently a new pixel-level check or recrop of those three images, and character-by-character sign-off of source text, were not performed here.
- Earlier review recorded residual printed lettering and coloured framing in source-photo crops. These are NOT verified clean teaching assets.
- Current learner UI asks learners to view the three photos on textbook p.41. It does **not render the three private photo assets**. The existing Studio Media endpoint is Teacher/Admin-only and is not a Student photo-delivery route. IDs alone cannot be treated as verified or student-viewable images.
- Do not check either Teacher confirmation box on the basis of this report, manufacture image IDs, or release the source.

## Browser / full-stack status — NOT PASSED for U6
- This audit inspected source and successful CI / Preview deployment status. It did **not** execute authenticated three-Student A/B/C browser runs on the deployed U6 page and did **not** demonstrate U6-specific Student Submit -> Teacher Responses -> reload against real Neon Preview.
- M3's separate real-browser success is preserved; it does **not** substitute for a new U6-specific acceptance.
- Protected Preview URL cannot be independently navigated with the current public web reader; a successful build is not evidence of successful learner interaction.

## Required finish gates
1. Reopen the actual printed p.41 PDF and three source images, recrop/remove all original printed overlays, preserve authentic photographic content, visually validate alignment/identity, upload through an authenticated verified private-media flow.
2. Provide a role-authorized Student delivery route for three approved photos and render them in the learner Reading 1 task; ensure no access to other students' A/B/C passages.
3. Reinspect A/B/C text character by character against p.41 and both book tasks; Teacher then explicitly approves media and text. Years remain open teacher-reviewed estimates, never a fixed auto-key.
4. Run a real Preview Chromium E2E for three separate assigned Student accounts A/B/C, Expert/Home notes, group photo matching, quote highlight, Wrong/Unassigned/Guest access denied, submit receipt, Teacher Responses and reload, plus M3 regression.
5. Remove only synthetic QA fixtures; verify no actual Student data was deleted; record test IDs/screenshots and source SHA/commit. Accept U6 only when all gates PASS.

## Release decision
Keep **U6 Reading in review/locked**. Keep **M3 LOCKED**. Never promote Production or merge main based on the successful CI/deployment alone.
