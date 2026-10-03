import { neon } from '@neondatabase/serverless';

let sqlClient = null;

function getConnectionString() {
  return (
    process.env.RESEARCH_DB_URL_DATABASE_URL ||
    process.env.RESEARCH_DB_URL_POSTGRES_URL ||
    null
  );
}

export function getResearchDb() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('Missing E-LEAP research database connection URL');
  }

  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }

  return sqlClient;
}

export function researchDbAvailable() {
  return Boolean(getConnectionString());
}
