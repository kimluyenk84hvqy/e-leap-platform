/* =========================================================
   E-LEAP Standalone Learning Bridge v1.4
   Research-ready / Production-safe

   v1.4
   ---------------------------------------------------------
   - Preserve platform-host forwarding
   - Preserve local QA recovery log
   - Send research telemetry to /api/research/events
   - Read session / teacher / class / participant context
   - Capture activity views
   - Capture media played / completed
   - Capture submit / check
   - Calculate normal activity correctness directly
     from LESSON data + current DOM
   - Preserve video-round correctness
   - Debounce response.drafted so every keystroke is NOT
     written to the database
   - Research failure must NEVER break the lesson
   ========================================================= */

(function () {
  'use strict';

  /* =======================================================
     1. CONFIG
     ======================================================= */

  const cfg =
    window.ELEAP_LESSON_BRIDGE || {};

  const resourceId =
    cfg.resourceId ||
    document.documentElement.dataset.resourceId ||
    'unknown-resource';

  const courseId =
    cfg.courseId ||
    'objective-first-b2';

  const unitId =
    cfg.unitId ||
    'unit-01';

  const lessonId =
    cfg.lessonId ||
    resourceId;

  const researchLessonId =
    cfg.researchLessonId ||
    lessonId.replace(
      /-u(\d+)-l(\d+)$/,
      '/u$1/l$2'
    );

  const localKey =
    'e-leap-standalone-events:' +
    resourceId;

  const DRAFT_DELAY = 1200;


  /* =======================================================
     2. EVENT ID
     ======================================================= */

  function uid() {
    try {
      if (
        globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === 'function'
      ) {
        return globalThis.crypto.randomUUID();
      }
    } catch (_) {}

    return (
      'evt-' +
      Date.now() +
      '-' +
      Math.random()
        .toString(16)
        .slice(2)
    );
  }


  /* =======================================================
     3. NORMALIZE ANSWER
     ======================================================= */

  function normalizeAnswer(value) {
    return String(value ?? '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }


  function matchesExpected(
    value,
    expected
  ) {
    const actual =
      normalizeAnswer(value);

    const values =
      Array.isArray(expected)
        ? expected
        : [expected];

    return values.some(
      item =>
        normalizeAnswer(item) ===
        actual
    );
  }


  /* =======================================================
     4. CURRENT ACTIVITY
     ======================================================= */

  function currentScreenNumber() {
    return (
      Number(
        document.body.dataset.screen
      ) || 1
    );
  }


  function currentActivityData() {
    if (
      !window.LESSON ||
      !Array.isArray(
        window.LESSON.activities
      )
    ) {
      return null;
    }

    const index =
      Math.max(
        0,
        currentScreenNumber() - 1
      );

    return (
      window.LESSON.activities[index] ||
      null
    );
  }


  function activityId() {
    const data =
      currentActivityData();

    if (data?.id) {
      return data.id;
    }

    const active =
      document.querySelector(
        '.screen.active'
      );

    if (
      active?.dataset.screen
    ) {
      return (
        'screen-' +
        active.dataset.screen
      );
    }

    return (
      'screen-' +
      currentScreenNumber()
    );
  }


  /* =======================================================
     5. RESEARCH CONTEXT
     ======================================================= */

  function researchRuntime() {
    const runtime =
      window.ELEAP_RESEARCH_CONTEXT ||
      {};

    let params;

    try {
      params =
        new URLSearchParams(
          window.location.search
        );
    } catch (_) {
      params =
        new URLSearchParams();
    }

    return {
      sessionId:
        runtime.sessionId ||
        params.get('sessionId') ||
        null,

      teacherId:
        runtime.teacherId ||
        params.get('teacherId') ||
        null,

      classId:
        runtime.classId ||
        params.get('classId') ||
        null,

      participantId:
        runtime.participantId ||
        params.get('participantId') ||
        null
    };
  }


  function lessonContext() {
    const runtime =
      researchRuntime();

    return {
      mode:
        cfg.mode ||
        'standalone',

      courseId,

      unitId,

      lessonId,

      researchLessonId,

      sessionId:
        runtime.sessionId,

      teacherId:
        runtime.teacherId,

      classId:
        runtime.classId,

      participantId:
        runtime.participantId
    };
  }


  /* =======================================================
     6. SNAPSHOT
     ======================================================= */

  function snapshot() {
    const root =
      document.querySelector(
        '.screen.active'
      ) ||
      document;

    const inputs =
      [
        ...root.querySelectorAll(
          'input,textarea,select'
        )
      ].map(
        (el, index) => ({
          name:
            el.name ||
            el.id ||
            (
              el.dataset.answerIndex !==
              undefined
                ? 'answer-' +
                  el.dataset.answerIndex
                : 'field-' + index
            ),

          type:
            el.type ||
            el.tagName.toLowerCase(),

          value:
            el.type === 'checkbox' ||
            el.type === 'radio'
              ? el.checked
              : el.value
        })
      );

    const selected =
      [
        ...root.querySelectorAll(
          '.selected,' +
          '.matched,' +
          '.answer-correct,' +
          '.answer-wrong,' +
          '.option-correct,' +
          '.option-wrong'
        )
      ]
        .slice(0, 100)
        .map(
          el =>
            (
              el.dataset.value ||
              el.dataset.letter ||
              el.value ||
              el.textContent ||
              ''
            )
              .toString()
              .trim()
        )
        .filter(Boolean);

    const activity=currentActivityData();
    if(activity?.type==='video-responses'){
      try{
        if(typeof videoRoundState!=='undefined' && Array.isArray(videoRoundState.answers)){
          const current=document.querySelector('#roundAnswer');
          if(current) videoRoundState.answers[videoRoundState.round]=current.value;
          return {
            inputs:videoRoundState.answers.slice(0,activity.expected?.length||activity.videos?.length||6).map((value,index)=>({name:'video-'+index,type:'text',value})),
            selected
          };
        }
      }catch(_){}
    }

    return {
      inputs,
      selected
    };
  }


  /* =======================================================
     7. NORMAL ACTIVITY ASSESSMENT
     ======================================================= */

  function calculateNormalAssessment() {
    const activity = currentActivityData();
    if (!activity) return null;

    /* Six-video previous-lesson activity keeps all six answers in videoRoundState. */
    if (activity.type === 'video-responses' && Array.isArray(activity.expected)) {
      let answers = [];
      try {
        if (typeof videoRoundState !== 'undefined' && Array.isArray(videoRoundState.answers)) {
          const current = document.querySelector('#roundAnswer');
          if (current) videoRoundState.answers[videoRoundState.round] = current.value;
          answers = videoRoundState.answers.slice(0, activity.expected.length);
        }
      } catch (_) {}
      while (answers.length < activity.expected.length) answers.push('');
      const total = activity.expected.length;
      const answered = answers.filter(v => normalizeAnswer(v) !== '').length;
      const correct = answers.reduce((n, value, i) => n + (normalizeAnswer(value) !== '' && matchesExpected(value, activity.expected[i]) ? 1 : 0), 0);
      return {
        isCorrect: correct === total,
        score: total ? correct / total : null,
        correctCount: correct,
        answeredCount: answered,
        wrongCount: Math.max(0, answered - correct),
        unansweredCount: Math.max(0, total - answered),
        totalCount: total,
        source: 'lesson-data-video-rounds'
      };
    }

    let assessable = 0;
    let answered = 0;
    let correct = 0;

    if (Array.isArray(activity.expected)) {
      const inputs = [...document.querySelectorAll('input[data-answer-index],textarea[data-answer-index]')];
      inputs.forEach(el => {
        const index = Number(el.dataset.answerIndex);
        const expected = activity.expected[index];
        if (expected === undefined) return;
        assessable++;
        if (normalizeAnswer(el.value) !== '') answered++;
        if (normalizeAnswer(el.value) !== '' && matchesExpected(el.value, expected)) correct++;
      });
    }

    if (Array.isArray(activity.optionExpected)) {
      activity.optionExpected.forEach((expected, questionIndex) => {
        const options = [...document.querySelectorAll(`.option[data-q="${questionIndex}"]`)];
        if (!options.length) return;
        assessable++;
        const selected = options.find(option => option.classList.contains('selected'));
        if (selected) answered++;
        if (selected && matchesExpected(selected.textContent, expected)) correct++;
      });
    }

    if (assessable === 0) return null;
    return {
      isCorrect: correct === assessable,
      score: correct / assessable,
      correctCount: correct,
      answeredCount: answered,
      wrongCount: Math.max(0, answered - correct),
      unansweredCount: Math.max(0, assessable - answered),
      totalCount: assessable,
      source: 'lesson-data'
    };
  }


  /* =======================================================
     8. DOM / VIDEO ASSESSMENT
     ======================================================= */

  function calculateDomAssessment() {
    const root = document.querySelector('.screen.active') || document;
    const wrong = root.querySelectorAll('.answer-wrong,.option-wrong').length;
    const correct = root.querySelectorAll('.answer-correct,.option-correct').length;
    const total = correct + wrong;
    if (!total) return null;
    return {
      isCorrect: wrong === 0 && correct === total,
      score: correct / total,
      correctCount: correct,
      answeredCount: total,
      wrongCount: wrong,
      unansweredCount: 0,
      totalCount: total,
      source: 'dom-assessment'
    };
  }


  /* =======================================================
     9. FINAL ASSESSMENT RESULT
     ======================================================= */

  function getAssessmentResult() {
    /*
      First preference:
      calculate directly from LESSON answer key.
    */

    const normal =
      calculateNormalAssessment();

    if (normal) {
      return normal;
    }


    /*
      Second preference:
      DOM state, especially video rounds.
    */

    const dom =
      calculateDomAssessment();

    if (dom) {
      return dom;
    }


    /*
      Third preference:
      lesson engine published result.
    */

    const stored =
      window.ELEAP_LAST_RESULT;

    if (
      stored &&
      typeof stored.isCorrect ===
        'boolean'
    ) {
      return {
        isCorrect:
          stored.isCorrect,

        score:
          typeof stored.score ===
            'number'
            ? stored.score
            : (
                stored.isCorrect
                  ? 1
                  : 0
              ),

        source:
          'lesson-engine'
      };
    }


    return {
      isCorrect:
        null,

      score:
        null,

      correctCount:
        null,

      totalCount:
        null,

      source:
        null
    };
  }


  function getActivityCapabilities(){
    const n=Math.max(0,(Number(document.body?.dataset?.screen)||1)-1);
    const a=window.LESSON?.activities?.[n]||null;
    if(!a)return {check:false,reset:false,submit:false,score:false,assessable:false};
    const objective=Array.isArray(a.expected)||Array.isArray(a.optionExpected);
    const root=document.querySelector('#content')||document;
    const hasFields=!!root.querySelector('input,textarea,select');
    const hasOptions=!!root.querySelector('.option,.round-answer');
    const productive=['reading-questions','structure-questions','productive-homework','consolidation-rich'].includes(a.type)||Array.isArray(a.presentationExpected);
    const submit=objective||productive||hasFields||hasOptions||a.type==='video-responses';
    const reset=submit||!!document.querySelector('#reset');
    return {check:objective,reset,submit,score:objective,assessable:objective};
  }


  /* =======================================================
     10. LOCAL RECOVERY
     ======================================================= */

  function saveLocal(event) {
    try {
      const rows =
        JSON.parse(
          localStorage.getItem(
            localKey
          ) ||
          '[]'
        );

      rows.push(event);

      localStorage.setItem(
        localKey,
        JSON.stringify(
          rows.slice(-250)
        )
      );
    } catch (_) {}
  }


  /* =======================================================
     11. SEND TO RESEARCH API
     ======================================================= */

  async function sendToResearch(event) {
    try {
      const runtime =
        researchRuntime();

      const result =
        event.assessment ||
        getAssessmentResult();

      const response =
        await fetch(
          '/api/research/events',
          {
            method:
              'POST',

            credentials:
              'same-origin',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                clientEventId:
                  event.eventId,

                sessionId:
                  runtime.sessionId,

                teacherId:
                  runtime.teacherId,

                classId:
                  runtime.classId,

                participantId:
                  runtime.participantId,

                lessonId:
                  researchLessonId,

                activityId:
                  event.activityId,

                eventType:
                  event.eventType,

                answer:
                  event.payload ||
                  null,

                isCorrect:
                  result?.isCorrect ??
                  null,

                score:
                  result?.score ??
                  null,

                occurredAt:
                  event.occurredAt,

                metadata: {
                  source:
                    'e-leap-standalone-bridge',

                  bridgeVersion:
                    '1.4',

                  resourceId,

                  courseId,

                  unitId,

                  mode:
                    cfg.mode ||
                    'standalone',

                  assessmentSource:
                    result?.source ||
                    null,

                  correctCount:
                    result?.correctCount ??
                    null,

                  totalCount:
                    result?.totalCount ??
                    null
                }
              })
          }
        );

      if (!response.ok) {
        console.warn(
          'E-LEAP research event rejected:',
          response.status
        );

        return null;
      }

      try {
        return await response.json();
      } catch (_) {
        return {
          ok:
            true
        };
      }

    } catch (error) {
      console.warn(
        'E-LEAP research telemetry unavailable:',
        error
      );

      return null;
    }
  }


  /* =======================================================
     12. EMIT
     ======================================================= */

  function emit(
    eventType,
    payload = {},
    assessment = null
  ) {
    const runtime =
      researchRuntime();

    const event = {
      eventId:
        uid(),

      eventType,

      occurredAt:
        new Date()
          .toISOString(),

      resourceId,

      activityId:
        activityId(),

      studentId:
        null,

      sessionId:
        runtime.sessionId,

      context:
        lessonContext(),

      payload,

      assessment,

      source:
        'compatibility-bridge'
    };


    if (
      window.parent !== window
    ) {
      try {
        window.parent.postMessage(
          {
            type:
              'e-leap:learning-event',

            event
          },

          location.origin
        );
      } catch (_) {}
    }


    if (
      window.parent === window
    ) {
      saveLocal(event);
    }


    try {
      window.dispatchEvent(
        new CustomEvent(
          'e-leap:lesson-event',
          {
            detail:
              event
          }
        )
      );
    } catch (_) {}


    sendToResearch(event);

    return event;
  }


  /* =======================================================
     13. DEBOUNCED DRAFT EVENTS
     ======================================================= */

  const draftTimers =
    new WeakMap();


  document.addEventListener(
    'input',

    event => {
      const target =
        event.target;

      if (
        !target ||
        !target.matches(
          'input,textarea,select'
        )
      ) {
        return;
      }


      const previous =
        draftTimers.get(target);

      if (previous) {
        clearTimeout(previous);
      }


      const timer =
        setTimeout(
          () => {
            emit(
              'response.drafted',
              {
                field:
                  target.name ||
                  target.id ||
                  (
                    target.dataset
                      .answerIndex !==
                    undefined
                      ? 'answer-' +
                        target.dataset
                          .answerIndex
                      : null
                  ),

                value:
                  target.type ===
                  'password'
                    ? '[redacted]'
                    : target.value
              }
            );

            draftTimers.delete(
              target
            );
          },

          DRAFT_DELAY
        );


      draftTimers.set(
        target,
        timer
      );
    },

    true
  );


  /* =======================================================
     14. MEDIA EVENTS
     ======================================================= */

  document.addEventListener(
    'play',

    event => {
      const target =
        event.target;

      if (
        !target ||
        !target.matches(
          'audio,video'
        )
      ) {
        return;
      }

      emit(
        'media.played',
        {
          src:
            target.currentSrc ||
            target.getAttribute(
              'src'
            ) ||
            null
        },

        {
          isCorrect:
            null,

          score:
            null,

          source:
            null
        }
      );
    },

    true
  );


  document.addEventListener(
    'ended',

    event => {
      const target =
        event.target;

      if (
        !target ||
        !target.matches(
          'audio,video'
        )
      ) {
        return;
      }

      emit(
        'media.completed',
        {
          src:
            target.currentSrc ||
            target.getAttribute(
              'src'
            ) ||
            null
        },

        {
          isCorrect:
            null,

          score:
            null,

          source:
            null
        }
      );
    },

    true
  );


  /* =======================================================
     15. BUTTON EVENTS
     ======================================================= */

  document.addEventListener(
    'click',

    event => {
      const button =
        event.target.closest(
          'button'
        );

      if (!button) {
        return;
      }


      /* ---------------------------------------------------
         CHECK
         --------------------------------------------------- */

      if (
        button.matches(
          '#check,' +
          '[id^="check"],' +
          '.item-check'
        )
      ) {
        /*
          Allow app.js to finish its own
          Check processing first.
        */

        setTimeout(
          () => {
            const result =
              getAssessmentResult();

            emit(
              'attempt.checked',
              {
                response:
                  snapshot(),

                isCorrect:
                  result.isCorrect,

                score:
                  result.score
              },

              result
            );
          },

          80
        );

        return;
      }


      /* ---------------------------------------------------
         VIDEO ROUND SUBMIT
         --------------------------------------------------- */

      if (
        button.matches(
          '#roundSubmit'
        )
      ) {
        setTimeout(
          () => {
            const result =
              getAssessmentResult();

            emit(
              'response.submitted',
              {
                response:
                  snapshot(),

                isCorrect:
                  result.isCorrect,

                score:
                  result.score,

                submissionType:
                  'video-round'
              },

              result
            );
          },

          100
        );

        return;
      }


      /* ---------------------------------------------------
         NORMAL SUBMIT
         --------------------------------------------------- */

      if (
        button.matches(
          '#submit,' +
          '.submit'
        )
      ) {
        setTimeout(
          () => {
            const result =
              getAssessmentResult();

            emit(
              'response.submitted',
              {
                response:
                  snapshot(),

                isCorrect:
                  result.isCorrect,

                score:
                  result.score
              },

              result
            );
          },

          80
        );

        return;
      }


      /* ---------------------------------------------------
         NAVIGATION
         --------------------------------------------------- */

      if (
        button.matches(
          '#next,' +
          '#nextBtn,' +
          '#prev,' +
          '.navbtn,' +
          '.item-tab,' +
          '.round-next,' +
          '.round-dot,' +
          '#roundPrev,' +
          '#roundNext'
        )
      ) {
        setTimeout(
          () => {
            emit(
              'activity.viewed',
              {},

              {
                isCorrect:
                  null,

                score:
                  null,

                source:
                  null
              }
            );
          },

          40
        );
      }
    },

    true
  );


  /* =======================================================
     16. INITIAL LOAD
     ======================================================= */

  window.addEventListener(
    'load',

    () => {
      emit(
        'activity.viewed',
        {
          initial:
            true
        },

        {
          isCorrect:
            null,

          score:
            null,

          source:
            null
        }
      );
    }
  );


  /* =======================================================
     17. PUBLIC API
     ======================================================= */

  window.ELEAP = {
    emit,

    snapshot,

    resourceId,

    courseId,

    unitId,

    lessonId,

    researchLessonId,

    getResearchContext:
      researchRuntime,

    getAssessmentResult,

    getActivityCapabilities,

    calculateNormalAssessment,

    calculateDomAssessment
  };

})();
