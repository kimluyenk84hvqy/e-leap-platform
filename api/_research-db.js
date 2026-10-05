import { neon } from '@neondatabase/serverless';

let sqlClient = null;
let cachedResolution = null;

function looksLikePostgresUrl(value) {
  return typeof value === 'string' && /^postgres(?:ql)?:\/\//i.test(value.trim());
}

function resolveConnectionString() {
  if (cachedResolution) return cachedResolution;

  // Explicit names used by E-LEAP and common Vercel/Neon integrations.
  const preferredNames = [
    'RESEARCH_DB_URL_DATABASE_URL',
    'RESEARCH_DB_DATABASE_URL',
    'RESEARCH_DATABASE_URL',
    'RESEARCH_DB_URL',
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'NEON_DATABASE_URL'
  ];

  for (const name of preferredNames) {
    const value = process.env[name];
    if (looksLikePostgresUrl(value)) {
      cachedResolution = { value: value.trim(), source: name };
      return cachedResolution;
    }
  }

  // Vercel Marketplace may prefix Neon variables with the integration/store name.
  // Accept any pooled DATABASE_URL-style variable without exposing its value.
  const candidates = Object.entries(process.env)
    .filter(([name, value]) => {
      if (!looksLikePostgresUrl(value)) return false;
      const upper = name.toUpperCase();
      if (upper.includes('UNPOOLED')) return false;
      return (
        upper === 'DATABASE_URL' ||
        upper.endsWith('_DATABASE_URL') ||
        upper.endsWith('_POSTGRES_URL') ||
        upper.includes('NEON') && upper.endsWith('_URL')
      );
    })
    .sort(([a], [b]) => {
      const score = (name) => {
        const upper = name.toUpperCase();
        let s = 0;
        if (upper.includes('RESEARCH')) s += 100;
        if (upper.endsWith('_DATABASE_URL')) s += 50;
        if (upper === 'DATABASE_URL') s += 40;
        if (upper.includes('POSTGRES')) s += 20;
        return s;
      };
      return score(b) - score(a);
    });

  if (candidates.length) {
    const [source, value] = candidates[0];
    cachedResolution = { value: value.trim(), source };
    return cachedResolution;
  }

  cachedResolution = { value: null, source: null };
  return cachedResolution;
}

export function getResearchDbConnectionInfo() {
  const { value, source } = resolveConnectionString();
  return { available: Boolean(value), source };
}

export function getResearchDb() {
  const { value: connectionString } = resolveConnectionString();

  if (!connectionString) {
    throw new Error('Missing E-LEAP research database connection URL');
  }

  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }

  return sqlClient;
}

export function researchDbAvailable() {
  return getResearchDbConnectionInfo().available;
}
