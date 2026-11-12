# E-LEAP Studio — Hybrid AI Architecture v1.0 (Preview design)

**Status: ARCHITECTURE / NON-EXECUTING.** This specification does not enable AI calls, install a model dependency, set API credentials, change database schemas, or authorize automatic publishing.

## 1. Product decision
Two modes share one governed pedagogical engine:
- **AI Auto Designer:** teacher selects an authorized source set, learning goals, learner level and constraints, then requests a complete *draft proposal*.
- **AI Assistant:** teacher gives a natural-language instruction scoped to the current lesson, screen, step, or block; AI returns only the proposed changes for that scope.

Both modes are Teacher/Admin Studio capabilities, not Student/Guest or lesson-presentation capabilities. Teacher sees preview and can approve individual changes; Admin authorizes publication under existing policy.

## 2. Existing implementation and integration points
Source inspection 2026-11-12, Preview branch `feature/studio-media-library-v1`:
- `studio/index.html` loads `assets/js/authoring-studio.js`; Studio verifies `/api/auth/me` and an edit grant client-side.
- `assets/js/authoring/lesson-model.js` uses lesson schema 1.2 with screens, blocks and activities.
- `assets/js/authoring/teaching-combo-registry.js`, `method-combo-catalog.js`, `certified-templates.js` and `quality/quality-gate.js` own method sequencing, templates and quality.
- `assets/js/authoring/resource-bank-assembly.js` currently stores imported assets in browser IndexedDB.
- `server/_auth.js` exports `requireAuth`, `getAuth`, and `requireSameOrigin`. Important: `requireAuth` checks roles but does NOT, by itself, check Studio edit grants. AI endpoints must authorize editor capability **server-side** using an authoritative grant check.
- `api/studio-media.js` private uploads remain OFF until private-store verification.
- Current `package.json` has no AI SDK or model provider dependency.

Do not replace the Studio model, shell, teacher role contract, storage design, or production branch for the AI integration.

## 3. Data and trust boundaries
```text
Teacher/Admin (Studio, grant-verified)
  -> POST /api/studio-ai/prepare (preflight; no model call)
  -> Source manifest and extraction / provenance checks
  -> AI orchestration server (budget + permission + schema)
      -> one canonical lesson brief (cache by source SHA-256 + prompt/schema version)
      -> Auto Designer OR Assistant scoped proposal
      -> JSON proposal contract + deterministic validation
  -> Review panel: original | proposed | source citations | missing evidence
  -> Explicit teacher accept/reject (non-AI deterministic patch applied to DRAFT only)
  -> Existing Quality Gate + 5-role previews
  -> Existing authorized Publish flow, never model-initiated
```

Never expose model credentials to client, localStorage, IndexedDB, lesson JSON, shared bundle, logs or screenshots. No arbitrary file URL fetching; sources must be from authorized lesson/resource manifests with identity and ownership checks.

## 4. Canonical source manifest
Each resource entry carries `assetId`, owner/permission, `sha256`, kind (pdf/pptx/docx/image/audio/text), lesson association, page/slide/time locator, OCR/extraction status, license/use notes and review state. Verified textbook question and answer keys must be distinguished from model suggestions. Local-only IndexedDB assets are **not** silently sent to a remote model. Their explicit teacher-approved transfer requires a verified private, access-controlled upload pipeline. Until that is available, Auto Designer accepts only teacher-verified extracted text or authorized source references available to the server.

For every factual claim derived from a source, retain source locator. Audio answers/evidence require checked transcript/actual audio. An AI guess is not an authoritative transcript, answer key or quotation.

## 5. Two request flows
### Auto Designer
1. Teacher chooses sources, Unit, CEFR, learning aims, class profile and selected teaching combos.
2. Build/lookup a canonical **Lesson Brief**, with evidence map and unresolved source slots.
3. Model generates a **structured lesson proposal**, not HTML/slides or database writes.
4. A deterministic mapper creates candidate sections/screens/steps and reuses existing functional templates. Keep one dominant learner purpose per visible screen, allow staged combo states.
5. Quality Gate checks exact textbook fidelity, activity outputs, actual interactions, visual density, min typography and teacher-only answer access.
6. Teacher previews and accepts selected proposals into an isolated draft; publishing is separate.

### AI Assistant
1. Teacher selects exact scope `lesson|screen|step|block` and writes instruction.
2. Backend sends only the least necessary source excerpts, template contract and scoped draft. No other student/course data.
3. Model returns typed suggestions with before/after, rationale, sourceRefs and explicit uncertainty.
4. Apply ONLY after teacher accepts and the draft version still matches (optimistic concurrency); never update unrelated slide IDs.
5. Undo and provenance history are required.

