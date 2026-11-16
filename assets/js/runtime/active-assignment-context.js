/* Read-only hint from the Assignments page, never a grant of authority.
 * The server must still validate Student identity, class membership and assignment.
 */
export const ACTIVE_ASSIGNMENT_KEY='e-leap-active-assignment-v1';
export function resolveOpenedAssignment({lesson,activity,active,now=Date.now()}={}){
 if(!lesson||!activity||!active||typeof active!=='object')return null;
 const resourceId=String(lesson.resourceId||lesson.id||'');
 const activityId=String(activity.id||'');
 if(!resourceId||!activityId||active.resourceId!==resourceId||active.activityId!==activityId)return null;
 const startedAt=Date.parse(active.startedAt||'');
 if(!Number.isFinite(startedAt)||startedAt>now+60000||now-startedAt>12*60*60*1000)return null;
 return /^[0-9a-f-]{36}$/i.test(String(active.assignmentId||''))?String(active.assignmentId):null;
}
