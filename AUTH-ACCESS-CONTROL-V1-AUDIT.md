# Authentication & Access Control v1 — PB / Security Audit

## Threats explicitly closed in v1
1. **Client-supplied Teacher ID as authority** — removed. Protected APIs derive identity from server session.
2. **Client-supplied grader ID** — removed. Grader is the authenticated Teacher/Admin.
3. **Teacher A reading/changing Teacher B class** — class ownership checked server-side.
4. **Student reading another student's submissions** — Student queries are keyed by authenticated `user_id`.
5. **Student reading unreleased feedback** — feedback/rubric fields are returned only after `feedback_released_at`.
6. **Anonymous research export** — blocked; Teacher/Admin session required and class ownership checked.
7. **Identified research export** — explicitly disabled.
8. **Open legacy identity creation** — `/api/research/users` POST is disabled.
9. **Session loss after reload** — auth session is persisted in Neon and referenced by HttpOnly cookie.
10. **Student identity collision/impersonation by Student ID alone** — Student join requires valid Join Code + matching Student PIN; first enrollment binds PIN to Student ID.
11. **Basic password brute force** — persistent email-based lockout after repeated failures.
12. **Cross-site state-changing browser requests** — same-origin guard + SameSite cookie.
13. **Open redirect through login `next`** — only same-site paths beginning with a single `/` are accepted.

## Intentional v1 boundaries / residual risks
- No SSO, MFA, password-reset flow, email verification or institutional directory integration yet.
- A first-time Student ID can still be claimed by whoever possesses the valid class join code and sets the first PIN. For higher assurance, v2 should pre-provision the roster or issue teacher-generated one-time student activation codes.
- Existing legacy test classes are not auto-migrated to `auth_users`; recreate or explicitly migrate them after v1 stabilizes.
- Static audit cannot prove deployment/runtime behavior. Live Neon/Vercel E2E remains mandatory.

## Mandatory E2E acceptance tests
1. Admin one-time setup succeeds; second setup attempt is rejected.
2. Teacher valid login succeeds; wrong password fails; reload preserves session.
3. Teacher A creates Class A. Teacher B cannot fetch/update Class A.
4. Teacher A creates live session; QR uses `/student-access.html`.
5. Student S1 joins with Join Code + Student ID + PIN; reload retains Student session.
6. Rejoining S1 with same Student ID + wrong PIN fails; correct PIN reuses same identity.
7. Student S1 sees only classes/assignments from memberships associated with S1.
8. Student S1 cannot call grading/export/class-management APIs successfully.
9. Teacher A sees submissions for own assignments and can Save grade without Release.
10. Student cannot see unreleased feedback; after Release, feedback becomes visible.
11. Teacher B cannot grade Teacher A submission or export Teacher A class.
12. Research CSV contains pseudonymous research ID and excludes names/Student IDs; consent filter works.
13. Logout invalidates the session server-side; protected API returns 401 afterward.

## Milestone status
- Source/static audit: PASS candidate.
- Live E2E: PENDING.
- Final milestone label allowed only after E2E: `Authentication & Access Control v1 — LOCKED`.
