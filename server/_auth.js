import { randomBytes, createHash, timingSafeEqual, scryptSync } from 'node:crypto';
import { getResearchDb } from './_research-db.js';

const COOKIE='e_leap_session';
const SESSION_DAYS=14;

function b64url(buf){ return Buffer.from(buf).toString('base64url'); }
function sha256(v){ return createHash('sha256').update(String(v)).digest('hex'); }
export function normalizeEmail(v){ return String(v||'').trim().toLowerCase(); }
// Student IDs are identity keys, so separators/case must never create a second account.
// CK1.51.094, ck1-51-094 and "CK1 51 094" all normalize to CK151094.
export function normalizeStudentId(v){
  return String(v||'').trim().toUpperCase().normalize('NFKC').replace(/[^A-Z0-9]/g,'');
}
export function validStudentId(v){ const id=normalizeStudentId(v); return id.length>=4 && id.length<=40 && /[A-Z]/.test(id) && /\d/.test(id); }

export function hashPassword(password){
  const value=String(password||'');
  if(value.length<6) throw new Error('Secret must be at least 6 characters');
  const salt=randomBytes(16);
  const hash=scryptSync(value,salt,64,{N:16384,r:8,p:1});
  return `scrypt$16384$8$1$${b64url(salt)}$${b64url(hash)}`;
}
export function verifyPassword(password,stored){
  try{
    const [kind,n,r,p,salt64,hash64]=String(stored||'').split('$');
    if(kind!=='scrypt')return false;
    const expected=Buffer.from(hash64,'base64url');
    const actual=scryptSync(String(password||''),Buffer.from(salt64,'base64url'),expected.length,{N:Number(n),r:Number(r),p:Number(p)});
    return expected.length===actual.length && timingSafeEqual(expected,actual);
  }catch{return false;}
}
function parseCookies(req){
  const out={};
  for(const part of String(req.headers.cookie||'').split(';')){
    const i=part.indexOf('='); if(i<0)continue;
    out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}
function cookieHeader(token,maxAge){
  const secure=process.env.VERCEL || process.env.NODE_ENV==='production';
  return `${COOKIE}=${encodeURIComponent(token||'')}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure?' Secure;':''}`;
}
export function clearSessionCookie(res){ res.setHeader('Set-Cookie',cookieHeader('',0)); }
export async function createSession(res,userId,{days=SESSION_DAYS}={}){
  const sql=getResearchDb();
  const token=b64url(randomBytes(32));
  const tokenHash=sha256(token);
  const expiresAt=new Date(Date.now()+days*86400000).toISOString();
  await sql`INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(${tokenHash},${userId},${expiresAt})`;
  res.setHeader('Set-Cookie',cookieHeader(token,days*86400));
  return expiresAt;
}
export async function destroySession(req,res){
  const token=parseCookies(req)[COOKIE];
  if(token){
    try{ const sql=getResearchDb(); await sql`DELETE FROM auth_sessions WHERE token_hash=${sha256(token)}`; }catch{}
  }
  clearSessionCookie(res);
}
export async function getAuth(req){
  const token=parseCookies(req)[COOKIE];
  if(!token)return null;
  const sql=getResearchDb();
  const rows=await sql`
    SELECT u.user_id,u.email,u.student_id,u.display_name,u.role,u.status,s.expires_at
    FROM auth_sessions s JOIN auth_users u ON u.user_id=s.user_id
    WHERE s.token_hash=${sha256(token)} AND s.expires_at>NOW() AND u.status='active'
    LIMIT 1`;
  return rows[0]||null;
}
export async function requireAuth(req,res,roles=null){
  const user=await getAuth(req);
  if(!user){ res.status(401).json({ok:false,error:'Authentication required',code:'AUTH_REQUIRED'}); return null; }
  if(roles && !roles.includes(user.role)){
    res.status(403).json({ok:false,error:'Insufficient permissions',code:'FORBIDDEN'}); return null;
  }
  return user;
}
export function requireSameOrigin(req,res){
  if(!['POST','PUT','PATCH','DELETE'].includes(req.method)) return true;
  const origin=req.headers.origin;
  if(!origin) return true;
  const host=req.headers['x-forwarded-host']||req.headers.host;
  const proto=req.headers['x-forwarded-proto']||'https';
  if(origin===`${proto}://${host}`)return true;
  res.status(403).json({ok:false,error:'Cross-origin request blocked',code:'CSRF_BLOCKED'}); return false;
}
export async function teacherOwnsClass(sql,user,classId){
  if(user.role==='admin')return true;
  if(user.role!=='teacher')return false;
  const r=await sql`SELECT 1 FROM classes WHERE class_id=${classId} AND teacher_id=${user.user_id} LIMIT 1`;
  return Boolean(r.length);
}
export async function studentInClass(sql,user,classId){
  if(user.role!=='student')return false;
  const r=await sql`SELECT 1 FROM auth_class_members WHERE class_id=${classId} AND student_user_id=${user.user_id} AND status='active' LIMIT 1`;
  return Boolean(r.length);
}
export async function canAccessClass(sql,user,classId){
  if(user.role==='admin')return true;
  if(user.role==='teacher')return teacherOwnsClass(sql,user,classId);
  return studentInClass(sql,user,classId);
}
export async function ensureAuthSchema(){
  const sql=getResearchDb();
  await sql`CREATE TABLE IF NOT EXISTS auth_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    student_id TEXT UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS auth_sessions (
    session_auth_id BIGSERIAL PRIMARY KEY,
    token_hash TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS auth_class_members (
    class_member_id BIGSERIAL PRIMARY KEY,
    class_id TEXT NOT NULL,
    student_user_id UUID NOT NULL REFERENCES auth_users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id,student_user_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS auth_login_attempts (
    login_key TEXT PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id,expires_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auth_class_members_student ON auth_class_members(student_user_id,status)`;
  return sql;
}
