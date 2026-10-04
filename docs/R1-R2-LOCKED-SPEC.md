# E-LEAP R1–R2 LOCKED SPEC

## R1 — Role & Permission Matrix
Roles: Guest, Student, Teacher, Admin. Presentation is a mode that inherits Teacher/Admin permissions. Teacher content editing requires an explicit content-edit grant. Device affects layout only. Session code affects live-session context only. Assessment policy controls Submit/Check/Reveal/Reset.

## R2 — Shell Governance
Lifecycle: Draft → Published → Hidden → Archived. Lock is independent. No hard delete in normal UI. IDs remain stable on rename/move. Move requires compatibility validation. Duplicate creates new IDs and does not copy learner evidence. Archive retains submissions/progress/research evidence. Version History and Audit Log are part of governance. System taxonomy is protected. Progress is derived data, not a CRUD content tree.

## Preview implementation note
This package implements the R1/R2 UI/runtime contract using localStorage as a preview persistence adapter. It is not a substitute for authenticated server-side RBAC. Real learner/research data must not rely on client-side role switching.
