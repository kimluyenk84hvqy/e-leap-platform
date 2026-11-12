/* Preview Foundation Lab state machine, reusing E-LEAP's LOCKED control contract.
 * It does not duplicate or substitute the platform's submission/response engine.
 */
import {hasRoleControl} from '../controls/control-shell.js';
export function foundationPermissions(role,{synthetic=false,phase=0}={}){
 const has=id=>hasRoleControl(role,id);
 return {check:has('check')&&phase>0,reset:has('reset'),score:has('score')&&phase>0&&synthetic,
  reveal:has('reveal')&&synthetic,submit:false,exit:has('exit-presentation')};
}
export function executeFoundationAction(model,action,{questionId=null}={}){
 const allowed=foundationPermissions(model.role,{synthetic:model.synthetic,phase:model.phase});
 if(action==='next'||action==='previous'){
  model.phase=Math.max(0,Math.min(2,model.phase+(action==='next'?1:-1)));model.check=null;model.scoreVisible=false;return true;
 }
 if(action==='reset'&&allowed.reset){model.answers.clear();model.revealed.clear();model.check='All answers reset.';model.scoreVisible=false;return true;}
 if(action==='check'&&allowed.check){model.check=model.synthetic?'Synthetic answers checked (no submission).':'Answers recorded; source unverified.';model.scoreVisible=false;return true;}
 if(action==='score'&&allowed.score){model.scoreVisible=true;model.check='Synthetic practice score only.';return true;}
 if(action==='reveal'&&allowed.reveal&&questionId&&model.analysis.source?.tasks?.[model.taskIndex]?.questions?.some(q=>q.id===questionId)){
  model.revealed.has(questionId)?model.revealed.delete(questionId):model.revealed.add(questionId);return true;
 }
 if(action==='exit-presentation'&&allowed.exit){model.role=model.originRole||'teacher';model.revealed.clear();model.check=null;model.scoreVisible=false;return true;}
 return false;
}
