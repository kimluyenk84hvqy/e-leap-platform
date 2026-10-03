# U1.2 MEDIA + ROLE PASS v3

Scope: preserve lesson data and approved activity logic; correct role behaviour and targeted media sizing.

Role contract checked in source:
- Student: Submit remains available on normal activities; Check performs learner checking; six-video task keeps its per-round Submit answer.
- Teacher: no Submit button; Check arms reveal mode; clicking an answer box/row reveals only that answer; reveals persist until Reset.
- Presentation: same reveal workflow as Teacher, with presentation layout.
- Reset clears reveal state for Teacher/Presentation and rerenders the activity.

Targeted media:
- Slide 1: outer hero cover card restored to approved dimensions; only book image enlarged.
- Slide 4: video enlarged; small bottom-anchored zoom crops encoded top black band while protecting bottom question text.
- Slide 10: enlarged image retained; question/input typography restored.
- Slide 16: enlarged jeans image retained; reading text kept readable.

No changes to lesson-data.js answers/content.
