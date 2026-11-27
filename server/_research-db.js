import { neon } from '@neondatabase/serverless';

let sqlClient = null;

function getConnectionString() {
  return (
    process.env.RESEARCH_DB_URL_DATABASE_URL ||
    process.env.RESEARCH_DB_URL_POSTGRES_URL ||
    process.env.RESEARCH_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
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

// Preview-only endpoint attestation. Returns a boolean; never exposes credentials
// or the hostname. The checked variable follows precisely getResearchDb() selection.
export function isBoundToExpectedPreviewDatabase(){
  if(process.env.VERCEL_ENV!=='preview')return null;
  try{
    const host=new URL(getConnectionString()).hostname.toLowerCase();
    // Unique to Neon branch br-holy-surf-b3fhwfih, including read-write,
    // pooled and Neon compute-binding host variants.
    const expectedEndpoint=process.env.VERCEL_GIT_COMMIT_REF==='preview/life-u41-publication'
      ? /^ep-cool-math-b39o0rw5(?:[-.]|$)/
      : /^ep-square-term-b35ucjfc(?:[-.]|$)/;
    return expectedEndpoint.test(host) && host.endsWith('.neon.tech');
  }catch{return false;}
}

export function researchDbAvailable() {
  return Boolean(getConnectionString());
}
