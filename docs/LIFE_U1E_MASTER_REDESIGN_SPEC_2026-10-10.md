# E-LEAP Life A2-B1 · Unit 1E Personal Information
## Master Redesign Specification — 2026-10-10

Status: REVIEW BUILD SPEC
Branch: life-u1e-master-redesign-20261010
Base checkpoint: a0a640d3cfd3e98bdcb7af346aa3ece0bbf5b390

## 1. Quality gate
This lesson is not final merely because it runs. It must be classroom-ready, visually refined, pedagogically coherent, interactive, and strong enough to become the design template for later lessons.

Design direction:
- modern, premium, clean, visually calm;
- fresh deep military green as primary brand direction, supported by white/cream/light neutral surfaces;
- restrained accent colors only where they improve hierarchy or interaction;
- natural, high-quality, realistic imagery whenever possible;
- no repetitive stock/cartoon sets across slides;
- large classroom-readable typography;
- every screen must fit comfortably without vertical scrolling in normal desktop presentation;
- images support the learning task and never dominate the screen.

## 2. Locked platform contract
Do not duplicate or rename shared platform controls.

Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR
Admin: Teacher controls + Edit in Studio/content administration where permitted
Student: Check · Reset · Submit · Score
Guest: Check · Reset · Score
Presentation: Show answer · Reset · Exit Presentation

Teacher workflow must support both:
1. inspect learner responses in Responses/Response Board;
2. return to the slide and reveal the correct answer in place.

## 3. Live Class / QR
- Live Class / QR available throughout the lesson.
- Teacher slide is authoritative in live mode.
- Students follow the teacher slide.
- Student Next/Previous and keyboard navigation remain disabled during teacher-follow mode.
- Join flow must preserve class/session context.

## 4. Responses / Response Board
- All answerable screens participate in the shared Responses runtime.
- Student responses must be attached to screen/item identifiers.
- Teacher can inspect individual responses before revealing answers.
- Do not replace the shared Responses engine with lesson-specific code.

## 5. Show Answer behavior
- Show answer is available to Teacher/Admin/Presentation on every screen that has answerable content.
- Reveal must be in-place, not a detached answer panel.
- For text-entry boxes, the answer appears in the same box/answer area used for the task.
- Student interface never receives teacher-only reveal controls.
- Reveals persist until Reset according to the locked platform behavior.

## 6. Visual and typography rules
- Classroom body text target: 26–32 px equivalent, larger when content permits.
- Major activity prompts: 34–44 px equivalent.
- Screen title hierarchy must remain visibly stronger than task text.
- Do not place large decorative images beside already dense task text.
- Prefer one dominant visual idea per screen.
- Keep sufficient whitespace.
- Part buttons/tabs must be large, legible, balanced, and clearly active/inactive.

## 7. Slide-specific redesign

### Slide 3
Goal: listening/visual response task.
- Replace oversized/mismatched image set.
- Create/select new natural images that match the actual audio content.
- Number every image clearly.
- Place one answer box directly below each image.
- Teacher: Show answer reveals the correct answer inside each corresponding box.
- Student: types directly into each box.
- Response Board receives each item response separately.

### Slide 4
- Same interaction standard as Slide 3.
- Image set must not simply recycle Slide 3 visuals.
- Images must correspond tightly to the audio/text prompt.
- Keep the entire task visible without scrolling.

### Slide 5
Part architecture must be corrected.

Part 1:
- 4 distinct images.
- 4 answer boxes, one directly below each image.
- all 4 image+box pairs visible on one screen.

Part 2:
- 3 distinct images.
- 3 answer boxes, one directly below each image.
- all 3 image+box pairs visible on one screen.

Requirements:
- Part 1 and Part 2 must not repeat the same items.
- Teacher Show answer works per box.
- Student responses map to individual items.
- Part selector stays above the visual task area.

### Slide 6
- Add a meaningful visual aid rather than decoration.
- Increase text size substantially.
- Reduce text density where possible without changing required learning content.
- Visual aid must support comprehension and classroom explanation.

### Slide 7
Current activity pattern is pedagogically repetitive and should be replaced.
Do not repeat a simple type-the-job / tick-the-job pattern.
Use a higher-cognitive-interaction task such as:
- infer the occupation from clues;
- classify jobs by evidence/attributes;
- match person + workplace + task and justify;
- odd-one-out with short justification.

Preferred direction: clue-based job inference with one short justification response.
This screen must feed Responses and support Teacher in-place answer reveal.

### Slide 8
- Replace or strongly refresh the repeated image set.
- Images must be smaller and better balanced with the task.
- Avoid visual repetition from Slides 3–7.
- Preserve a distinct interaction purpose.

### Slide 9
- Use a different visual approach from Slide 8.
- Do not reuse the same pictures unless pedagogically necessary.
- If split into Part 1 / Part 2, distribute items evenly or as evenly as content allows.
- Part divisions must represent meaningful task chunks, not arbitrary UI grouping.

### Slide 10
- Remove repeated pictures.
- Use text-first presentation.
- Increase font size substantially.
- Reveal/present one sentence at a time rather than showing a dense block of sentences.
- Teacher controls pacing; previously revealed sentences may remain visible according to cumulative reveal behavior.

## 8. Remaining lesson screens
Every remaining screen must be reviewed for:
- content fidelity;
- visual hierarchy;
- image relevance;
- image variety;
- font size;
- classroom readability;
- interaction quality;
- answer availability;
- Response Board compatibility;
- Teacher vs Student role correctness;
- presentation pacing;
- no unnecessary scrolling.

Any screen that only 'works' technically but is visually weak, repetitive, difficult to teach from, or unsuitable as a reusable template remains FIX, not PASS.

## 9. Media policy
- Heavy media should not be committed redundantly to the repository if shared/private media delivery is available.
- Media references must use the platform media resolver/manifest approach.
- New pictures must be matched to actual audio/task content before approval.
- Avoid the same visual set across consecutive screens.

## 10. QA definition of done
A screen is PASS only when all are true:
- content correct;
- layout fits classroom screen;
- text large enough;
- image appropriate and aesthetically consistent;
- interaction works;
- Student input works where required;
- Teacher Check works where applicable;
- Teacher Show answer works in place;
- Reset works;
- Responses receives submitted answers;
- Presentation mode is usable;
- Live Class / QR remains available through shared platform controls;
- no regression to locked role contract.

The lesson is APPROVED only when every screen passes this gate.