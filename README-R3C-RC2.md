# R3C RC2 — Unified Actions + Responses Hub

Baseline: **R3C RC1**. This checkpoint extends the host-owned shared controls without rebuilding U1.1/U1.2 and without changing lesson-owned Next/Previous.

## Delivered
- One role-aware top action group owned by the lesson host.
- Student: shared **Submit** action delegates to the current lesson/activity Submit control through `ELEAP_LESSON_HOST_API`.
- Student: temporary **Submitted ✓** acknowledgement at host level; the lesson keeps its own activity state and feedback.
- Guest: **Guest Practice** status plus `Practice only · not saved`; learner response/draft/check/progress events are not persisted by the host.
- Teacher/Admin: shared **Presentation**, **Timer**, and **Responses** actions.
- Admin: shared **Edit in Studio** action remains available.
- Responses Hub now restores locally persisted Preview responses for the current lesson and shows participant, activity, time, response summary, and score when supplied by the lesson bridge.
- Responses counter counts submitted **student** responses only. Guest practice events never appear in the teacher response count/hub.
- Presentation remains transient and role-gated.

## Locked / untouched
- U1.1 and U1.2 remain Golden References.
- Lesson-owned Next/Previous behavior is untouched.
- Existing activity logic, answer reveal logic, media, and slide layouts are untouched.
- No Class / QR / Live Session implementation in R3C RC2. Those belong to R4.

## Preview storage boundary
R3C RC2 deliberately uses the existing browser-local Preview event sink. The Responses Hub therefore shows responses available in the same Preview browser. Cross-device/class live aggregation is deferred to R4 Class / QR / Live Session and its server/session transport.

## QA acceptance
1. Guest opens U1.1/U1.2: sees Guest Practice; no Student Submit; no Teacher tools; practice interactions work; learner response/progress events are not persisted.
2. Student opens U1.1/U1.2: sees Student + Submit; Submit delegates to the visible current activity control; no Teacher tools.
3. Teacher opens U1.1/U1.2: sees Presentation + Timer + Responses; no Student Submit.
4. Admin additionally sees Edit in Studio.
5. Responses counter/hub includes only student `response.submitted` events for the current resource.
6. Next/Previous behavior remains exactly as before.
