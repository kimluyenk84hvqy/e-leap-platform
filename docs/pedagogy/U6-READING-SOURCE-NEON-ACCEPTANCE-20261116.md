# U6 Reading — book-source audit and Preview Jigsaw integration
Date: 2026-11-16

## User-supplied source actually inspected
- Local PDF: `Objective_PET_Students_Book_with_Answers pages Objective_PET_Students_Book_with_Answers pages 39-42.pdf`. Its **second PDF page** displays printed page **41**, Reading **My first day**, three source passages A/B/C, three photos and two original exercises.
- Local transcription: `U6_My_First_Day_Studio_Source_Review.txt`. Compared its passage structure and task instructions against the rendered source page. The scanned page has no selectable text; final character-for-character sign-off remains a teacher review task.
- Local protected photo pack: `U6_Reading_Review_Local_Assets.zip`, with three photo crops. Mavis Carver (older woman), Anita Green (younger woman), Neil Johnson (man) are labelled in the page. The cropped photos still contain printed lettering and coloured page framing. **Do not distribute them as clean learner assets until recropped/verified and uploaded through an authorized media path.**
- Source Question 1: match each account to the photograph. Source Question 2: fill names and estimate start years. The book page **does not supply explicit calendar years**; keep estimates and justifications as open teacher-reviewed responses.
- The Language focus below the reading is separate from these two Reading tasks; do not silently convert it into a replacement question.

## Pedagogy and security implementation
- Teacher review retains six stages: Predict → Assigned A/B/C → Expert → Home sharing → both original Reading tasks → Evidence & Why.
- Student can be assigned only ONE A/B/C account per assignment, stored by authenticated ID in `reading_jigsaw_members`.
- All three passages are held privately in `reading_jigsaw_materials` (not in public page source or GitHub). The Student API selects **only** `accounts->>account`; guest/outsider roles are denied.
- Teacher review of book transcription AND three photo assets is required before source is released; missing media asset references force the release gate shut.
- The Student page `reading-jigsaw.html` uses an authenticated GET and `ConfirmedAssignmentSubmission` receipt. A photo selection, an exact phrase from the assigned account, a Why explanation and an estimated year/period are required. Learners can click Find evidence to highlight their phrase in the actual assigned passage.
- The general submissions POST independently repeats role, verified source, quote-in-text and original photo label validation. The server never relies on frontend hiding as authorization.
- Teacher assignment list links to Reading A/B/C setup; teacher editor stores an **unverified** draft until explicitly verified. All prompts shown to learners are learning instructions, not developer reminders.
- The schema migration was run ONLY against Neon Preview `br-holy-surf-b3fhwfih`, following a fresh READY backup `br-sparkling-bar-b3hawq4u` (parent Preview, created at LSN `0/3208990`).
- Direct SQL QA on Neon Preview: 3 synthetic students each assigned A/B/C, three synthetic submissions recorded, read back in separate queries with matching roles and Evidence/Why, duplicate request produced zero rows. All QA data was deleted transactionally, restoring 4 classes, 3 members, 0 assignments/submissions and 0 Jigsaw rows.
- Isolated Node tests and syntax checks passed on Preview, including private-account server routes and Submit.
- **Not yet an authenticated browser E2E** with a real Student and Teacher session. No approved clean media pack has been published. Leave release closed and M3 unaccepted until this is confirmed.

## Protection
GitHub main stays at `53868a0ea0e9a46982dcb95323460cd05b8a67c4`. No Neon main SQL, Vercel Production promotion, or GitHub main merge was requested or performed.
