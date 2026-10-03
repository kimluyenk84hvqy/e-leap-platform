/* =========================================================
   E-LEAP Standalone Learning Bridge v1.3
   Research-ready production bridge

   PURPOSE
   ---------------------------------------------------------
   - Preserve standalone lesson operation
   - Preserve platform-host event forwarding
   - Keep lightweight local QA/recovery log
   - Send research telemetry to /api/research/events
   - Read Teacher/Class/Session/Participant context
   - Capture navigation, responses, checks, submissions,
     media use and assessment result
   - Research failures NEVER break the lesson
   ========================================================= */

(function () {
  'use strict';

  /* =======================================================
     1. LESSON CONFIG
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

  /*
    Convert:

    objective-first-b2-u01-l02

    to:

    objective-first-b2/u01/l02
  */

  const researchLessonId =
    cfg.researchLessonId ||
    lessonId.replace(
      /-u(\d+)-l(\d+)$/,
      '/u$1/l$2'
    );

  const localKey =
    'e-leap-standalone-events:' +
    resourceId;


  /* =======================================================
     2. UNIQUE EVENT ID
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
     3. CURRENT ACTIVITY ID
     ======================================================= */

  function activity() {
    /*
      Preferred source:
      LESSON.activities
    */

    if (
      window.LESSON &&
      Array.isArray(
        window.LESSON.activities
      )
    ) {
      const screenNumber =
        Number(
          document.body.dataset.screen
        ) || 1;

      const index =
        Math.max(
          0,
          screenNumber - 1
        );

      return (
        window.LESSON.activities[index]?.id ||
        'screen-' + screenNumber
      );
    }

    /*
      Fallback:
      active DOM screen
    */

    const active =
      document.querySelector(
        '.screen.active'
      );

    if (
      active &&
      active.dataset.screen
    ) {
      return (
        'screen-' +
        active.dataset.screen
      );
    }

    /*
      Final fallback:
      body dataset
    */

    const screen =
      document.body.dataset.screen;

    if (screen) {
      return (
        'screen-' +
        screen
      );
    }

    return null;
  }


  /* =======================================================
     4. RESEARCH CONTEXT
     ======================================================= */

  function researchRuntime() {
    /*
      Context supplied by platform host.
    */

    const runtime =
      window.ELEAP_RESEARCH_CONTEXT ||
      {};

    /*
      Context supplied by URL.

      Example:

      ?sessionId=...
      &teacherId=...
      &classId=...
      &participantId=...
    */

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


  /* =======================================================
     5. GENERAL LESSON CONTEXT
     ======================================================= */

  function context() {
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
     6. RESPONSE SNAPSHOT
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
            'field-' + index,

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
              el.textContent ||
              el.value ||
              ''
            )
              .toString()
              .trim()
        )
        .filter(Boolean);

    return {
      inputs,
      selected
    };
  }


  /* =======================================================
     7. ASSESSMENT RESULT
     ======================================================= */

  function getAssessmentResult() {
    /*
      Preferred source:
      lesson engine result.

      checkActivity() in U1.2 now writes:
      window.ELEAP_LAST_RESULT
    */

    const stored =
      window.ELEAP_LAST_RESULT;

    if (
      stored &&
      typeof stored.isCorrect === 'boolean'
    ) {
      return {
        isCorrect:
          stored.isCorrect,

        score:
          typeof stored.score === 'number'
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

    /*
      Fallback for video round and other
      activities where the lesson engine
      marks DOM elements directly.
    */

    const root =
      document.querySelector(
        '.screen.active'
      ) ||
      document;

    const wrong =
      root.querySelectorAll(
        '.answer-wrong,' +
        '.option-wrong'
      ).length;

    const correct =
      root.querySelectorAll(
        '.answer-correct,' +
        '.option-correct'
      ).length;

    if (wrong > 0) {
      return {
        isCorrect:
          false,

        score:
          0,

        source:
          'dom-assessment'
      };
    }

    if (
      correct > 0 &&
      wrong === 0
    ) {
      return {
        isCorrect:
          true,

        score:
          1,

        source:
          'dom-assessment'
      };
    }

    return {
      isCorrect:
        null,

      score:
        null,

      source:
        null
    };
  }


  /* =======================================================
     8. LOCAL RECOVERY LOG
     ======================================================= */

  function saveLocal(event) {
    try {
      const rows =
        JSON.parse(
          localStorage.getItem(
            localKey
          ) || '[]'
        );

      rows.push(event);

      localStorage.setItem(
        localKey,
        JSON.stringify(
          rows.slice(-250)
        )
      );
    } catch (_) {
      /*
        Local storage failure must not
        affect the lesson.
      */
    }
  }


  /* =======================================================
     9. SEND TO RESEARCH API
     ======================================================= */

  async function sendToResearch(event) {
    try {
      const runtime =
        researchRuntime();

      const result =
        getAssessmentResult();

      /*
        Event payload may explicitly
        provide a result.

        If not, use assessment result
        detected from lesson engine / DOM.
      */

      const explicitCorrect =
        typeof event.payload
          ?.isCorrect === 'boolean'
          ? event.payload.isCorrect
          : null;

      const explicitScore =
        typeof event.payload
          ?.score === 'number'
          ? event.payload.score
          : null;

      const isCorrect =
        explicitCorrect !== null
          ? explicitCorrect
          : result.isCorrect;

      const score =
        explicitScore !== null
          ? explicitScore
          : result.score;

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

                isCorrect,

                score,

                occurredAt:
                  event.occurredAt,

                metadata: {
                  source:
                    'e-leap-standalone-bridge',

                  bridgeVersion:
                    '1.3',

                  resourceId,

                  courseId,

                  unitId,

                  mode:
                    cfg.mode ||
                    'standalone',

                  assessmentSource:
                    result.source
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
      /*
        CRITICAL RULE:

        Research telemetry must NEVER
        break the lesson.
      */

      console.warn(
        'E-LEAP research telemetry unavailable:',
        error
      );

      return null;
    }
  }


  /* =======================================================
     10. EMIT EVENT
     ======================================================= */

  function emit(
    eventType,
    payload = {}
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
        activity(),

      studentId:
        null,

      sessionId:
        runtime.sessionId,

      context:
        context(),

      payload,

      source:
        'compatibility-bridge'
    };


    /*
      Embedded mode:
      forward event to platform host.
    */

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


    /*
      Standalone:
      lightweight recovery log.
    */

    if (
      window.parent === window
    ) {
      saveLocal(event);
    }


    /*
      Internal lesson event bus.
    */

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


    /*
      Research API.

      Fire-and-forget.
    */

    sendToResearch(event);

    return event;
  }


  /* =======================================================
     11. INPUT / DRAFT EVENTS
     ======================================================= */

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

      emit(
        'response.drafted',
        {
          field:
            target.name ||
            target.id ||
            null,

          value:
            target.type ===
            'password'
              ? '[redacted]'
              : target.value
        }
      );
    },

    true
  );


  /* =======================================================
     12. MEDIA EVENTS
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
        }
      );
    },

    true
  );


  /* =======================================================
     13. BUTTON EVENTS
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
         CHECK ANSWER

         Wait briefly so app.js finishes:
         - checkActivity()
         - CSS marking
         - ELEAP_LAST_RESULT
         --------------------------------------------------- */

      if (
        button.matches(
          '#check,' +
          '[id^="check"],' +
          '.item-check'
        )
      ) {
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
              }
            );
          },

          40
        );

        return;
      }


      /* ---------------------------------------------------
         VIDEO ROUND SUBMIT

         roundSubmit performs correctness
         checking inside app.js.

         Wait for DOM result.
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
              }
            );
          },

          60
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
              }
            );
          },

          40
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
              {}
            );
          },

          30
        );
      }
    },

    true
  );


  /* =======================================================
     14. INITIAL ACTIVITY EVENT
     ======================================================= */

  window.addEventListener(
    'load',

    () => {
      emit(
        'activity.viewed',
        {
          initial:
            true
        }
      );
    }
  );


  /* =======================================================
     15. PUBLIC E-LEAP BRIDGE API
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

    getAssessmentResult
  };

})();
