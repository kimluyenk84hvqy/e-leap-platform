# PB Audit — R4 RC1.6 Modular Layout Lock

## Scope
Combined package based on R4 RC1.4.5 role-control baseline and R4 RC1.5 authoring modular foundation.

## Locked behavior verified
- Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR.
- Admin: Teacher controls + Edit in Studio when permitted.
- Student: Check · Reset · Submit · Score.
- Guest: Check · Reset · Score; no learner/class submission.
- Presentation: Show answer · Reset · Exit Presentation.

## Layout
- Teacher/Admin: right smart dock with collapse state remembered locally.
- Student/Guest: bottom activity bar.
- Presentation: minimal bottom-right dock.
- Tablet/mobile: adaptive bottom bar.
- Visual-state feedback is intentionally subtle (soft accent/success, disabled opacity, small response badge).

## Modular source layout
Canonical module homes now include controls, authoring, activities, grading, assessment, themes, media, quality, runtime and live. Legacy entrypoints remain compatibility bridges where needed to protect Golden References.

## Automated checks
- JavaScript syntax: PASS.
- JSON parse: PASS.
- Static ES-module imports: PASS, zero missing.
- Static local HTML src/href references: PASS, zero missing.
- Locked role-control arrays: PASS for all five modes.
- U1.1/U1.2 lesson files unchanged from R4 RC1.4.5 baseline.
- `lessons/` tree unchanged.
- Service worker cache version bumped to RC1.6; code/JSON/HTML remain network-first.

## Required Preview acceptance before LOCK
1. Teacher/Admin right dock and collapse.
2. Student/Guest bottom bar; Score indicator is not a button.
3. Presentation only Show answer / Reset / Exit Presentation.
4. State colors are visible but not visually dominant.
5. U1.1/U1.2 and Next/Previous regressions: none.
6. Studio opens and Smart Template insertion works.
