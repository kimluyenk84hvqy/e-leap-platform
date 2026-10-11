# R4 RC1.4.1 — Golden Route Hotfix

Purpose: restore deterministic opening of U1.1/U1.2 on Vercel Preview.

- Golden Reference routes are mounted immediately by lesson-host and do not wait for registry/cache.
- Resource registry fetch is `no-store`; session fallback is versioned.
- U1.1/U1.2 lesson files are unchanged.
- Next/Previous are unchanged.
- Authoring Studio v1.1 remains intact.
