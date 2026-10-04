# R4 RC1.4 — Authoring Studio v1.1 Architecture Hardening

This checkpoint hardens Studio before U2.1 Golden Authoring Test.

## Changes
1. Activity Registry is the shared source of truth for activity behavior.
2. Theme Tokens centralize presets, typography and allowed fonts.
3. Smart Templates add Lead-in, Vocabulary, Grammar, Controlled Practice, Interactive Video, Speaking and Writing screens.
4. Lesson delivery policy is separated from activity definition: Practice / Homework / Mock Test / Presentation.
5. Quality Gate validates answer keys, scoring, media/accessibility and mock-test reveal conflicts.
6. Save/Version client service and Media Asset IDs prepare server persistence without tying lesson JSON to storage paths.
7. Deployment hardening: HTML/JS/JSON are network-first; media remains cache-friendly. Old E-LEAP caches are cleared on activation.

U1.1/U1.2 and Next/Previous are not rewritten in this checkpoint.
