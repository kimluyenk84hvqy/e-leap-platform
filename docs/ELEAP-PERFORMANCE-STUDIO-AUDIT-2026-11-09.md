# E-LEAP Performance & Studio Safety Audit — 2026-11-09

Status: source-level review only; no production change or runtime benchmark.

## Evidence
- Vercel Hobby Usage screenshot (2026-11-09): 761,898/1,000,000 CDN requests in the displayed billing window; Projects breakdown 761,865 requests from e-leap-platform; large mid-October spikes. This does NOT establish the responsible endpoint.
- service-worker.js: mediaCache returns cached response yet ALWAYS starts fetch(req), even on cache hit. This produces avoidable revalidation/background network traffic for cached same-origin media.
- service-worker.js: networkFirst(req) uses fetch(req,{cache:'no-store'}) for all other same-origin GET routes, including HTML/JS/JSON and APIs. This bypasses the browser HTTP cache. Cannot infer CDN savings until endpoints are measured.
- assets/js/lesson-live.js: refreshClassState() and refreshJoinedCount() every cfg.POLL_MS||1200, and screen-sync attempt every 500ms. Timers are cleared on restart, but no lifecycle pause/stop on hidden/offline/end was visible in reviewed file. The Live API uses Supabase, so DO NOT attribute this polling to Vercel CDN Requests.
- assets/js/authoring-save-service.js: endpoint /api/authoring/lessons; no matching route in inspected api/router.js, vercel.json or api/ directory. Falls back to localStorage. Server saving must be verified before calling Studio persistent.

## Priority 0: instrumentation before guessing
- Use available Vercel Observability/request logs for RECENT traffic: top paths, cache HIT/MISS, response status, bot/referrer/user agents where permitted. Historical mid-October detail may no longer be available.
- Compare opening 12A lesson twice under identical session: network requests and bytes (cold/warm), media requests, API rates. Preserve baselines.
- Find any recurring requests through scripts/automation; confirm Vercel vs Supabase traffic.

## Priority 1: safe fixes on a preview branch
1. Add cache policy tests and optional cache-first for versioned, same-origin image/audio/video URLs; retain network freshness for mutable/unversioned media, authenticated/private/API URLs. Do not serve private assets from public service-worker caches.
2. Exclude /api/ and sensitive responses from service-worker caching, avoid broad catch-all offline stale responses for authenticated content.
3. Live Class adaptive polling: pause on hidden/offline/ended, guard concurrent requests, exponential backoff on errors; preserve active-class latency and student sync correctness.
4. Implement authenticated server-backed Studio draft API with ownership checks, versioning/concurrency control, explicit server/local save status, retrieval after logout/login and from another browser.
5. Separate lesson JSON from immutable media; publish updated content without redeploying entire repository.

## Quality gates
- No changes to main or Production before preview checks.
- Student/Teacher/Guest/Presentation control contract maintained.
- Two consecutive warm lesson opens should avoid repeated download of immutable media.
- Active Live Class joins/answers/responses/screen sync remain reliable; hidden/inactive tab network use drops.
- Save draft -> close -> open on second device -> restore version; errors must not display as server saved.
- Verify cache busting on replaced image/media and correct previews before merge.
- No sensitive tokens or personal student data in logs.

## Scope
This is a source audit and implementation plan, NOT evidence that the October traffic spike is fully explained, NOT a performance fix, and NOT a deployed Studio.
