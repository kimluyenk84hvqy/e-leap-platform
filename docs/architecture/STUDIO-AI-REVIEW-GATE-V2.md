# AI Teaching Studio Foundation — Review-Only Patch & Answer Provenance Gate

Status: Preview-only additive modules. **AI not wired; no remote model calls or production changes.**

## New safeguards
- `studio-ai-contract.js` now exposes `validateScopedInstructionProposal`: assistant may propose one scoped screen instruction only via dedicated adapter; reject arbitrary target, wrong source hash, wrong lesson version, unauthorized edit types.
- `ai-instruction-review.js` provides pure preview, explicit approval apply-to-new-draft, and versioned undo; no storage writes or implicit acceptance.
- `ai-candidate-gate.js` enforces provenance for AI-authored objective activities. Existing placeholder `answerKey` is **never** evidence of correctness. Only human-approved evidence registry/manifest statuses pass this metadata gate.
- Negative tests verify placeholder rejection, wrong scope/hash, stale version, human approval, and undo.

## Outstanding blockers
These modules are **not yet integrated** into Studio UI, server endpoints, shared publish API or production runtime. `teacher-approved` metadata must be issued by an authenticated, authorized server workflow; client-supplied labels must never be trusted. Real evidence semantics (text quote/recorded audio), textbook task fidelity, font/layout screenshots, and role security need separate integration tests. No live AI generation or unit pilot is authorized.
