/* E-LEAP Standalone Learning Bridge v1.1
   Portable lesson-side adapter.
   Production-safe research telemetry:
   - keeps existing platform event forwarding
   - keeps local recovery log for standalone QA
   - additionally sends learning events to E-LEAP Research API
   - research failure must never break the lesson
*/
(function () {
  const cfg = window.ELEAP_LESSON_BRIDGE || {};

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
    =>
    objective-first-b2/u01/l02

    This keeps research lesson IDs consistent with R1.
  */
  const researchLessonId =
    cfg.researchLessonId ||
    lessonId.replace(
      /-u(\d+)-l(\d+)$/,
      '/u$1/l$2'
    );

  const localKey =
    'e-leap-standalone-events:' + resourceId;

  const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    (
      'evt-' +
      Date.now() +
      '-' +
      Math.random().toString(16).slice(2)
    );

  const activity = () => {
    if (window.LESSON?.activities) {
      const n = Math.max(
        0,
        (Number(document.body.dataset.screen) || 1) - 1
      );

      return (
        window.LESSON.activities[n]?.id ||
        ('screen-' + (n + 1))
      );
    }

    const active =
      document.querySelector('.screen.active');

    return active?.dataset.screen
      ? 'screen-' + active.dataset.screen
      : null;
  };

  const context = () => ({
    mode: cfg.mode || 'standalone',
    courseId,
    unitId,
    lessonId,
    researchLessonId
  });

  /*
    R1 runtime context.
    Later Teacher/Class/Session UI will populate these automatically.
  */
  function researchRuntime() {
    const runtime =
      window.ELEAP_RESEARCH_CONTEXT || {};

    return {
      sessionId:
        runtime.sessionId || null,

      teacherId:
        runtime.teacherId || null,

      classId:
        runtime.classId || null,

      participantId:
        runtime.participantId || null
    };
  }

  /*
    Send event to Research API.
    IMPORTANT:
    Never throw back into the lesson.
  */
  async function sendToResearch(event) {
    try {
      const runtime = researchRuntime();

      const response = await fetch(
        '/api/research/events',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          credentials: 'same-origin',

          body: JSON.stringify({
            clientEventId: event.eventId,

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
              event.payload || null,

            isCorrect:
              typeof event.payload?.isCorrect === 'boolean'
                ? event.payload.isCorrect
                : null,

            score:
              event.payload?.score ?? null,

            occurredAt:
              event.occurredAt,

            metadata: {
              source:
                'e-leap-standalone-bridge',

              resourceId,

              courseId,

              unitId,

              mode:
                cfg.mode || 'standalone'
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

      return await response.json();
    } catch (error) {
      console.warn(
        'E-LEAP research telemetry unavailable:',
        error
      );

      return null;
    }
  }

  function emit(eventType, payload = {}) {
    const event = {
      eventId:
        uid(),

      eventType,

      occurredAt:
        new Date().toISOString(),

      resourceId,

      activityId:
        activity(),

      studentId:
        null,

      sessionId:
        researchRuntime().sessionId,

      context:
        context(),

      payload,

      source:
        'compatibility-bridge'
    };

    /*
      Existing platform-host bridge.
    */
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'e-leap:learning-event',
          event
        },
        location.origin
      );
    } else {
      /*
        Existing standalone recovery log.
      */
      try {
        const rows =
          JSON.parse(
            localStorage.getItem(localKey) ||
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

    /*
      Existing local event bus.
    */
    window.dispatchEvent(
      new CustomEvent(
        'e-leap:lesson-event',
        {
          detail: event
        }
      )
    );

    /*
      NEW R1 research telemetry.
      Fire-and-forget so lesson UX is never blocked.
    */
    sendToResearch(event);

    return event;
  }

  function snapshot() {
    const root =
      document.querySelector('.screen.active') ||
      document;

    const inputs = [
      ...root.querySelectorAll(
        'input,textarea,select'
      )
    ].map(
      (el, n) => ({
        name:
          el.name ||
          el.id ||
          ('field-' + n),

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

    const selected = [
      ...root.querySelectorAll(
        '.selected,.matched,.answer-correct,.answer-wrong'
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

  document.addEventListener(
    'input',
    e => {
      if (
        e.target.matches(
          'input,textarea,select'
        )
      ) {
        emit(
          'response.drafted',
          {
            field:
              e.target.name ||
              e.target.id ||
              null,

            value:
              e.target.type === 'password'
                ? '[redacted]'
                : e.target.value
          }
        );
      }
    },
    true
  );

  document.addEventListener(
    'play',
    e => {
      if (
        e.target.matches(
          'audio,video'
        )
      ) {
        emit(
          'media.played',
          {
            src:
              e.target.currentSrc ||
              e.target.getAttribute('src') ||
              null
          }
        );
      }
    },
    true
  );

  document.addEventListener(
    'ended',
    e => {
      if (
        e.target.matches(
          'audio,video'
        )
      ) {
        emit(
          'media.completed',
          {
            src:
              e.target.currentSrc ||
              e.target.getAttribute('src') ||
              null
          }
        );
      }
    },
    true
  );

  document.addEventListener(
    'click',
    e => {
      const b =
        e.target.closest('button');

      if (!b) return;

      if (
        b.matches(
          '#submit,.submit,#roundSubmit'
        )
      ) {
        setTimeout(
          () =>
            emit(
              'response.submitted',
              {
                response:
                  snapshot()
              }
            ),
          0
        );
      }

      if (
        b.matches(
          '#check,[id^="check"],.item-check'
        )
      ) {
        setTimeout(
          () =>
            emit(
              'attempt.checked',
              {
                response:
                  snapshot()
              }
            ),
          0
        );
      }

      if (
        b.matches(
          '#next,#nextBtn,.navbtn,.item-tab,.round-next,.round-dot'
        )
      ) {
        setTimeout(
          () =>
            emit(
              'activity.viewed',
              {}
            ),
          0
        );
      }
    },
    true
  );

  window.addEventListener(
    'load',
    () => {
      emit(
        'activity.viewed',
        {
          initial: true
        }
      );
    }
  );

  window.ELEAP = {
    emit,
    snapshot,
    resourceId,
    researchLessonId
  };
})();