## 6. Minimal proposal data contract
```json
{
  "schemaVersion": "studio-ai-proposal-v1",
  "mode": "auto-designer",
  "scope": { "lessonId": "lesson-123", "screenId": null, "stepId": null },
  "baseDraftVersion": 4,
  "sourceManifestHash": "sha256:...",
  "suggestions": [
    {
      "id": "p1",
      "kind": "suggest-activity",
      "targetId": "screen-1",
      "instruction": "Read paragraph B. Underline two reasons.",
      "expectedOutput": "Two text-based reasons",
      "languageSupport": "The writer says ...",
      "sourceRefs": [{ "assetId": "book-1", "locator": "p.34 task 2", "status": "verified" }],
      "reviewStatus": "requires-teacher-approval"
    }
  ]
}
```
AI response is untrusted *proposal data*. Server validates JSON shape, limits count/size, rejects unsupported operation kinds and source IDs, preserves institution branding and locked roles, never treats `sourceRefs.status` reported by AI as independently verified. Clients render text escaped. The apply service does not execute code from a proposal.

## 7. Non-negotiable controls
- **Server authorization:** teacher/admin plus effective Studio edit permission, validated from server-authoritative grants. Tenant/owner checks for every lesson and source; deny by default.
- **Feature flags default false:** `STUDIO_AI_ENABLED=false`, `STUDIO_AI_AUTO_DESIGNER_ENABLED=false`, `STUDIO_AI_ASSISTANT_ENABLED=false`, `STUDIO_AI_REMOTE_SOURCE_ENABLED=false`. Production remains off until a separate reviewed release.
- **Budget:** per-user and per-workspace daily requests; max input/output tokens; max cost per job/day; reject when budget is exhausted. Inspect usage, cache hits and projected cost before running. No retry loop on provider failures.
- **Source reuse:** cache by authorized source content hash + extraction version + brief schema/prompt version; invalidate on change. Repair one step not a whole deck. Use smaller model for classification/extraction, stronger model selectively when rationale is required; price/model selection is a runtime configuration, not hard-coded.
- **Safety:** no remote arbitrary URLs, no prompt execution from uploaded books, no student PII unless separately consented and purpose-limited. Redact sensitive identifiers from research logs; define retention/deletion policy.
- **Governance:** deterministic source/evidence gate, answer keys checked against textbook, no fabricated transcript, teacher approval mandatory, no model publication privileges, no arbitrary API tools/write access.
- **Resilience:** abort and return existing draft unchanged on timeout/schema failure/provider outage; do not block non-AI Studio; preserve backup/export options; no DB migration in initial phase.
- **Audit:** capture request mode, lessonId, scoped target, source manifest hash, prompt/schema version, model ID, token usage, estimated cost, review outcome, content version and (when enabled) pedagogy outcome tags. Do not store raw learner PII in prompt logs.

## 8. Role contract stays LOCKED
Teacher: Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR.
Admin: same plus Edit when permitted.
Student: Check · Reset · Submit · Score.
Guest: Check · Reset · Score, no submissions.
Presentation: Show answer · Reset · Exit Presentation.
AI design controls appear in Studio only, not projected lesson slides. AI cannot rename, rearrange or bypass role functions.

## 9. Rollout / acceptance
**P0: no-cost architecture** — document and verify source adapters, proposal JSON contract, permissions, mock flows and tests; AI flag OFF.
**P1: Preview-only assistant** — one scoped text instruction on a fixture lesson, mock provider first; server checks grant, size limits and budget; accept/reject/undo; measured cost.
**P2: Preview-only Auto Designer** — LIFE Unit 12 pilot with verified sources; source brief, teaching combo selection, template mapper, quality gates, teacher review; no automatic publish.
**P3: evidence and research** — intervention labels, traceable teacher decisions, outcome instruments and quality metrics; only aggregate consented student records. Separate production go/no-go.

Required tests:
1. Anonymous/student/guest cannot call AI endpoint; unauthorized teacher cannot call it even with a forged client role.
2. Flags off: no model calls, no provider costs, Studio continues normally.
3. Assistant modifies only chosen block; stale draft version rejected.
4. Model tries to invent evidence, answer key, media path or additional permissions: rejected or explicitly flagged as unverified.
5. Accepted output passes existing contract and can be undone; published lessons remain unaffected.
6. Full deck preview at 16:9, all role controls unchanged and all media references resolved.
7. Repeated identical brief reuses cache; telemetry shows actual tokens/cost and budget enforcement.

## 10. Decision record
- APPROVED DESIGN DIRECTION: Hybrid Auto Designer + AI Assistant.
- NOT YET IMPLEMENTED: model route, keys, editable UI panel, real source extraction, paid invocation, persisted proposal store, automated tests for runtime.
- DO NOT claim full AI Studio is live from this architecture commit.
