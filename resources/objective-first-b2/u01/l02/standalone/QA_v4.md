# U1.2 v4 — PEDAGOGICALLY ALIGNED QA

Gate: every screen checked against **Source → Content → Pedagogy → Interaction → Teacher flow → Student flow → Visual/readability**.

## Global PASS conditions
- Source order and headings remain recognisable from the supplied U1.2 PPT/course pages.
- One source exercise is kept as one E-LEAP screen whenever possible. Long exercises use internal 3-item steps, not artificial new lesson screens.
- Classroom text target is 26–28 px; Presentation mode increases core content to about 31 px and headings to 48 px.
- Teacher controls: Timer, Responses (By option / All / Spotlight concept), Lucky Number, Reveal; learner controls: Select/Type → Submit → Submitted; Check/Reset where appropriate.
- Source images are used as instructional evidence/stimuli, not decoration.
- Six embedded MP4 files from the supplied PPT are included in the Local Review package for Checking the previous lesson. No autoplay.
- The WAV found in the PPT is also preserved in the package; it is not treated as newly invented lesson audio.
- Local Review media use relative file paths. Production should move course media to private storage and keep code/lesson data separate.

## Screen-by-screen gate
| # | Source | Content | Pedagogy | Interaction | Teacher flow | Student flow | Visual | Result |
|---|---|---|---|---|---|---|---|---|
|01 Unit 1.2 cover|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|
|02 Materials|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|
|03 Aims|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|
|04 Coursebooks & References|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|
|05 Checking previous lesson|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|06 Grammar 1 discovery|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|07 Grammar 2 rules|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|08 Grammar 3 forms|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|09 Grammar 4 context|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|10 Grammar Notes degree|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|11 not as/so…as|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|12 Comparative adverbs|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|13 Transformations|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|14 Spellcheck catalogue|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|15 Spellcheck candidates|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|16 Phrasal verbs|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|17 Reading old jeans|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|18 Reading T/F|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|19 Reading vocabulary|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|20 Grammar 8|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|21 Grammar 9|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|22 Consolidation|PASS|PASS|PASS|PASS|PASS|PASS|PASS|PASS|
|23 Homework|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|
|24 Thank you|PASS|PASS|PASS|N/A|PASS|PASS|PASS|PASS|

## Media architecture decision
For **Local Review**, media are included as separate files *inside the ZIP* and referenced by relative paths from `index.html`; they are **not base64-embedded into index.html**. This keeps the review portable while avoiding a huge, fragile HTML file. For **production**, move coursebook/copyrighted images, audio and video to private media storage and update lesson-data URLs. Platform code can remain on GitHub.

## Known limitation of this Local Review
Responses/Spotlight/Lucky Number/Timer are front-end review implementations/simulations. Real multi-student response collection, identity, class progress and persistence require the production backend/class session layer.
