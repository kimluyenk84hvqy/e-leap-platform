export default function handler(req, res) {
  const keys = [
    'RESEARCH_DB_URL',
    'DATABASE_URL',
    'RESEARCH_DB_DATABASE_URL',
    'RESEARCH_DB_POSTGRES_URL',
    'RESEARCH_DB_POSTGRES_PRISMA_URL',
    'RESEARCH_DB_POSTGRES_URL_NON_POOLING'
  ];

  const env = {};

  for (const key of keys) {
    env[key] = Boolean(process.env[key]);
  }

  return res.status(200).json({
    ok: true,
    environment: process.env.VERCEL_ENV || null,
    databaseVariables: env
  });
}
