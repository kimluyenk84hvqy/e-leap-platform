# E-LEAP AI Studio Architecture v2.0 — remediation gates
Status: PREVIEW-ONLY, NO MODEL CALLS. Supersedes the v1 runtime assumptions without deleting the v1 record.

## Release principle
**No AI-generated LIFE lesson trial** until foundation gates below have real test evidence. The structure can be developed using synthetic fixtures and teacher-authored example data, not actual model-generated textbook lessons. No Production merge until separate sign-off.

## Why v1 was blocked
1. Source extraction/provenance not working end-to-end.
2. TEACHING_COMBOS, METHOD_COMBOS, hybrid/learning contract and content mapper not canonicalized.
3. Golden examples are pedagogical *exemplars*, not teacher-approved source-based lessons.
4. Proposal guard allowed arbitrary valid-looking target IDs; no source hash binding.
5. Answer verification was presence-based; fabricated explanations could appear plausible.
6. Visual/runtime acceptance unproven.
7. Teacher feedback, server-side cost guard and trusted studio permission check not operational.

## Architecture boundaries
A. **Source Intelligence**: authorized, rights-aware source manifest; verified question/answer registry; extraction artifacts with page/timestamp; never auto-trust a model.
B. **Canonical Lesson Brief**: objectives, level, schedule, exact original tasks, sources, missing slots.
C. **Method Decision**: selection by task type/goal/CEFR/length/time, with reason for chosen/not-chosen combo; no ritual multi-stage tasks.
D. **Activity Contract v2**: purpose/instruction/input/support/output/feedback/transition/outputCapture/sourceRefs per step; legacy adapters must map without altering role controls.
E. **Renderer**: existing E-LEAP Studio and runtime, visuals and media refs, item-level role gating.
F. **Deterministic source/role/version/budget guards** before AI, before teacher proposal, before apply, and at Publish.
G. **Teacher feedback/research evidence**: source hash + proposal + accepted patch + teacher corrections, privacy rules, regression suite.

## What has actually been implemented in this phase
- `assets/js/authoring/source-evidence-gate.js`: closed-form manifest and evidence status validation (metadata-only, not document semantic verification).
- `assets/js/authoring/canonical-activity-contract.js`: review-only structure and compatibility inventory; does not author runtime activities.
- `assets/js/authoring/studio-ai-contract.js`: proposal scope validation for existing lesson targets and manifest hash (in strict validation mode).
- Added negative tests for stale source, wrong targets, unapproved evidence and role leakage.

## Hardened go/no-go criteria
| Gate | Required proof | Owner |
| --- | --- | --- |
| G0 Source | Real extraction, source location, rights, teacher approval and immutable content hash | Source module |
| G1 Method | All chosen combos map to one activity contract, no missing slot or dummy answers | Studio authoring |
| G2 AI assistant | Server-enforced Teacher/Admin Studio grant, scope and hash, accept/diff/undo | API + Studio |
| G3 Runtime | Real Check/Reset/Score/Submit/Show Answer paths and permissions; no teacher data in guest responses | Shared controls |
| G4 Visual | 16:9 automated screenshots and classroom presentation acceptance; no clipping | QA |
| G5 Cost/security | Authentication, quotas, hard budget, no model key in browser, no auto retry | Server |
| G6 Research | Consent and privacy-respecting source/decision metrics | Research track |
Only after G0–G5 pass: controlled generation trial with one original, complete unit activity; then entire LIFE U12.

## Open blockers requiring further code
- Canonical contract is **not yet wired to live lesson renderer**; needs adapter and actual response storage.
- Existing default activity answer keys can be placeholders; must explicitly distinguish verified provenance in AI publish path before enabling AI.
- Server-side Studio permission helper must be implemented against authoritative grants (not just role).
- Private media upload verification currently OFF; cannot assume server can read IndexedDB-local PDFs.
- No paid AI endpoint, budget system, approval/apply/undo UI, feedback storage, or automated browser screenshot suite.
- Cross-source exactness and audio evidence need real source verification; metadata checks cannot establish semantic correctness.

## Rules for changing the system
1. One minimal Preview branch commit per coherent task; do not rewrite production shell.
2. Never turn on AI or media-upload flags to satisfy a demo.
3. Never treat Vercel READY or structural check as lesson acceptance.
4. No migration or deletion without separately verified backup and data dependencies.
