export default function handler(req, res) {
  const researchKeys = Object.keys(process.env)
    .filter((key) => key.startsWith('RESEARCH_DB_'))
    .sort();

  const databaseKeys = Object.keys(process.env)
    .filter((key) =>
      key.includes('DATABASE') ||
      key.includes('POSTGRES') ||
      key.includes('NEON')
    )
    .sort();

  return res.status(200).json({
    ok: true,
    environment: process.env.VERCEL_ENV || null,
    researchKeys,
    databaseKeys
  });
}
