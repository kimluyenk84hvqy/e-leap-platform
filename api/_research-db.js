import { neon } from '@neondatabase/serverless';

let sqlClient = null;

export function getResearchDb() {
  const connectionString = process.env.RESEARCH_DB_URL;

  if (!connectionString) {
    throw new Error('Missing RESEARCH_DB_URL');
  }

  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }

  return sqlClient;
}

export function researchDbAvailable() {
  return Boolean(process.env.RESEARCH_DB_URL);
}
