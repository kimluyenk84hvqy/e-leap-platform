# E-LEAP Pedagogical Constitution v1.0 — AI authoring standard
**Status:** Approved *design candidate* for Preview, not a published production policy. Derived from E-LEAP's existing locked lesson-template contract, role contract and the teacher's feedback in this project. This document is a teaching-quality requirement, **not** a claim about exact textbook content.

## A. Core mission
Produce classroom-ready, source-grounded interactive English lessons. Judge every teaching step from TWO perspectives: (1) can the teacher facilitate it naturally in real time, and (2) does each learner know precisely what to do, how to start, what to produce, and how feedback occurs? Avoid additional slides when multiple staged activities can share one 16:9 screen.

## B. Ten non-negotiable pedagogical principles
1. **Source fidelity first.** Preserve textbook tasks, wording, questions, answer counts, image/audio alignment, and curricular sequence. AI must not fabricate an answer, quote, transcript, audio timestamp or textbook question. If evidence is unavailable, label it *not source-verified* and do not expose a fake Show Answer.
2. **Outcome-led learning.** A lesson aim must identify knowledge, skill/action and observable outcome; use Bloom-aligned action verbs where meaningful. Aims must correspond to classroom activities, not empty decoration.
3. **Meaningful progression.** Lead-in activates context; each subsequent step prepares a necessary capability for the next; completion and transfer are not interchangeable.
4. **One step = one learner action and observable output.** Every state carries a concrete instruction, learner response/product and a way to check it. "Discuss", "Predict" and "Compare" alone are insufficient.
5. **Scaffolding without doing the task.** Give concise worked example, vocabulary, language frame or visual cue as appropriate to level; remove support progressively. Examples must not reveal hidden textbook keys.
6. **Individual accountability before collaboration.** In pair/group lessons, individuals first record ideas. Establish roles and a sharing/teach-back moment; everyone contributes.
7. **Evidence before explanation.** For Reading, evidence is a verified text location and explanation of why it supports an answer. For Listening, learners record real heard words or phrases before peer comparison; model may not invent what was heard.
8. **Interactive checks are functional.** Correct Check/Reset/Score/Submit/Reveals remain role-controlled. Show Answer is Teacher/Admin/Presentation only, default per-item; student/guest must never access teacher keys.
9. **Projection-first visual design.** Genuine relevant photos are preferred where licensed, centered and editable (crop/focal position); no image text contamination; 16:9, large bold typography, strong contrast, no giant empty panels, no clipping, no developer notes on projected slides.
10. **Teacher approval & recoverability.** AI outputs are draft suggestions with traceable sources and acceptance/rejection. Never overwrite published lessons, mutate unrelated slides, auto-publish or delete assets. Respect existing version and permissions.

## C. Six mandatory review fields for EVERY teaching step
- **Purpose:** Why is this specific step necessary to achieve the lesson objective?
- **Instruction:** Exact short, learner-facing imperative; who works, on what, using what source, and what to produce?
- **Input & scaffolding:** The verified resource, worked example, word bank or sentence starter (not a fabricated key).
- **Output:** Concrete and visible response: choices/notes/evidence pair/group report/sentence.
- **Checking and feedback:** Self/peer/teacher/verified key; explicit evidence and why where warranted.
- **Transition:** Natural bridge to next step based on the completed learner output.

## D. Function-specific acceptance rules
### Warm-up / Lead-in
Use one clear visual/context; Observe → Predict → Pair-share → explicit bridge to the target question. Student identifies a concrete clue; teacher does not announce the answer prematurely.
### Vocabulary
Elicit in context → meaning verification → form/pronunciation → short controlled retrieval → personal sentence/application. Include an exact learner product for each stage.
### Grammar
Context & examples → notice form and meaning → learner hypothesis → compare → verified rule/check → controlled practice → personal use. Do not write the correct answer twice in the same gap or reveal a rule as a blank guessed by AI.
### Reading
Pre-reading prediction where useful; meaningful individual sections if jigsaw; expert share → home-group teach-back → textbook exercise → verified evidence and why. Do not infer source quotes or page references.
### Listening
Pre-listening prepares *the information needed by the actual task*. Listen 1 records answers or gist; Listen 2 records real heard clues, then peer comparison, then verified checking. Comparisons without recorded output are pedagogically invalid. Gist is optional—not compulsory if task doesn't support it.
### Speaking
Think/prepare answer → provide age-appropriate language frame → pair rehearsal with follow-up → report partner's idea → self/peer/teacher feedback; balance fluency and correctness.
### Writing
Analyse task/rubric → brainstorm → plan → produce → peer review against criteria → revise/share; avoid model answer copy-as-product.
### Assessment/exit
Output aligned to aims; purposeful correction, not just score. Unanswered count in denominator. Distinguish Check from Submit.

## E. AI output rules
- Return structured step proposals only; don't create executable HTML/JS from the model response.
- Every proposal identifies `sourceRefs` and differentiates source-confirmed facts from newly authored pedagogy.
- When content is missing, request only a **specific input slot** (e.g. "transcript for Track 22 question 3") rather than improvising.
- Suggest the smallest meaningful set of screens; steps of a combo can be states on one screen.
- Teacher-only guidance belongs to Studio properties; learner instructions only on student-facing canvas.
- Keep instruction English suitable for the class; keep administrative/editor commentary out of slides.
- Do not claim a slot has been verified just because an AI response marks it verified.

## F. Review scoring (0–2 each, maximum 12)
**Goal fit**, **specific instructions**, **scaffold fitness**, **observable output**, **evidence/checking**, **visual feasibility**.
0 = missing/unusable; 1 = partial/needs teacher repair; 2 = classroom-ready with verified material.
**Hard blockers** override numeric totals: invented key/evidence, missing original source for textbook answer, unauthorized answer reveal, no meaningful learner output, missing required media, unlicensed/uncleared image, runtime defect, clipped/offscreen work.
- 10–12 with zero blockers: candidate for teacher review; not auto-publish.
- 7–9: revise before teacher approval.
- 0–6 or any hard blocker: reject as classroom-ready.

## G. Feedback learning loop (not model weight training)
Capture `proposalId`, source snapshot hash, methodId, scope, proposed steps, teacher action (accept/revise/reject), reasons, final corrected version and rubric ratings. Only teacher-approved, rights-cleared, source-grounded examples may become `golden`; rejections become counterexamples. Version every rule and golden example. No silent self-training from student data.

## H. Coverage / research evidence
Track teaching purpose, generated vs edited steps, evidence quality, teacher review time, correction counts, learner activity completeness and (only with appropriate consent/controls) aggregated learning outcomes. The study design must distinguish AI proposal, teacher-edited draft and delivered lesson; never misstate correlation as learning impact.

## I. Trace to existing E-LEAP contracts
- `docs/contracts/LESSON-TEMPLATE-CONTRACT-V1.0.md`: cover, fonts, layouts, role controls, reveal policy.
- `assets/js/authoring/hybrid-pedagogy-contract.js`: current slot taxonomy and accountability.
- `assets/js/authoring/method-combo-catalog.js`: existing method steps and source fidelity.
- `docs/architecture/STUDIO-AI-HYBRID-V1.md`: AI safety, preflight, review and cost constraints.
- `assets/js/authoring/teaching-combo-registry.js`: current step-based runtime combos; not all legacy ones yet satisfy this rubric.

## J. Rollout discipline
Preview only. An architecture, golden library or validator commit must not enable AI calls or media uploads. AI credentials and any future model invocation require a separate authorized, tested feature release. No Production changes.
