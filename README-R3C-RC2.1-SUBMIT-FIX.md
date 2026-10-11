# E-LEAP R3C RC2.1 — Unified Submit Bridge Fix

Hotfix over R3C RC2.

- Root cause: Golden Reference activities do not all expose a lesson-owned `Submit` button. Many use Check, matching, typing, selection, or other activity controls.
- Unified Student Submit now first delegates to a native lesson Submit when available.
- Otherwise it snapshots the current active activity response through the existing E-LEAP bridge and emits `response.submitted` directly.
- It does NOT call Check, reveal answers, or change Next/Previous behavior.
- Empty/content-only activities are not submitted.
- Applied through the hosted lesson access adapter for both U1.1 and U1.2; lesson content and navigation remain unchanged.
