# E-LEAP R3B RC2 — Large-block stabilization patch

Upload this patch to the preview branch `r1-r2-preview`.

Includes:
- Shared lesson-host Presentation entry/exit for Teacher/Admin
- Runtime context push into hosted legacy lessons
- Immediate loading shell + slow-load retry path
- Resource-registry session cache
- Media-map session cache
- Browser caching headers for private lesson media
- Shared media resolver loading/error states
- U1.1 media loading tuned so the lesson shell is not blocked by audio/video metadata
- U1.2 media-map caching
- Service-worker static fallback/cache foundation
- Existing R3B activity renderers + autosave preserved

Important: U1.1/U1.2 remain Golden References. This patch does not rewrite their pedagogy or content.
