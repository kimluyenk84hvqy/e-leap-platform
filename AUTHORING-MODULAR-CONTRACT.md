# E-LEAP Authoring Modular Contract — LOCK CANDIDATE

This checkpoint modularizes the authoring foundation before U2.1 content entry.

## Canonical functional homes

- `assets/js/controls/` — role controls and classroom controls.
- `assets/js/authoring/` — lesson model, content blocks, layouts, media references.
- `assets/js/activities/` — activity registry and activity definitions.
- `assets/js/grading/` — scoring and attempt semantics.
- `assets/js/themes/` — theme and typography tokens.
- `assets/js/assessment/` — Practice / Homework / Mock / Presentation delivery policy.
- `assets/js/quality/` — publish-time quality gate.
- `assets/js/media/` — media records and media resolution helpers.
- `media/images/`, `media/audio/`, `media/video/` — new local/static media homes.

Root-level legacy JS module names remain compatibility bridges only. Existing lessons are not migrated in place.

## Authoring rule

Teachers author structured content. They do not code controls, scoring, reset, submit, reveal, role behavior or media routing into individual slides.

## Media rule

New content should prefer `assetId` references. Direct `src` paths remain supported for Golden References and legacy lessons until a controlled migration is performed.

## U2.1 rule

U2.1 will be the first Golden Authoring Test created from this modular authoring model. The included scaffold contains no fabricated lesson content; approved source content must replace the placeholder.
