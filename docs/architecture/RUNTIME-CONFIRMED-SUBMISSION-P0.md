# E-LEAP Submission Reliability — Preview-only P0 containment
- Uses existing `/api/auth/me`, `/api/research/assignments`, `/api/research/submissions` (no new database schema).
- Never calls POST without explicit assignment ID, resource ID, activity ID and authenticated Student identity, and exact active assignment for that student.
- The only success signal is server response with actual submission ID, matching assignment, submitted status, valid attempt.
- Disable the UI Submit while awaiting server acknowledgment. On failure show NOT CONFIRMED, preserve response, do not auto-retry or emit `response.submitted`.
- The existing Neon API writes remain on the server. No Neon DB modification performed for this checkpoint.
- **Residual risk:** cross-device concurrent POST is not yet idempotent because `server/research/submissions.js` computes MAX(attempt_no)+1. This is not solved by client button lock. Add server-side idempotency + transactional concurrency control on a dedicated Neon Preview branch and test before M3 acceptance.
- **Residual risk:** typed/choice answers are not source verified by this integration; grading status remains unconfirmed. Do not convert any raw student answer into trusted score.
- Review-only source material must never enter the published learner Runtime.
- Production branch and Neon main must remain unchanged.
