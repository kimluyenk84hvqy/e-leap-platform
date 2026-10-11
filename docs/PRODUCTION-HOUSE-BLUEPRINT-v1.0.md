# E-LEAP Production House Blueprint v1.0

## Product identity
E-LEAP — English Learning, Engagement and Assessment Platform.

## Core rule
Build shells as configurable data, not fixed pages. Content resources are independent from learning data. Stable IDs survive rename/move/archive operations.

## Skills Lab
Skill-first navigation: Listening, Speaking, Reading, Writing, Vocabulary, Grammar.
Listening/Reading/Writing/Speaking tracks: General English, VSTEP, IELTS, Medical English, Pharmaceutical English. Each track follows its own authentic structure. General English uses CEFR. VSTEP and IELTS use exam-appropriate Parts/Tasks/Question Types. Specialist English uses admin-defined Topics. Practice Set is the final shell before an Interactive Activity/Resource.
Grammar and Vocabulary are competence-led: General English CEFR plus specialist domains/topics. Exam names are metadata/filters rather than primary grammar/vocabulary shells.
Skills Lab is always open for self-study; Guest access is allowed by policy.

## Assignments
Resource/Activity → Assign to class/learner → Available From → Deadline → Attempts/Late Policy → Publish → Submit → Auto/AI/Teacher Review → Final Grade/Feedback → Progress. Assignment records reference canonical Resource IDs; content is not duplicated.

## Mock Tests
General English contains VSTEP and IELTS as sibling test tracks. Medical English and Pharmaceutical English are sibling domains. One Assessment Engine supports Practice Mode (always open) and Scheduled Test Mode (open/close window, timer, attempt limit, controlled feedback). Test sections are configurable and are never globally hard-coded to four skills.

## Lightweight identity and classes
Registered learner: Student ID + Full Name + class membership. Guest: lightweight identity, default access to Skills Lab and Mock Practice; Guest data never silently enters official class progress or the main research cohort. Internal immutable learner UUID and pseudonymous Research ID remain hidden from learners.
Teacher creates/opens a class; E-LEAP generates Class Code + QR. Start Class creates a lightweight live session. Recognised members join from any phone/tablet/computer without choosing a device. Guest admission to a live class is a per-session teacher option.

## Concurrent classroom core
Join path stays lightweight; media and lesson content lazy-load after join. Join writes only the minimum session record. Responses/submissions are separate event writes. Teacher live roster updates incrementally. Production acceptance includes 100-concurrent-user load testing and a 200-user headroom test.

## Responsive learning UI
One Activity, one source of truth. Desktop can use two columns; mobile reflows to one column with touch-friendly controls. Learners never select device type. Special interactions may adapt interaction method on small screens without changing learning content.

## Progress and research
Progress aggregates Courses, Skills Lab, Assignments and Mock Tests. Research export uses Research ID rather than visible Student ID/name as the analysis key. Learning events preserve activity, attempt, response, correctness/score, timing, feedback and timestamp. Writing/Speaking may preserve original submission → AI feedback → teacher feedback → revision → final submission.

## Media
Golden Reference U1.1/U1.2 media remains externalised until approved/private media is supplied. The platform must not republish uncleared assets merely to make a preview visually complete.
