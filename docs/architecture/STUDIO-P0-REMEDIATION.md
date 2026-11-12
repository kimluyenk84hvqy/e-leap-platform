# E-LEAP P0 remediation — Source parser and Preview role behavior
Scope: Preview only. No Production changes, no AI provider calls, no database mutations.

## Corrected
- Task-local source errors now fail the parser `ok` status. Unparsed source text fails conservatively.
- Foundation Lab uses `hasRoleControl` from existing locked E-LEAP role contract for visibility and actions, instead of maintaining a second list of role privileges.
- Admin Show Answer is actionable in the synthetic fixture; Student/Guest never reveal.
- Synthetic score is rendered only after an explicit eligible Score action, not at initial paint; reset/change invalidates score visibility.
- Role reset remains tied to real Studio editor role after loading a source; preview role is never a server permission.
- Foundation Lab has no Submit, Responses or Live Class because it has no secure persistence; status remains partial M3.

## Remaining high-priority acceptance items
1. Full shared activity renderer adapter; no separate permanent runtime.
2. Playwright/browser E2E role/permission and 16:9 screenshot evidence.
3. Full source extraction for PDF page ranges, PPT and audio, with provenance.
4. Server-verified source/evidence approval. No trust in client-supplied verified labels.
5. Whole lesson regression check and controlled Production release approval.

## Acceptance claims
Unit state-machine checks are necessary, not sufficient. A Vercel READY build is NOT interactive acceptance.
