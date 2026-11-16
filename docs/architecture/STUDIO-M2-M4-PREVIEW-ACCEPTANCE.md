# E-LEAP AI Studio M2 + M4 Preview — Acceptance checkpoint

## Scope
Preview-only integration into **Studio Properties** on a `sourceReviewDraft` screen. U6 PET Reading p.41 is the real pedagogical use case. No AI model/provider is called. Source passages and original photographs remain outside this Git repository. No change to production/main or published content.

## M2: Teaching Method Review
`authoring/studio-review-workbench.js` evaluates a candidate reading method against source structure and class constraints:
- Three original independent A/B/C accounts must exist, with preserved assignment labels.
- Both source textbook tasks must remain present.
- Expert-group Jigsaw requires **at least six learners**, so each account can have two expert peers.
- Minimum 20 minutes for individual / expert / home / textbook tasks / evidence phases.
- Emits why-this-method reasoning and warnings for incomplete photo assets / source trust; `canPublish=false`.
- Cannot claim the AI selected a method: this is a deterministic domain-rule baseline.

## M4: Scoped Instruction Editing
The teacher types one proposed revision for one step of the current U6 review draft.
- The system calls existing `validateProposalAgainstDraft` with an assistant proposal restricted to the selected step.
- It previews before/after. **Only explicit Approve** applies an immutable copy; Reject does nothing; Undo reverts the last approved change.
- Safeguards check lesson/step IDs, draft version, original step text, and SHA-256 of source metadata + source-content blocks.
- Application increments draft version; source blocks, questions and answer keys are never modified.
- Browser-provided SHA-256 is an integrity check for review, **not server-authenticated source approval**.
- Local review remains local-storage-only; existing Quality Gate blocks Publish while `sourceReviewDraft` exists.

## Tests and exclusions
Added `tests/studio-review-workbench.test.mjs` for method-fit/refusal, preview/accept/undo, unchanged originals, stale version, wrong source fingerprint and source drift.
A Vercel READY build + deterministic JavaScript checks are **not** full browser E2E, AI model, protected server API, Student Submit or authenticated Group/Responses acceptance.

## Next safe integration
1. Browser E2E of U6 import → Studio → M2 recommendation → M4 preview, reject, approve, undo → reload draft.
2. Trusted server-side source approval and permissions; establish verified evidence before objective scoring.
3. Complete authenticated Student group assignments, submissions and teacher Responses on shared Runtime.
4. Add actual AI provider behind rate/budget/permissions controls, ensuring proposed outputs pass the same immutable review gates.
5. Auto Designer (M5) remains a review-only planner until M1/M3/M2/M4 acceptance.
