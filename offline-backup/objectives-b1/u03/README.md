# E-LEAP Objectives B1 · Unit 3 · Standalone / Offline Backup Master

This folder is the emergency teaching route for **Unit 3 · What's your job?**. It is intentionally independent of Vercel deployment state.

## What is included

- modern standalone lesson shell;
- Teacher / Student / Guest role behavior;
- Teacher controls: **Check · Reset · Show answer · Presentation · Timer · Responses · Live Class / QR**;
- Student controls: **Check · Reset · Submit · Score**;
- in-place answer reveal;
- local Response Board;
- local-LAN teacher-follow behavior when launched with `server.py`;
- both Unit 3 lessons and all source activities represented in the offline lesson data;
- Part 1 / Part 2 handling for dense tasks;
- large classroom typography and no-scroll presentation target;
- media manifest with the exact local paths expected by the offline package.

## Fastest way to teach on Mac

1. Keep this whole folder together.
2. Double-click `START_ELEAP_U3.command`.
3. The Teacher page opens at `http://localhost:8765/`.
4. Keep the Terminal window open during class.
5. For students on the same Wi-Fi, open **Live Class / QR**. The panel shows the LAN join URL. If the optional Python `qrcode` package exists, the QR image appears automatically; otherwise the join URL remains usable.

If macOS blocks the launcher the first time, right-click it → Open. Alternatively run `python3 server.py` from this folder.

## Windows

Double-click `START_ELEAP_U3.bat`.

## Emergency single-computer route

Opening `index.html` directly still provides presentation, navigation, input, Check, Reset and Teacher Show answer. Cross-device Responses / teacher-follow require the local server route above.

## Media folders

The runtime expects:

- `media/audio/`
- `media/images/`

See `media-manifest.json` for exact filenames.

The existing E-LEAP Unit 3 media package should be placed under these local folders when the final backup ZIP is assembled. The runtime does not crash if an image is absent; it shows a neutral placeholder. **A backup must not be labelled MEDIA-COMPLETE until every required audio file and approved image in the manifest is physically present.**

## Visual standard

- fresh deep military green + controlled lime accent;
- warm white/cream surfaces;
- natural, contemporary workplace photography;
- no cartoon aesthetic;
- no repeated generic stock image set across consecutive slides;
- images must match the audio/task rather than merely illustrate the topic;
- classroom body type ≥ ~28 px; major prompts ≥ ~36 px;
- show one task/sentence at a time when density would reduce readability.

## Source fidelity

The backup is based on the approved Unit 3 content packages. Source activity numbering and meanings are preserved. Open speaking tasks are not given fake auto-scores. Pronunciation Activity 2 uses the source audio only; no transcript is fabricated.

## Safety / Production rule

This backup folder lives on the isolated branch:

`objectives-b1-u3-backup-redesign-20261010`

It must **not** be merged or promoted to Production until Teacher, Student and Guest QA pass and the local media manifest is complete.
