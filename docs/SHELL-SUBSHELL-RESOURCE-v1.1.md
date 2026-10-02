# E-LEAP Shell → Sub-shell → Resource Layer v1.1

This is an additive upgrade on Production FULL v1.0. Course presentation and Golden Reference lessons are retained.

## What changed
- Skills Lab now opens real nested shells: Domain → Skill → Level → Practice Sets → Resource.
- Assignments now has Assignment Library, Active Assignments, Submissions, Review & Grading, Archive.
- Mock Tests now opens Domain → Test Track/Test Type shells, including VSTEP Full Mock + four skill sections.
- Progress now has Student/Class/Course/Skill/Self-study/Assignment/Mock/AI/Teacher/Learning History/Analytics shells.
- Generic shell renderer reads `data/shells.json`; nesting depth is not hard-coded.
- Empty terminal shells explicitly accept future resource: BG, PDF, audio, video, link, activity.

## Media
The GitHub-safe package intentionally does not contain restricted/heavy lesson media. `data/media-sources.json` is the connector contract. Images/audio/video can run after an authorized private media base is supplied; the course lesson structure does not need to be rebuilt.

## Safety checkpoint
Use on the existing `production-full-v1` branch only. Do not merge to `main` until Preview QA passes.
