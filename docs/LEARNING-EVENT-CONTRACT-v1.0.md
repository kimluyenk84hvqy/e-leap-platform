# E-LEAP Learning Event Contract v1.0

Status: FOUNDATION CONTRACT — ready for Golden Reference migration.

## Purpose
A lesson is portable content. Student learning history belongs to the central E-LEAP data layer. Every native activity therefore reports a normalized event rather than writing scores/progress into the lesson package.

## Identity boundary
- `resourceId`: stable identity of the canonical lesson/resource.
- `activityId`: stable identity inside that resource.
- `studentId`, `sessionId`: supplied by authenticated E-LEAP context; never authored into lesson content.
- `context`: where/how the resource is being used (classroom, self-study, assignment, mock test, standalone).

## Initial event vocabulary
`lesson.opened`, `lesson.closed`, `activity.viewed`, `response.drafted`, `response.submitted`, `attempt.checked`, `media.played`, `media.completed`, `progress.updated`, `feedback.created`.

## Research-ready rule
Raw events are append-only evidence. Derived Progress/Gradebook views are computed from events/submissions; they are not the canonical evidence record.

## Compatibility rule for U1.1/U1.2
Golden Reference runtime remains untouched while migration is in progress. The host may record platform-level `lesson.opened`/`lesson.closed` events with `source=compatibility-bridge`. Activity-level events become authoritative only when that activity is migrated to a native E-LEAP renderer. Do not infer fake responses from legacy DOM.

## Privacy rule
The development sink is browser-local and contains no real student identity. Production persistence must use authenticated server/API storage and permissions before real student data is collected.
