# E-LEAP Research DB Environment Compatibility Fix

Purpose: fix `Research database unavailable` on Vercel/Neon when the Marketplace integration prefixes the Neon environment variables.

Changes:
- `api/_research-db.js` now recognizes common E-LEAP names plus Vercel/Neon prefixed `*_DATABASE_URL` variables.
- Prefers pooled URLs and ignores `*_UNPOOLED`.
- `api/research/bootstrap.js` returns only the detected environment-variable NAME for safe diagnostics; it never returns the database secret.

Upload the CONTENTS of this ZIP to the repository root on branch `e-leap-clean-v1`, overwriting matching files.

Suggested commit:
`Fix Research DB Neon environment compatibility`

After Vercel reports Ready, open Teacher Live / QR again. Expected result:
1. `Research database unavailable` disappears.
2. Create Class succeeds.
3. Create Live Session returns a join code.
4. QR is rendered.
