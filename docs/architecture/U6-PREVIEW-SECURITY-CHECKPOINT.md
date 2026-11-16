# E-LEAP Preview safety checkpoint — 2026-11-16

## Changes
1. Shared Native Activity now escapes title, prompt, options, input attribute values and placeholder when composing its markup, defending against malformed/untrusted textbook text.
2. Explicit `context.reviewOnly=true` or `mode='review'` disables Check, Reveal, Score and Submit regardless of preview role or answer keys. Reset remains active. Native click handlers also enforce these capability guards.
3. `ELeapAuthoringSaveService` now refuses to POST restricted source-review / Resource Bank drafts on save. It refuses Publish before contacting an API. This is client-side containment only — it does **not** replace authenticated server authorization.
4. Reload of a `?localReview=...` Studio draft selects the unverified review screen rather than returning the teacher to the cover; text is still browser-local.

## Tests added
`tests/studio-u6-preview-safety.test.mjs` exercises HTML escaping, denied controls across five roles, local-only Save and denied Publish with an instrumented network stub.

## Acceptance boundaries
No live student submission or Responses claims; `LocalSubmissionStore` is a development adapter. The `/api/authoring/lessons` server route is still not implemented, so no secure publication path exists. Browser E2E with authorized teacher accounts and visual review remains outstanding. Production/main untouched.
