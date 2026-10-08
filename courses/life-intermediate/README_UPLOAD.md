# E-LEAP · Life A2-B1 · Lesson 3.3 · Unit 1E + 1F

This package is built for the existing E-LEAP shared lesson system. It does **not** add new platform features or role controls.

## Target lesson
- Course shell ID: `life-intermediate`
- Unit: `unit-01`
- Existing lesson shell ID preserved: `life-u01-l03`
- Classroom label: **Lesson 3.3**
- Content: **Unit 1E Personal Information + Unit 1F My Local Park**

## Copy paths into the repository
- `courses/life-intermediate/unit-01/lesson-03/lesson.json`
- `media-private/life-intermediate/u01/l03/09-track-09.mp3`
- `media-private/life-intermediate/u01/l03/unit-1-my-local-park.mp4`

## Important media note
The current shared E-LEAP renderer resolves `PRIVATE_MEDIA/...` through the platform's existing signed private-media service. The two media files are included here under the same logical paths so the existing private-media upload/sync workflow can publish them without changing lesson code.

## Pedagogic changes from the source PPT
- corrected lesson aims to match Unit 1E + 1F;
- removed the off-topic role-model / person-you-admire tasks;
- replaced personal-health disclosure with a low-pressure fictional review task;
- split Track 9 into Identity / Contact / Health & exercise;
- removed the exposed answer slide and uses item-by-item reveal;
- rebuilt the video note task into six short detail prompts;
- kept typing load low and speaking support explicit.

## Publish sequence
1. Upload/copy package files.
2. Confirm private media resolves.
3. Preview as Teacher / Student / Guest / Presentation.
4. Quality Check.
5. Change lesson status from `DRAFT` to `APPROVED` only after runtime QA.
