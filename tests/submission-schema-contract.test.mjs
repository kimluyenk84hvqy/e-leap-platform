import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSubmissionSchema,requireSubmissionSchema} from '../server/_submission-schema-contract.js';
const modern=[
 {table_name:'assignments',column_name:'assignment_id',data_type:'uuid'},
 {table_name:'assignments',column_name:'class_id',data_type:'uuid'},
 {table_name:'assignments',column_name:'teacher_id',data_type:'uuid'},
 {table_name:'assignments',column_name:'resource_id',data_type:'text'},
 {table_name:'assignments',column_name:'activity_id',data_type:'text'},
 {table_name:'submissions',column_name:'submission_id',data_type:'uuid'},
 {table_name:'submissions',column_name:'assignment_id',data_type:'uuid'},
 {table_name:'submissions',column_name:'student_user_id',data_type:'uuid'},
 {table_name:'submissions',column_name:'client_request_id',data_type:'uuid'},
 {table_name:'submissions',column_name:'attempt_no',data_type:'integer'}
];
const indexes=[{indexname:'idx_submissions_assignment_student_attempt_v2'},{indexname:'idx_submissions_idempotent_v2'}];
test('legacy Neon BIGINT schema is rejected, not guessed or modified',()=>{
 const old=modern.map(x=>({...x}));
 old.find(x=>x.table_name==='submissions'&&x.column_name==='submission_id').data_type='bigint';
 const result=inspectSubmissionSchema(old,indexes);
 assert.equal(result.ok,false);
 assert.ok(result.issues.some(x=>/submissions.submission_id/.test(x)));
});
test('modern schema requires idempotence and attempt indexes',()=>{
 assert.equal(inspectSubmissionSchema(modern,indexes).ok,true);
 assert.equal(inspectSubmissionSchema(modern,[]).ok,false);
});
test('unready API returns explicit 503 without SQL write',async()=>{
 const reads=[];
 const sql=(strings,...args)=>{
  const query=strings.join('?');reads.push(query);
  if(query.includes('information_schema.columns'))return Promise.resolve(modern.slice(0,2));
  if(query.includes('pg_indexes'))return Promise.resolve([]);
  throw Error('WRITE ATTEMPT');
 };
 const result={code:null,body:null,status(code){this.code=code;return this;},json(data){this.body=data;return data;}};
 assert.equal(await requireSubmissionSchema(sql,result),false);
 assert.equal(result.code,503);
 assert.equal(result.body.code,'SUBMISSIONS_SCHEMA_UPGRADE_REQUIRED');
 assert.equal(reads.length,2);
});
