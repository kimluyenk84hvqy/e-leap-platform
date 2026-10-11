# R4 RC1.5 — Authoring Modular Content Foundation

Purpose: finish the modular authoring foundation before entering U2.1 content.

Changes:
- extracted lesson data/model logic into `assets/js/authoring/lesson-model.js`;
- added a canonical content-block registry and responsive layout registry;
- added authoring media-reference helpers with assetId-first semantics;
- corrected Smart Templates so activities are created through the same normalized activity model as manually added activities;
- split canonical registries/services into functional folders (activities, grading, themes, assessment, quality, media) while keeping root compatibility bridges;
- strengthened Quality Gate for unsupported block types, duplicate IDs, invalid layouts and new-media assetId guidance;
- created dedicated `media/images`, `media/audio`, and `media/video` homes for new material without moving legacy Golden Reference assets;
- added an empty U2.1 Golden Authoring Test scaffold only; no source lesson content was invented.

No intended changes:
- U1.1 content;
- U1.2 content;
- Next / Previous behavior;
- official Role Control Contract.
