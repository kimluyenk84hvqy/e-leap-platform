# E-LEAP Studio Media Library — Safe Preview Candidate

Scope: new API `/api/studio-media`, new screen `/studio/media-library.html`, link from Studio. No modification to U1.1, U1.2, existing media read endpoint, Production branch or existing role controls.

## Architecture
- Three textbook PDFs + canonical audio: permanent references once private storage is proven.
- PPTX: **temporary originals only**. Keep derived content and assets referenced by approved lessons; **do not delete PPTX** before a verified extraction-and-dependency audit.
- Neon: metadata table `studio_media_v1`, only owner-scoped records.
- Vercel Blob: actual file bytes outside GitHub/Vercel deployment artifact.
- No bulk re-packaging of PDF, PPTX, audio into each lesson.

## Security gates
- Both server environment variables are required to enable upload:
  - `STUDIO_MEDIA_UPLOAD_ENABLED=true`
  - `STUDIO_MEDIA_PRIVATE_STORE_VERIFIED=true`
- Default is OFF. Do not turn these on simply to make the Upload button clickable.
- Before enabling, use a Preview deployment to verify actual client-uploaded object is PRIVATE: unauthenticated direct URL must be denied and authorized `/api/studio-media?open=<assetId>` must work.
- Private client uploads may behave differently across Blob SDK versions and store settings; if this check fails, uploads remain disabled until the storage mechanism is corrected.
- The front-end upload library is currently loaded from a version-pinned CDN. Bundle locally before production release to avoid a dependency on third-party runtime delivery.
- The SHA-256 value currently comes from the browser; treat it as an optimization hint, **not cryptographic proof from the server**.
- A 3 GB teacher logical cap is only a provisional gate. Concurrency-resistant reservation accounting, admin/global quota and physical-byte accounting are NOT implemented.
- Archiving does not release Blob bytes. Physical deletion is deliberately withheld until safe dependency tracking exists.

## Supported limits in preview
- Textbook PDFs 150 MB each; PPTX 200 MB each.
- DOCX 40 MB; JPEG/PNG/WebP 15 MB; MP3/WAV/M4A 200 MB; MP4 200 MB.
- Confirm the project’s plan/store upload limits separately; these are application policy ceilings, not provider guarantees.

## Acceptance tests before switching uploads on
1. Guest/Student requests: blocked (list, token issuance, and open).
2. Teacher A cannot list/read/archive Teacher B assets.
3. Direct Blob URL anonymous: **denied**.
4. MIME, filename, size and duplicate attempts: checked.
5. Preview callback writes metadata; file appears in library.
6. PDF 63.8 MB LIFE, 61.3 MB Objective B1, 58.9 MB Objective B2.
7. LIFE audio 172 MB and Objective B1 audio 172 MB.
8. PPTX 100 MB upload; extract assets; save references; preview lesson; only then allow deletion (not implemented yet).
9. Verify quota usage and actual Vercel/Blob billing graphs under concurrent uploads.
10. Smoke-test existing lessons, Live Class, Responses, Next/Previous, research flows.
11. Rollback by disabling the two upload environment variables; no Production branch update until approval.

## Next work
- Fix validated private browser uploads, local-bundle SDK, quotas with reservations and concurrency.
- Implement safe PPT extraction and reference counts, retention policy and audited physical deletion.
- Plug media references into Studio Content Mapper, then run LIFE Unit 12 Opener → 12A.
