# E-LEAP FINAL RC1 — U2 + Classes / Live / QR

This is a code/data patch. It intentionally does NOT duplicate the large U2.2 MP4 files already supplied in the media upload packages.

## What changed
- U2.2 final visual refinement: larger typography, tighter pane spacing, inline answer reveal, evidence/correction feedback, numbered book activity instructions, two-tab Exercise 4 and Googlewhacking flow.
- More robust U2.2 video resolver: tries the correct root media path and common nested upload locations.
- Classes now use the same Research DB store as Live Class.
- Classes: Create, Rename, Archive/Restore, Start Live.
- Live Class: U1.1, U1.2, U2.1, U2.2 lesson choices; class can be opened directly from Classes.
- QR remains generated locally by /api/qr and points students to join.html with the live join code.
- Service worker cache version bumped to avoid mixed Preview assets.

## Required U2.2 media at repository root
- media/u2.2/gaming-leadin.mp4
- media/u2.2/present-tenses/part-00.mp4 ... part-03.mp4
- media/u2.2/stative-action/part-00.mp4 ... part-02.mp4

## Required Vercel environment
A Research DB URL must be configured using one of the names already accepted by E-LEAP, e.g. RESEARCH_DB_URL or DATABASE_URL. Without it, cross-device Classes / QR / Live participants cannot work.

## Final acceptance test after deploy
1. Teacher -> Classes -> Create Class -> Rename -> Archive/Restore.
2. Start Live from that class -> choose U2.2 -> Create Live Session.
3. QR appears and join link copies.
4. Scan QR on a second device -> enter Student ID + Full name -> joins same lesson.
5. Teacher participant count updates.
6. Submit one student response -> Teacher Live Responses updates.
7. Open U2.2 videos and verify all segments play.
8. Teacher Show answer reveals answer/evidence inline.
