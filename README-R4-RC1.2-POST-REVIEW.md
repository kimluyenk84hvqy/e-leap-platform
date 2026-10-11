# R4 RC1.2 — Post-review Activity Controls + Grading

Strict review of RC1.1 found four architectural issues and fixes them at the shared contract/adapters rather than per-button patches.

## Findings fixed
1. U1.1 legacy grading could collapse a partially completed multi-item activity to a binary whole-screen result. RC1.2 calculates full-denominator counts for objectively gradable U1.1 activities (screens 6, 7, 9, 10, 11).
2. U1.1 Reset did not clear v4 inline inputs/classes on screens 10–11 and did not fully restore homework submit state. Reset now clears those states.
3. Shared host controls were visible by role only, not by the capability of the current activity. RC1.2 adds per-activity capability negotiation so Check/Reset/Submit/Score only appear where meaningful.
4. U1.2 treated `presentationExpected` as student-auto-checkable. Student Check is now reserved for objective `expected` / `optionExpected`; teacher/presentation reveal remains available for model answers.

## Locked semantics
- Check = local grading only; never submits.
- Reset = restore the current activity response state; never changes Next/Previous.
- Submit = save the latest state of the same attempt.
- Partial work: score denominator is the full objective item count; blanks are unanswered and score 0.
- Guest: Check/Reset/Score where applicable, never learner-state Submit.
- Student: Submit only on response-bearing activities.
- Productive/open tasks: no fake automatic score; submit for teacher/rubric review.
- Teacher/Presentation: model/reveal tools remain separate from student auto-grading.

## Golden Reference scope
U1.1/U1.2 content and Next/Previous navigation are not redesigned. Changes are limited to shared controls, adapters, reset completeness, and grading/capability contracts.
