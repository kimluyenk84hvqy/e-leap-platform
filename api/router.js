import authLogin from '../server/auth/login.js';
import authLogout from '../server/auth/logout.js';
import authMe from '../server/auth/me.js';
import authSetupAdmin from '../server/auth/setup-admin.js';
import authUsers from '../server/auth/users.js';
import authStudent from '../server/auth/student.js';
import authChangePassword from '../server/auth/change-password.js';
import authRecovery from '../server/auth/recovery.js';

import researchAssignments from '../server/research/assignments.js';
import researchBootstrap from '../server/research/bootstrap.js';
import researchClasses from '../server/research/classes.js';
import researchEvents from '../server/research/events.js';
import researchExport from '../server/research/export.js';
import researchFeedback from '../server/research/feedback.js';
import researchGrades from '../server/research/grades.js';
import researchMarking from '../server/research/marking.js';
import researchMockTests from '../server/research/mock-tests.js';
import researchParticipants from '../server/research/participants.js';
import researchReport from '../server/research/report.js';
import researchSessions from '../server/research/sessions.js';
import researchShells from '../server/research/shells.js';
import researchSubmissions from '../server/research/submissions.js';
import researchUsers from '../server/research/users.js';

const ROUTES={
  'auth/login':authLogin,
  'auth/logout':authLogout,
  'auth/me':authMe,
  'auth/setup-admin':authSetupAdmin,
  'auth/users':authUsers,
  'auth/student':authStudent,
  'auth/change-password':authChangePassword,
  'auth/recovery':authRecovery,
  'research/assignments':researchAssignments,
  'research/bootstrap':researchBootstrap,
  'research/classes':researchClasses,
  'research/events':researchEvents,
  'research/export':researchExport,
  'research/feedback':researchFeedback,
  'research/grades':researchGrades,
  'research/marking':researchMarking,
  'research/mock-tests':researchMockTests,
  'research/participants':researchParticipants,
  'research/report':researchReport,
  'research/sessions':researchSessions,
  'research/shells':researchShells,
  'research/submissions':researchSubmissions,
  'research/users':researchUsers
};

export default async function handler(req,res){
  const group=String(req.query?.group||'').trim();
  const name=String(req.query?.name||'').trim();
  const key=`${group}/${name}`;
  const target=ROUTES[key];
  if(!target)return res.status(404).json({ok:false,error:'API route not found'});
  return target(req,res);
}
