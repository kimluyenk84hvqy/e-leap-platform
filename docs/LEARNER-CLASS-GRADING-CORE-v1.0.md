# Learner / Class / Grading Core v1.0

Foundation entities: Learner, Class, Membership/Enrollment, Session, Attempt, Submission, Grade, Feedback, Progress Event. Registered learners use Student ID + Full Name in the UI, with hidden immutable learner key and pseudonymous Research ID. Guest practice is supported separately. Objective work can auto-grade; Writing/Speaking use AI-assisted suggestions with teacher review/override and teacher-controlled final feedback.

This package intentionally does not pretend that browser localStorage is a Production backend. The UI/data contracts are established now; authenticated server-side persistence, permissions, concurrency and load testing are the deployment phase.
