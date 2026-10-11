# E-LEAP GOLDEN 1.0 — AI-Assisted Marking Policy

Status: LOCKED FOR GOLDEN RELEASE 1.0

## Core principle

AI is an assessment assistant only. Teacher/Admin remains the final decision-maker for Writing and Speaking assessment.

## Required workflow

1. AI may analyse a Writing or Speaking submission and produce a suggested score, rubric-level comments, error analysis, and draft feedback.
2. AI suggestions are advisory and must never become the learner's final score automatically.
3. Teacher/Admin must review the submission and may accept, edit, replace, or ignore any AI suggestion.
4. The authoritative score is the Teacher/Admin Final Score, not the AI Suggested Score.
5. AI must never release a score or feedback to a learner.
6. Only an authenticated Teacher/Admin with the required class/assessment permission may approve and release the final result.
7. After a Teacher/Admin finalises a score, AI must not overwrite or mutate that final score.
8. Every final save/release must record the human reviewer identity and relevant timestamps for auditability.

## UI contract

Where AI assistance is available, the marking interface should clearly separate:

- AI Suggested Score / AI Draft Feedback
- Teacher/Admin Final Score / Final Feedback
- Approve / Release to Student

The interface must not present AI output as if it were the official grade before human approval.

## Writing

AI may assist with rubric-aligned analysis such as task achievement/response, coherence and cohesion, lexical resource, grammatical range and accuracy, language errors, and draft feedback. The Teacher/Admin decides the final score and final feedback.

## Speaking

AI may assist with transcript/audio analysis, fluency, lexical resource, grammatical range and accuracy, pronunciation/communicative effectiveness, and draft feedback. The Teacher/Admin decides the final score and final feedback.

## Release rule

A result may become visible to the learner only after explicit Teacher/Admin release. AI alone can never trigger release.

## Audit rule

The operational record should preserve at minimum:

- human reviewer user ID
- final score
- final feedback
- graded timestamp
- feedback release timestamp

AI suggestions may be stored separately for traceability, but they are never the authoritative assessment record.

## GOLDEN 1.0 interpretation

If AI assistance is unavailable, human marking continues normally. AI assistance is an optional accelerator and must not be a dependency for completing, grading, releasing, or recovering an assessment.
