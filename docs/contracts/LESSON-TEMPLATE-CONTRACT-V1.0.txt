# E-LEAP Lesson Template Contract v1.0 — LOCKED

## Core principle
Every lesson is created from the shared template system. Teachers author content, choose media and activity types; the platform owns typography, spacing, responsive layout, interaction logic, controls, grading and feedback.

## Institutional cover
Every new lesson begins with an official cover containing:
- VIETNAM MILITARY MEDICAL UNIVERSITY
- FACULTY OF FOREIGN LANGUAGES
- Unit / Lesson label
- Lesson title
- Optional lecturer line and one relevant visual

## Visual identity
- Default font: Poppins.
- Default VMMU palette: Deep #1F4D3A; Fresh #2F6B4F; Accent #4F8A67; Soft #DDEBE3; Surface #F7FAF8; Text #183329.
- The green must feel fresh, deep and professional — never faded, grey-olive or dull.
- One dominant teaching purpose per screen.
- Consistency is preferred over decoration.

## Standard templates
Lesson Cover; Lesson Aims; Section Divider; Lead-in; Vocabulary; Grammar Presentation; Controlled Practice; Listening; Video; Interactive Video; Reading; Speaking; Writing; Consolidation; Homework; Lesson Closing.

## Layout presets
Hero; Standard; Media Left; Media Right; Media 40/60; Media 50/50; Three Cards; Full Media; Question + Options; Two Columns; Reading Split; Speaking Prompt.

## Reveal rule
Teacher/Admin/Presentation Show answer is item-by-item by default. The control arms reveal mode; the teacher clicks the specific question/blank/row to reveal only that item. Reveal All is never the default.

## Role controls
Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR.
Admin: Teacher controls + Edit in Studio when permitted.
Student: Check · Reset · Submit · Score.
Guest: Check · Reset · Score; no saved learner/class submission.
Presentation: Show answer · Reset · Exit Presentation.

## Authoring flow
New Lesson → Template → Add Content/Activity → Media → Preview (Teacher/Student/Guest/Presentation) → Quality Check → Save Draft → Publish.

## Architecture
Templates are structured data + layout + theme tokens. New lessons may not hard-code role controls, grading, media paths or responsive logic. Media uses assetId where possible.

## Golden authoring test
U2.1 is the first Golden Authoring Test. It must be created through Studio without lesson-specific code and must pass this contract before becoming a template reference.
