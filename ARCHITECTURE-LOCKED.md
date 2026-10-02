# E-LEAP Production Foundation v1.0 — Architecture & Operations Locked
Locked: 2026-10-02

Core product loop: Advanced Skills/BG (LEARN) → Skills Lab (PRACTISE) → Mock Tests (ASSESS) → Progress (DIAGNOSE) → targeted relearning.

Locked foundations: modular Shell Engine; Resource Manager; Advanced Skills reusable Core Modules; CEFR as level/competency metadata; VSTEP/IELTS as exam pathways; lightweight learner identity; Classes/Membership/Live Session; Guest-ready practice contract; Attempts/Submissions; objective auto-grading contract; AI-assisted but teacher-controlled Writing/Speaking feedback; unified Progress; pseudonymous Research ID and learning-event contract; responsive UI; externalized private media.

Admin/Teacher shell operations exposed in UI: Add Sub-shell, Rename, Move, Reorder, Duplicate, Hide/Show, Archive. Resource operations exposed: Add Resource/Interactive Lesson/Interactive Activity/approved link/reuse metadata.

Important production boundary: this package is a static Production Foundation. Preview mutations persist in browser localStorage. Real multi-user persistence, authentication, file uploads, QR rendering, concurrency, server-side grading and durable research exports require the authenticated backend/storage layer. Do not represent local preview persistence as a deployed multi-user backend.
