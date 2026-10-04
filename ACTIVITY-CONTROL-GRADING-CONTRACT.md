# E-LEAP Activity Control + Grading Contract — R4 RC1.2

Locked semantics for all future Courses, Skills Lab, Assignments and Mock Tests.

## Capability contract
Each activity must expose/derive these booleans: `check`, `reset`, `submit`, `score`, `assessable`. The host shows controls from these capabilities, not merely from user role.

- Objective activity: Check + Reset + Student Submit + Score.
- Productive/open activity: Reset + Student Submit; no automatic Score unless a valid rubric/engine is attached.
- Guest: never learner-state Submit.
- Mock Test policy may suppress Check/reveal while preserving the same grading schema.

## Controls
- **Check** = grade/evaluate the current state; does not submit learner state.
- **Reset** = clear the current activity and return it to its initial learner state.
- **Submit** = save the current state of the current attempt. Student only.
- **Guest Practice** = may Check and Reset, receives immediate feedback/score where auto-grading exists, but learner-state events are not stored as student progress/responses.

## Scoring
For an auto-graded activity with `totalCount` items:
- `score = correctCount / totalCount`
- unanswered items remain `unanswered`, not `wrong`
- unanswered items receive 0 points in the official activity score

Example: 6 items; learner answers 3; 2 correct, 1 wrong:
- Answered: 3/6
- Correct: 2
- Wrong: 1
- Unanswered: 3
- Score: 2/6 = 33%

## Incomplete submission
If an auto-graded activity has unanswered items, Student Submit must warn before saving:
- Continue working
- Submit anyway

If submitted anyway, unanswered items receive 0 points and remain explicitly labelled `unanswered`.

## Attempts and repeated Submit
- **Submission is not an Attempt.**
- Repeated Submit during the same activity attempt updates the same attempt (`attemptNo = 1`) and increments `submitCount`.
- Raw submission events remain available for research/audit logs.
- Teacher Responses shows the **latest submitted state** per participant + activity + attempt, avoiding duplicate cards for repeated Submit clicks.
- A new attempt is created only by an explicit future `Try again / Start new attempt` policy action.

## Product-area policies
- Course Practice / Skills Lab: repeated Submit can update the same attempt; future Progress may expose latest + best score.
- Assignment/Homework: attempt limits and grading policy will be configured by teacher; same grading core.
- Mock Test: no per-question Check or answer reveal during the test; final submit/auto-submit policy will use the same scoring core.
- Writing/Speaking: response can be submitted but may be teacher/rubric/AI-assisted graded rather than hard auto-graded.

## Golden Reference compatibility
U1.1 and U1.2 keep their lesson content and Next/Previous navigation. R4 RC1.2 adds a host-level universal control contract and compatibility adapters only.
