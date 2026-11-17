# E-LEAP QA FOUNDATION V1 — APPROVED STANDARD

Approved 2026-11-17. Pilot: Objective PET B1 U6 Reading — My first day.

Scope: Preview only, branch feature/studio-media-library-v1, Neon branch br-holy-surf-b3fhwfih. M3 LOCKED, GitHub main and Production unchanged.

Use four persistent synthetic QA identities (Teacher, Student A/B/C), normal application login with separately managed credentials, no shared real learner accounts, no authentication bypass. Keep QA class and submissions separate from research data. Credentials must never appear in repository, logs or reports.

Acceptance gates: AUTH (four real sessions); MEDIA (three authentic source photographs, authorized bytes and SHA verification); UI (large bold text, no clipping, desktop/mobile); PEDAGOGY (six Jigsaw stages, assigned passage isolation, Evidence & Why); SUBMIT (three actual distinct student receipts); RESPONSES (Teacher sees same three records); RELOAD (durable persistence after navigation/reload); M3 regression. Record exact Preview deployment, receipt identifiers, actual test scope and failures. No mock test substitutes for deployed E2E. No production release without separate approval.

Implementation status: standard approved; permanent credential enrollment and pilot deployed E2E pending. U6 must not be marked ACCEPTED until all gates pass.
