# E-LEAP AI Studio — Development & Acceptance SOP v2.0
**Status:** Preview implementation policy for future milestones; production remains unchanged until separate approval.

## Principles
- Modify the smallest verified module; preserve existing shell, roles, media and published lesson IDs.
- Reuse the locked `controls/role-control-contract.js`, common authoring schema and renderer; do not create another permanent runtime.
- Separate four states: **committed**, **build READY**, **tested**, **teacher accepted**. READY is NOT accepted.
- Keep AI provider disabled until M1 + M3 and server-side permissions/budgets meet entry gates.
- P0 bugs fail the whole milestone even if most unit tests pass.

## Sequence required for every change
1. **Baseline**: record branch/commit, relevant files, existing controls, privacy, performance and rollback checkpoint.
2. **Acceptance contract**: specify inputs, outputs, role semantics, source trust states, failure cases and exact evidence.
3. **Failing tests first**: good fixture, bad/ambiguous source, old regression fixture, unauthorized roles, stale version, partial/empty answers, missing media and upload errors.
4. **Smallest patch** on isolated Preview branch; do not edit Production main.
5. **Independent tests**: deterministic test module + shared runtime integration; never only a synthetic helper.
6. **Browser E2E + screenshots** at classroom viewport and mobile when relevant; role, interaction, media, scroll, clipping, 16:9 and keyboard.
7. **Threat review**: no browser-authoritative role, answer keys, model citations, ACL or model budget; authorization enforced server-side.
8. **Release ledger**: mark PASS/FAIL per gate with test command, fixture, timestamp, commit, deployment link and known limitations; no unsupported success claims.
9. **Teacher review**: actual learning task and instructions are sufficient for a learner and an observing teacher.
10. **Production release only after explicit authorization**, verified rollback and smoke tests.

## P0 regression — current scope
| Finding | Corrected in Preview | Evidence still required |
| --- | --- | --- |
| Source parser says ok with incomplete Task | Yes: task-local errors fail parse | Real source corpus & browser intake |
| Score rendered before request | Yes: gated by explicit eligible action | Browser E2E of every role |
| Admin Show Answer inert | Yes: behavior driven from locked control contract | Browser E2E |
| Preview role reset | Corrected for guarded source operations | Browser E2E |
| A second role-control list in the Lab | Replaced by `hasRoleControl` | Runtime integration and server checks |
| Large PDF page-only extraction | Range selection, up to 12 pages from a PDF <=150 MB | Real 60+ MB book, memory/performance and reading order |

## Milestone entry/exit criteria
**M1**: real PDF + PPT + audio sources, page/slide/track alignment, stable source IDs, explicit missing parts, teacher-approved evidence and no fabricated answers. Scanned PDF needs safe review/OCR workflow if applicable. Reject when task errors remain.

**M3**: canonical activity → existing shared Studio blocks → actual learner runtime; test Check/Reset/Score, Student Submit/Responses, Teacher/Admin reveal, Guest no persistence, Presentation controls; item-level evidence; browser automation and 16:9 visual QA. A sandbox is not proof of shared-runtime compliance.

**M2**: choose methodology on explicit selection criteria, reject bad fit, learner-visible instructional scaffolds and observable output, teacher pedagogical approval.
**M4**: authorized server endpoint, scope diff/approve/undo and no out-of-scope changes; model/network failure leaves draft unchanged.
**M5**: complete lesson coverage, objective/task alignment, verified source keys and media, proper visuals and runtime, human acceptance.

## Stop conditions
Stop and repair before further rollout on any P0, source/answer fabrication, role leakage, published lesson mutation, cost cap breach or failure to restore a backup.
