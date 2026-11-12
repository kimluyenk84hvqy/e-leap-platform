# Objective PET B1 — Unit 6, Reading “My first day”, book page 41 — verification fixture

**Source:** user-provided four-page scanned textbook PDF; source page 41 is page 2 in the uploaded file. PDF selectable text extraction returns empty; source must be manually transcribed/teacher-reviewed. No copyrighted passage or image committed to repository.

**Original source structure:** 3 first-day accounts marked A/B/C; photos identified by captions Mavis Carver, Anita Green, Neil Johnson. Reading task 1 asks to match each paragraph with a photograph; Reading task 2 asks to write people's names and estimate the years they began secondary school. These are **not multiple-choice exercises**. The displayed source does not establish precise calendar years; estimates must not be silently promoted to exact verified answers.

**Implementation:** `source-structure-intake.js` now parses PHOTO and PARAGRAPH A-C fields. `source-studio-review-adapter.js` creates a review-only 6-stage Teaching Combo (Look, Read A, Read B, Read C, Complete, Share). Original tasks are preserved as open responses; no guessed answer key, no auto-scoring or publication. The original page's three actual photos are not automatically imported; textbook must be shown until authorized media upload exists.

**Acceptance boundary:** this validates the Source → Studio *review-only* path. It does not meet M1 full PDF visual extraction or M3 score/submit/live runtime E2E conditions. Teacher must compare transcription against original page before using with learners.
