/* Submission schema contract: read-only, fail-closed.
 * The existing Neon Preview branch contains legacy BIGINT assignment/submission
 * tables. Do NOT auto-migrate schema on incoming requests.
 */
export const SUBMISSION_SCHEMA_VERSION='eleap-assignment-v2-idempotent';
const expected={
 assignments:{assignment_id:'uuid',class_id:'uuid',teacher_id:'uuid',resource_id:'text',activity_id:'text'},
 submissions:{submission_id:'uuid',assignment_id:'uuid',student_user_id:'uuid',client_request_id:'uuid',attempt_no:'integer'}
};
export function inspectSubmissionSchema(rows=[],indexes=[]){
 const actual=new Map((Array.isArray(rows)?rows:[]).map(r=>[r.table_name+'.'+r.column_name,r.data_type]));
 const issues=[];
 for(const [table,columns] of Object.entries(expected))for(const [column,type] of Object.entries(columns)){
  const got=actual.get(table+'.'+column);
  if(got!==type)issues.push(table+'.'+column+': expected '+type+', found '+(got||'missing'));
 }
 const definitions=new Map((Array.isArray(indexes)?indexes:[]).map(r=>[r.indexname,String(r.indexdef||'')]));
 const uniqueIndexes={
  idx_submissions_assignment_student_attempt_v2:['assignment_id','student_user_id','attempt_no'],
  idx_submissions_idempotent_v2:['assignment_id','student_user_id','client_request_id']
 };
 for(const [name,columns] of Object.entries(uniqueIndexes)){
  const definition=definitions.get(name)||'';
  const pattern=new RegExp('CREATE UNIQUE INDEX\\s+'+name+'\\s+ON\\s+.+\\('+columns.join('\\s*,\\s*')+'\\)','i');
  if(!pattern.test(definition))issues.push('missing or invalid unique index '+name);
 }
 return {ok:issues.length===0,version:SUBMISSION_SCHEMA_VERSION,issues};
}
export async function requireSubmissionSchema(sql,res){
 const rows=await sql`SELECT table_name,column_name,data_type FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('assignments','submissions')`;
 const indexes=await sql`SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='submissions'`;
 const report=inspectSubmissionSchema(rows,indexes);
 if(report.ok)return true;
 res.status(503).json({ok:false,code:'SUBMISSIONS_SCHEMA_UPGRADE_REQUIRED',
  error:'Submission storage is not ready; no changes were written.',schemaVersion:report.version,issues:report.issues});
 return false;
}
