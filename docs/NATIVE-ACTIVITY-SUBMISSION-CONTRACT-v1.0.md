# E-LEAP Native Activity + Submission Contract v1.0

Production Foundation checkpoint 1.4 establishes one normalized path:

`Choose / Type / Record → Submit → Submitted → Teacher Responses → Progress`

## Boundary
- Activity content is portable and described by `schemas/activity.contract.json`.
- Submission records are independent learning data described by `schemas/submission.schema.json`.
- `assets/js/native-activity.js` renders the three first native interaction families.
- `assets/js/submissions.js` owns attempts and normalized submission records.
- `assets/js/learning-events.js` emits normalized events for research/progress consumers.
- LocalStorage is DEVELOPMENT ONLY. Production must replace the store with authenticated server-side persistence.

## Golden Reference protection
U1.1 and U1.2 remain compatibility-hosted and unchanged. They will migrate activity-by-activity only after parity QA. No fabricated student response is extracted from legacy code.

## Teacher Responses
The QA harness reads normalized submissions rather than lesson DOM. Production Teacher Responses will use the same contract via an API and permissions layer.

## Record activity
Checkpoint 1.4 proves the submission contract using a local audio reference only. It does not claim microphone capture/upload is production-ready. Secure recording/upload belongs to the Media/Submission service checkpoint.
