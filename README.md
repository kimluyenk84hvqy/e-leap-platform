# E-LEAP U2.2 V2 — Visual + Video + Teacher Reveal Fix

This is a CODE-ONLY hotfix plus three lightweight video poster images. It does not replace the existing large MP4 files.

Fixes:
- restores the cleaner U1-style multi-accent palette (green / navy / amber / plum) and removes repeated heavy dark-green boxes;
- enlarges headings, source text, exercise text, inputs and video players for projection;
- gives both grammar videos a large player and explicit Part buttons;
- changes video sources to root-absolute `/media/u2.2/...` paths to avoid iframe-relative path problems;
- displays an explicit media-path diagnostic only if a video really cannot load;
- Teacher Show answer now exposes one answer at a time, including gap-fill answers and open-response model answers;
- supports host commands `reveal`, `show-answer`, and `showanswer`;
- keeps Exercise 4 and Googlewhacking in two-tab single-screen layouts;
- preserves the 21-screen source-based lesson content.

Upload all contents of this patch to the root of branch `e-leap-clean-v1` and overwrite matching files.
Commit: `Fix U2.2 video reveal typography and visual design`

IMPORTANT: Existing video files must already exist under `/media/u2.2/` from the previous media uploads.
