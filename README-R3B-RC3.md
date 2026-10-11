# R3B RC3 — Host authority + legacy lesson stabilization

- Platform lesson-host is the single visible role/mode authority for hosted lessons.
- Hosted U1.1/U1.2 internal Student/Teacher/Presentation switches are hidden; runtime mode is applied programmatically.
- Host bar shows Guest practice / Student / Teacher / Admin / Presentation.
- Teacher/Admin Presentation is controlled from lesson-host and can return to the authenticated role.
- U1.1 shell readiness no longer waits for slow private media before the loading overlay disappears. Media may continue loading after the lesson UI is usable.
- This is a compatibility stabilization for Golden References; new lessons must use the shared runtime/templates rather than legacy controllers.
