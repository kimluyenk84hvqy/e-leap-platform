/* E-LEAP Standalone Learning Bridge v1.2
   ---------------------------------------------------------
   Production-safe lesson-side adapter for E-LEAP.

   Functions:
   1. Preserve standalone lesson operation.
   2. Forward learning events to the E-LEAP platform host.
   3. Keep a small local QA/recovery log.
   4. Send research telemetry to /api/research/events.
   5. Read Teacher/Class/Session/Participant context from:
      - window.ELEAP_RESEARCH_CONTEXT
      - URL query parameters
   6. Research/API failures must NEVER break the lesson.
   ---------------------------------------------------------
*/

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
    Example:
    objective-first-b2-u01-l02
    ->
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
     2. EVENT ID
     ======================================================= */

  function uid() {
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === 'function'
    ) {
      return globalThis.crypto.randomUUID();
    }

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
     3. CURRENT ACTIVITY
     ======================================================= */

  function activity() {
    /*
      Preferred:
      use LESSON.activities when available.
    */

    if (
      window.LESSON &&
      Array.isArray(window.LESSON.activities)
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
      inspect active screen.
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

    const bodyScreen =
      document.body.dataset.screen;

    if (bodyScreen) {
      return (
        'screen-' +
        bodyScreen
      );
    }

    return null;
  }


  /* =======================================================
     4. RESEARCH RUNTIME CONTEXT
     ======================================================= */

  function researchRuntime() {
    /*
      Runtime context supplied by platform.
    */

    const runtime =
      window.ELEAP_RESEARCH_CONTEXT ||
      {};

    /*
      URL context.

      Example:

      ?sessionId=...
      &teacherId=...
      &classId=...
      &participantId=...
    */

    const params =
      new URLSearchParams(
        window.location.search
      );

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
     5. LESSON CONTEXT
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
          '.answer-wrong'
        )
      ]
        .slice(0, 80)
        .map(
          el =>
            (
              el.dataset.value ||
              el.dataset.letter ||
              el.textContent ||
              ''
            ).trim()
        )
        .filter(Boolean);

    return {
      inputs,
      selected
    };
  }


  /* =======================================================
     7. LOCAL RECOVERY LOG
     ======================================================= */

  function saveLocal(event) {
    try {
      const existing =
        JSON.parse(
          localStorage.getItem(
            localKey
          ) || '[]'
        );

      existing.push(event);

      /*
        Keep only most recent 250 events.
      */

      const trimmed =
        existing.slice(-250);

      localStorage.setItem(
        localKey,
        JSON.stringify(trimmed)
      );
    } catch (_) {
      /*
        Local storage failure must
        never break lesson.
      */
    }
  }


  /* =======================================================
     8. SEND TO RESEARCH API
     ======================================================= */

  async function sendToResearch(event) {
    try {
      const runtime =
        researchRuntime();

      const response =
        await fetch(
          '/api/research/events',
          {
            method: 'POST',

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
                  typeof event.payload
                    ?.isCorrect ===
                    'boolean'
                    ? event.payload
                        .isCorrect
                    : null,

                score:
                  event.payload
                    ?.score ??
                  null,

                occurredAt:
                  event.occurredAt,

                metadata: {
                  source:
                    'e-leap-standalone-bridge',

                  bridgeVersion:
                    '1.2',

                  resourceId,

                  courseId,

                  unitId,

                  mode:
                    cfg.mode ||
                    'standalone'
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
          ok: true
        };
      }
    } catch (error) {
      /*
        Critical production rule:
        research telemetry failure
        must never affect teaching.
      */

      console.warn(
        'E-LEAP research telemetry unavailable:',
        error
      );

      return null;
    }
  }


  /* =======================================================
     9. EMIT LEARNING EVENT
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
      Embedded lesson:
      forward to platform host.
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
      Standalone lesson:
      keep lightweight local recovery log.
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
      Research telemetry.

      Fire-and-forget:
      do not await.
    */

    sendToResearch(event);


    return event;
  }


  /* =======================================================
     10. INPUT EVENTS
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
     11. MEDIA EVENTS
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
     12. BUTTON EVENTS
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


      /*
        SUBMIT
      */

      if (
        button.matches(
          '#submit,' +
          '.submit,' +
          '#roundSubmit'
        )
      ) {
        setTimeout(
          () => {
            emit(
              'response.submitted',
              {
                response:
                  snapshot()
              }
            );
          },

          0
        );
      }


      /*
        CHECK
      */

      if (
        button.matches(
          '#check,' +
          '[id^="check"],' +
          '.item-check'
        )
      ) {
        setTimeout(
          () => {
            emit(
              'attempt.checked',
              {
                response:
                  snapshot()
              }
            );
          },

          0
        );
      }


      /*
        NAVIGATION / ACTIVITY VIEW
      */

      if (
        button.matches(
          '#next,' +
          '#nextBtn,' +
          '.navbtn,' +
          '.item-tab,' +
          '.round-next,' +
          '.round-dot'
        )
      ) {
        setTimeout(
          () => {
            emit(
              'activity.viewed',
              {}
            );
          },

          0
        );
      }
    },

    true
  );


  /* =======================================================
     13. INITIAL LESSON EVENT
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
     14. GLOBAL E-LEAP BRIDGE API
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
      researchRuntime
  };

})();
