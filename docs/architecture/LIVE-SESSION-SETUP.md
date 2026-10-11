# Live Session / QR setup

The live module uses the Research DB API. CLEAN V1.1 accepts any of these Vercel environment variables: `RESEARCH_DB_URL_DATABASE_URL`, `RESEARCH_DB_URL_POSTGRES_URL`, `RESEARCH_DB_URL`, `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, or `NEON_DATABASE_URL`.

When `teacher-live.html` opens, it calls `/api/research/bootstrap` once. The bootstrap is idempotent and creates the required `classes`, `sessions`, `participants`, and `events` tables plus essential indexes if they do not exist.

If no database URL is configured, the page displays a precise setup message instead of the generic “Research database unavailable”. QR generation is local to the E-LEAP deployment through `/api/qr`.
