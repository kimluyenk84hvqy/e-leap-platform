/**
 * Verify answers against the SERVER'S active assignment, never browser-provided
 * policy. Empty responses are permitted (unanswered count belongs to pedagogy);
 * client supplied score, role or class identity is ignored.
 */
export function validateAssignedResponse(assignment,payload){
 if(!assignment||typeof assignment!=='object')
   return {ok:false,code:'ASSIGNMENT_MISSING',error:'Active assignment is required'};
 if(!payload||typeof payload!=='object'||Array.isArray(payload))
   return {ok:false,code:'INVALID_RESPONSE',error:'Response must be an object'};
 if(typeof payload.resourceId!=='string'||payload.resourceId!==String(assignment.resource_id))
   return {ok:false,code:'RESOURCE_MISMATCH',error:'Response is not for this assigned lesson'};
 if(!assignment.activity_id||typeof payload.activityId!=='string'||payload.activityId!==String(assignment.activity_id))
   return {ok:false,code:'ACTIVITY_MISMATCH',error:'Response is not for this assigned activity'};
 if(!Object.prototype.hasOwnProperty.call(payload,'value')||payload.value===null||payload.value===undefined)
   return {ok:false,code:'ANSWER_MISSING',error:'Response value is missing'};
 let size;
 try{size=JSON.stringify(payload).length}catch{return {ok:false,code:'INVALID_RESPONSE',error:'Response is not serializable'};}
 if(size>64000)return {ok:false,code:'RESPONSE_TOO_LARGE',error:'Response exceeds storage limit'};
 // Only the actual answer, server-verified identifiers can be stored.
 return {ok:true,response:{resourceId:String(assignment.resource_id),activityId:String(assignment.activity_id),value:payload.value}};
}
