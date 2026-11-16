# M3 Final Technical Gate — 2026-11-16

## Decision
**TECHNICAL GATES PASS; LIVE AUTHENTICATED ACCEPTANCE PENDING. M3 IS NOT PRODUCTION-LOCKED.**

## Real executed evidence
- On isolated Vercel Sandbox, latest Preview source committed as `425e62b2fa6b67fc7c33dbe6707d247365ee5694`.
- Runtime/payload/schema/assignment ownership/modal tests: **20 tests passed, 0 failed**.
- Actual submissions API-handler module executed under Node VM with stubbed session-auth actors and in-memory SQL adapter: **1 integration test passed, 0 failed**.
- Integrated case exercises: Student request → receipt → same request ID replay → modified response rejected (409) → wrong activity rejected (400) → Teacher Responses → teacher reload → Student reload → unauthenticated request denied (401) → other teacher denied (403) → teacher POST denied (403). No actual HTTP login or Neon call in this integrated test; the SQL/auth boundaries are test doubles.
- Previously recorded direct Neon Preview migration, persistence and uniqueness checks passed. No production branch touched.
- Vercel Preview is deployed; `GET /api/research/bootstrap` previously verified `submissionsReady=true` and `previewDatabaseBindingVerified=true` on actual runtime.
- QA accounts were removed from previous smoke attempt. Last read-only Neon Preview state: 4 classes, no assignments/submissions, **zero teacher accounts**. Hence live Student/Teacher HTTP QA cannot be claimed as executed.

## Scope-bounding: One final gate (not new feature work)
Provision ONE synthetic Teacher account and ONE synthetic Student (not real learner) via authorized Preview Admin UI, one QA class and one active assignment with a valid resource/activity ID.
Provision the eight QA environment secrets directly in GitHub Actions `preview-qa` (never in chat or source).
Set repository variable `ELEAP_QA_E2E_ENABLED=true` only for the run; push a no-op change to Preview, triggering the authenticated job. Run with no credential logging.
Save the authenticated job PASS evidence and independently inspect Teacher and Student pages in two browser sessions. Verify same receipt after reload.
Disable the variable afterward; remove only synthetic QA records from Neon Preview.
**Only then propose M3 ACCEPTED for explicit user review.** Never merge/publish to Production based on technical test PASS alone.

## Risk/control
- GitHub main pinned at `53868a0ea0e9a46982dcb95323460cd05b8a67c4`.
- Neon main `br-bitter-rice-b35yfm8y` untouched.
- The integration test is intentionally labelled mock-auth/mock-SQL; any claim that it proves real Teacher login is false.
- Freeze further M3 feature additions; fix only failing acceptance scenarios.
