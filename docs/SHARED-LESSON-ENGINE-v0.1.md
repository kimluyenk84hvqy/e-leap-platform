# E-LEAP Shared Lesson Engine v0.1

Checkpoint goal: prove one canonical lesson resource can be opened from E-LEAP and also through its own standalone URL without duplicating the resource record.

## Implemented
- Registry-driven lesson resolution by stable Resource ID.
- Unit 1 now resolves U1.1 and U1.2 from `data/resources.json`.
- Shared `engine/lesson-host.html` host route.
- Standalone URL remains available for each Golden Reference.
- No changes to approved U1.1/U1.2 lesson content.
- Copyright status remains AMBER/private-until-cleared.

## Compatibility boundary
U1.1 and U1.2 contain approved legacy interaction runtimes. v0.1 therefore mounts those runtimes through an isolated compatibility adapter inside the shared host. This is a migration bridge, not the final rendering architecture. New lessons must target native shared activity renderers. Golden References will migrate activity-by-activity only after parity tests pass.

## Next gate
Build native activity adapters and event contract: `lesson.open`, `activity.start`, `response.submit`, `activity.complete`, `lesson.complete`, with Student/Session/Resource/Activity/Attempt/Timestamp identifiers. Do not remove standalone packages until native parity is demonstrated.
