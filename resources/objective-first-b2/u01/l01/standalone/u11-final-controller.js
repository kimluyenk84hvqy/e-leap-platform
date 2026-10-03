/* =========================================================
   E-LEAP U1.1 — CLEAN FINAL CONTROLLER v7.0

   ONLY owns:
   - Slide 9 Step 1
   - Slide 9 Step 2
   - Slide 12 role actions
   - Slide 13 teacher correction

   This controller is loaded:
   app.js
   -> u11-final-controller.js
   -> ui-alignment.js
   -> e-leap-bridge.js

   Its capture handlers intentionally block conflicting
   legacy listeners on these specific screens.
   ========================================================= */

(function () {
  'use strict';

  const $ = (s, r = document) =>
    r.querySelector(s);

  const $$ = (s, r = document) =>
    [...r.querySelectorAll(s)];

  function activeScreen() {
    return $('.screen.active');
  }

  function screenNo() {
    return Number(
      activeScreen()?.dataset.screen || 0
    );
  }

  function studentMode() {
    return document.body.classList.contains(
      'u11-student'
    );
  }

  function teacherMode() {
    return (
      document.body.classList.contains(
        'u11-teacher'
      ) ||
      document.body.classList.contains(
        'presentation'
      )
    );
  }


  /* =======================================================
     COMMON MESSAGE
     ======================================================= */

  function removeMessage(screen) {
    $('.u11-clean-message', screen)
      ?.remove();
  }

  function message(
    screen,
    text,
    type = 'info'
  ) {
    if (!screen) return;

    removeMessage(screen);

    const box =
      document.createElement('div');

    box.className =
      `u11-clean-message ${type}`;

    box.textContent = text;

    screen.appendChild(box);
  }


  /* =======================================================
     ACTION BAR
     ======================================================= */

  function ensureActions(screen) {
    if (!screen) return;

    let bar =
      $('.u11-actionbar', screen);

    if (!bar) {
      bar =
        document.createElement('div');

      bar.className =
        'u11-actionbar';

      screen.appendChild(bar);
    }

    if (!$('#u11Check', bar)) {
      const check =
        document.createElement('button');

      check.type = 'button';
      check.id = 'u11Check';
      check.className = 'u11-check';
      check.textContent = 'Check';

      bar.appendChild(check);
    }

    if (!$('#u11Reset', bar)) {
      const reset =
        document.createElement('button');

      reset.type = 'button';
      reset.id = 'u11Reset';
      reset.textContent = 'Reset';

      bar.appendChild(reset);
    }
  }


  /* =======================================================
     SLIDE 9 — CLEAN REBUILD
     ======================================================= */

  const STEP1_ITEMS = [
    ['cut down', true],
    ['dress up', true],
    ['fit in with', false],
    ['go out', true],
    ['keep up with', true],
    ['pull on', false],
    ['put together', true],
    ['save up', true],
    ['slip on', true],
    ['stand out', true],
    ['take back', true]
  ];


  /*
    FINAL STEP 2 FORMAT LOCKED BY USER:

    LEFT:
    a–i = Phrasal verbs

    MIDDLE:
    1–9 = Definitions

    RIGHT:
    a. [student types definition number]
    ...
    i. [student types definition number]
  */

  const VERBS = [
    {
      letter: 'a',
      text: 'cut down',
      answer: 6
    },
    {
      letter: 'b',
      text: 'dress up',
      answer: 4
    },
    {
      letter: 'c',
      text: 'go out',
      answer: 8
    },
    {
      letter: 'd',
      text: 'keep up with',
      answer: 9
    },
    {
      letter: 'e',
      text: 'put together',
      answer: 2
    },
    {
      letter: 'f',
      text: 'save up',
      answer: 5
    },
    {
      letter: 'g',
      text: 'slip on',
      answer: 7
    },
    {
      letter: 'h',
      text: 'stand out',
      answer: 1
    },
    {
      letter: 'i',
      text: 'take back',
      answer: 3
    }
  ];


  const DEFINITIONS = [
    {
      number: 1,
      text: 'be easy to see or notice'
    },
    {
      number: 2,
      text: 'create something by joining or combining different things'
    },
    {
      number: 3,
      text: 'return something'
    },
    {
      number: 4,
      text: 'wear smarter clothes than usual'
    },
    {
      number: 5,
      text: 'keep money for something in the future'
    },
    {
      number: 6,
      text: 'reduce'
    },
    {
      number: 7,
      text: 'put something on quickly'
    },
    {
      number: 8,
      text: 'go somewhere for entertainment'
    },
    {
      number: 9,
      text: 'understand something that is changing fast'
    }
  ];


  function rebuildSlide9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (
      !screen ||
      screen.dataset.cleanV7 === '1'
    ) {
      return;
    }

    screen.dataset.cleanV7 = '1';
    screen.dataset.cleanStep = '1';

    const heading =
      $('h2', screen)
        ?.outerHTML ||
      '<h2>Exercise 7</h2>';

    const label =
      $('.stage-label', screen)
        ?.outerHTML ||
      '<div class="stage-label">EXERCISE 7</div>';

    const instruction = `
      <p class="instruction"
         id="u11S9Instruction">
        Listen again to Speakers 2–5 and identify
        the phrasal verbs you hear.
      </p>
    `;

    screen.innerHTML = `
      ${label}
      ${heading}
      ${instruction}

      <div class="u11-clean-tabs">
        <button
          type="button"
          class="u11-clean-tab active"
          data-clean-step="1">
          Step 1
        </button>

        <button
          type="button"
          class="u11-clean-tab"
          data-clean-step="2">
          Step 2
        </button>
      </div>

      <div
        class="u11-clean-step"
        data-clean-panel="1">

        <div class="step-title">
          <span>STEP 1</span>
          Which phrasal verbs do you hear?
        </div>

        <div class="u11-s9-listen-grid">
          ${STEP1_ITEMS.map(
            ([text, heard], index) => `
              <div
                class="u11-s9-listen-item"
                data-heard="${heard ? 'yes' : 'no'}"
                data-item="${index + 1}">

                <label>
                  <input
                    type="checkbox"
                    class="u11-s9-listen-check">

                  <span>
                    ${text}
                  </span>
                </label>

                <div
                  class="u11-s9-teacher-key"
                  hidden>
                </div>

              </div>
            `
          ).join('')}
        </div>

      </div>

      <div
        class="u11-clean-step"
        data-clean-panel="2"
        hidden>

        <div class="step-title">
          <span>STEP 2</span>
          Match the phrasal verbs to definitions 1–9.
        </div>

        <div class="u11-s9-match-board">

          <div class="u11-s9-col">
            <div class="match-heading">
              Phrasal verbs
            </div>

            ${VERBS.map(v => `
              <button
                type="button"
                class="u11-s9-verb"
                data-letter="${v.letter}"
                data-answer="${v.answer}">
                <b>${v.letter}.</b>
                ${v.text}
              </button>
            `).join('')}
          </div>


          <div class="u11-s9-col">
            <div class="match-heading">
              Definitions
            </div>

            ${DEFINITIONS.map(d => `
              <div
                class="u11-s9-definition"
                data-number="${d.number}">
                <b>${d.number}.</b>
                <span>${d.text}</span>
              </div>
            `).join('')}
          </div>


          <div
            class="u11-s9-col
                   u11-s9-student-answer-col">

            <div class="match-heading">
              Your answer
            </div>

            ${VERBS.map(v => `
              <div class="u11-s9-answer-row">

                <b>${v.letter}.</b>

                <input
                  type="number"
                  inputmode="numeric"
                  min="1"
                  max="9"
                  class="u11-s9-answer-input"
                  data-letter="${v.letter}"
                  data-answer="${v.answer}"
                  placeholder="No.">

              </div>
            `).join('')}

          </div>

        </div>

      </div>

      <div class="u11-actionbar">

        <button
          type="button"
          class="u11-check"
          id="u11Check">
          Check
        </button>

        <button
          type="button"
          id="u11Reset">
          Reset
        </button>

      </div>
    `;
  }


  function s9Step() {
    const screen =
      $('.screen[data-screen="9"]');

    return Number(
      screen?.dataset.cleanStep || 1
    );
  }


  function changeS9Step(step) {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    screen.dataset.cleanStep =
      String(step);

    $$('.u11-clean-tab', screen)
      .forEach(btn => {
        btn.classList.toggle(
          'active',
          Number(
            btn.dataset.cleanStep
          ) === step
        );
      });

    $$(
      '[data-clean-panel]',
      screen
    ).forEach(panel => {
      panel.hidden =
        Number(
          panel.dataset.cleanPanel
        ) !== step;
    });

    const instruction =
      $('#u11S9Instruction', screen);

    if (instruction) {
      instruction.textContent =
        step === 1
          ? 'Listen again to Speakers 2–5 and identify the phrasal verbs you hear.'
          : 'Match phrasal verbs a–i with definitions 1–9. Students type the correct definition number for each phrasal verb.';
    }

    removeMessage(screen);

    delete screen.dataset.teacherCheck;

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent = 'Check';
      check.classList.remove(
        'clean-check-on'
      );
    }
  }


  /* =======================================================
     S9 STUDENT STEP 1
     SCORE ONLY — NO ANSWER KEY
     ======================================================= */

  function studentCheckStep1() {
    const screen =
      $('.screen[data-screen="9"]');

    const items =
      $$('.u11-s9-listen-item', screen);

    let correct = 0;

    items.forEach(item => {
      const selected =
        $('.u11-s9-listen-check', item)
          ?.checked || false;

      const expected =
        item.dataset.heard === 'yes';

      if (selected === expected) {
        correct++;
      }
    });

    message(
      screen,
      `You got ${correct}/${items.length} correct.`,
      'score'
    );
  }


  /* =======================================================
     S9 STUDENT STEP 2
     SCORE ONLY — NO ANSWER KEY
     ======================================================= */

  function studentCheckStep2() {
    const screen =
      $('.screen[data-screen="9"]');

    const inputs =
      $$('.u11-s9-answer-input', screen);

    let correct = 0;

    inputs.forEach(input => {
      if (
        String(input.value).trim() ===
        String(input.dataset.answer)
      ) {
        correct++;
      }
    });

    message(
      screen,
      `You got ${correct}/${inputs.length} correct.`,
      'score'
    );
  }


  /* =======================================================
     S9 TEACHER CHECK
     ======================================================= */

  function armTeacherS9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    screen.dataset.teacherCheck =
      'on';

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        '✓ Check mode ON';

      check.classList.add(
        'clean-check-on'
      );
    }

    message(
      screen,
      s9Step() === 1
        ? 'Click each phrasal verb to show HEARD or NOT HEARD.'
        : 'Click each phrasal verb a–i to highlight its correct numbered definition.',
      'teacher'
    );
  }


  /* =======================================================
     S9 TEACHER STEP 1
     ======================================================= */

  function teacherRevealS9Step1(item) {
    const answer =
      $('.u11-s9-teacher-key', item);

    if (!answer) return;

    answer.hidden = false;

    answer.textContent =
      item.dataset.heard === 'yes'
        ? 'HEARD'
        : 'NOT HEARD';

    item.classList.add(
      'teacher-revealed'
    );
  }


  /* =======================================================
     S9 TEACHER STEP 2
     ======================================================= */

  function teacherRevealS9Step2(verb) {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    const number =
      Number(
        verb.dataset.answer
      );

    const definition =
      $(
        `.u11-s9-definition[data-number="${number}"]`,
        screen
      );

    if (!definition) return;

    verb.classList.add(
      'teacher-paired'
    );

    definition.classList.add(
      'teacher-paired'
    );

    if (
      !$('.u11-s9-pair-label', definition)
    ) {
      const answer =
        document.createElement('div');

      answer.className =
        'u11-s9-pair-label';

      answer.textContent =
        `${verb.dataset.letter} = ${number}`;

      definition.appendChild(answer);
    }
  }


  /* =======================================================
     S9 RESET
     ======================================================= */

  function resetSlide9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    delete screen.dataset.teacherCheck;

    removeMessage(screen);

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent = 'Check';

      check.classList.remove(
        'clean-check-on'
      );
    }

    $$('.u11-s9-listen-check', screen)
      .forEach(input => {
        input.checked = false;
      });

    $$('.u11-s9-listen-item', screen)
      .forEach(item => {
        item.classList.remove(
          'teacher-revealed'
        );

        const answer =
          $('.u11-s9-teacher-key', item);

        if (answer) {
          answer.hidden = true;
          answer.textContent = '';
        }
      });

    $$('.u11-s9-answer-input', screen)
      .forEach(input => {
        input.value = '';
      });

    $$('.u11-s9-verb', screen)
      .forEach(v => {
        v.classList.remove(
          'teacher-paired'
        );
      });

    $$('.u11-s9-definition', screen)
      .forEach(d => {
        d.classList.remove(
          'teacher-paired'
        );

        $('.u11-s9-pair-label', d)
          ?.remove();
      });
  }


  /* =======================================================
     SLIDE 12
     ======================================================= */

  const S12_ANSWER = `
    <b>Suggested answer</b>

    <p>
      If I were Emma, I would wear clothes that make
      me feel comfortable and confident.
    </p>

    <p>
      She could <b>dress up</b> for special occasions,
      but she does not need to <b>keep up with</b>
      every new fashion.
    </p>

    <p>
      She could also <b>put together</b> an outfit
      which suits her personality.
    </p>
  `;


  function setupSlide12() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    ensureActions(screen);

    let bar =
      $('.u11-actionbar', screen);

    if (
      bar &&
      !$('#u11Submit12', bar)
    ) {
      const submit =
        document.createElement('button');

      submit.type = 'button';
      submit.id = 'u11Submit12';
      submit.textContent = 'Submit';

      $('#u11Reset', bar)
        ?.before(submit);
    }
  }


  function showTeacherS12Answer() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    let answer =
      $('.u11-clean-s12-answer', screen);

    if (!answer) {
      answer =
        document.createElement('div');

      answer.className =
        'u11-clean-s12-answer';

      answer.innerHTML =
        S12_ANSWER;

      $('.advice-layout', screen)
        ?.after(answer);
    }

    answer.classList.add('show');
  }


  function resetSlide12() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    $$('textarea', screen)
      .forEach(x => {
        x.value = '';
      });

    const stop =
      $('.u11-record-stop', screen);

    if (
      stop &&
      !stop.disabled
    ) {
      stop.click();
    }

    const start =
      $('.u11-record-start', screen);

    const status =
      $('.u11-record-status', screen);

    const audio =
      $('.u11-record-playback', screen);

    if (start) start.disabled = false;
    if (stop) stop.disabled = true;

    if (status) {
      status.textContent = 'Ready';
    }

    if (audio) {
      try {
        audio.pause();
      } catch (_) {}

      audio.removeAttribute('src');
      audio.hidden = true;
    }

    const submit =
      $('#u11Submit12', screen);

    if (submit) {
      submit.textContent = 'Submit';
      submit.classList.remove(
        'submitted'
      );
    }

    $('.u11-clean-s12-answer', screen)
      ?.classList.remove('show');

    removeMessage(screen);
  }


  /* =======================================================
     SLIDE 13
     CLEAN TEACHER CORRECTION
     ======================================================= */

  function setupSlide13() {
    const screen =
      $('.screen[data-screen="13"]');

    if (!screen) return;

    ensureActions(screen);
  }


  function armTeacherS13() {
    const screen =
      $('.screen[data-screen="13"]');

    if (!screen) return;

    screen.dataset.teacherCheck =
      'on';

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        '✓ Check mode ON';

      check.classList.add(
        'clean-check-on'
      );
    }

    message(
      screen,
      'Click each box to reveal its answer. Previous answers will remain visible.',
      'teacher'
    );
  }


  function revealS13(card) {
    if (
      $('.u11-clean-s13-answer', card)
    ) {
      return;
    }

    const answerText =
      card.dataset.back;

    if (!answerText) return;

    const answer =
      document.createElement('div');

    answer.className =
      'u11-clean-s13-answer';

    answer.textContent =
      answerText;

    card.appendChild(answer);

    card.classList.add(
      'clean-revealed'
    );
  }


  function resetSlide13() {
    const screen =
      $('.screen[data-screen="13"]');

    if (!screen) return;

    delete screen.dataset.teacherCheck;

    removeMessage(screen);

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent = 'Check';

      check.classList.remove(
        'clean-check-on'
      );
    }

    $$('.challenge-card', screen)
      .forEach(card => {
        $('.u11-clean-s13-answer', card)
          ?.remove();

        card.classList.remove(
          'clean-revealed',
          'flipped'
        );

        /*
          If legacy code had changed the
          button text, restore question.
        */

        if (
          card.dataset.front &&
          !card.querySelector(
            '.u11-clean-s13-answer'
          )
        ) {
          const responseInput =
            card.nextElementSibling;

          card.textContent =
            card.dataset.front;

          if (
            responseInput &&
            responseInput.classList.contains(
              'u11-challenge-input'
            )
          ) {
            responseInput.value = '';
          }
        }
      });
  }


  /* =======================================================
     ROLE UI
     ======================================================= */

  function applyRoleUI() {
    const s9 =
      $('.screen[data-screen="9"]');

    if (s9) {
      const studentAnswers =
        $('.u11-s9-student-answer-col', s9);

      if (studentAnswers) {
        studentAnswers.hidden =
          !studentMode();
      }

      /*
        Student can tick Step 1.
        Teacher cannot accidentally tick.
      */

      $$('.u11-s9-listen-check', s9)
        .forEach(input => {
          input.disabled =
            teacherMode();
        });
    }


    const s12 =
      $('.screen[data-screen="12"]');

    if (s12) {
      const check =
        $('#u11Check', s12);

      const submit =
        $('#u11Submit12', s12);

      if (check) {
        check.hidden =
          studentMode();
      }

      if (submit) {
        submit.hidden =
          !studentMode();
      }
    }
  }


  /* =======================================================
     MASTER CAPTURE CONTROLLER
     ======================================================= */

  document.addEventListener(
    'click',
    event => {
      const target =
        event.target;

      const n =
        screenNo();


      /* ===================================================
         S9 TABS
         =================================================== */

      if (
        n === 9 &&
        target.closest(
          '.u11-clean-tab'
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        changeS9Step(
          Number(
            target
              .closest('.u11-clean-tab')
              .dataset.cleanStep
          )
        );

        return;
      }


      /* ===================================================
         S9 CHECK
         =================================================== */

      if (
        n === 9 &&
        target.closest('#u11Check')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (studentMode()) {
          if (s9Step() === 1) {
            studentCheckStep1();
          } else {
            studentCheckStep2();
          }
        } else if (teacherMode()) {
          armTeacherS9();
        }

        return;
      }


      /* ===================================================
         S9 RESET
         =================================================== */

      if (
        n === 9 &&
        target.closest('#u11Reset')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        resetSlide9();
        return;
      }


      /* ===================================================
         S9 TEACHER STEP 1 CLICK
         =================================================== */

      if (
        n === 9 &&
        teacherMode() &&
        s9Step() === 1
      ) {
        const item =
          target.closest(
            '.u11-s9-listen-item'
          );

        if (item) {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (
            activeScreen()
              .dataset.teacherCheck ===
            'on'
          ) {
            teacherRevealS9Step1(
              item
            );
          }

          return;
        }
      }


      /* ===================================================
         S9 TEACHER STEP 2 CLICK
         =================================================== */

      if (
        n === 9 &&
        teacherMode() &&
        s9Step() === 2
      ) {
        const verb =
          target.closest(
            '.u11-s9-verb'
          );

        if (verb) {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (
            activeScreen()
              .dataset.teacherCheck ===
            'on'
          ) {
            teacherRevealS9Step2(
              verb
            );
          }

          return;
        }

        /*
          Definitions themselves are not
          Teacher control buttons.
        */

        if (
          target.closest(
            '.u11-s9-definition'
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }


      /* ===================================================
         S12
         =================================================== */

      if (
        n === 12 &&
        target.closest('#u11Check')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (teacherMode()) {
          showTeacherS12Answer();
        }

        return;
      }

      if (
        n === 12 &&
        target.closest('#u11Submit12')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (studentMode()) {
          const button =
            $('#u11Submit12', activeScreen());

          if (button) {
            button.textContent =
              'Submitted ✓';

            button.classList.add(
              'submitted'
            );
          }

          message(
            activeScreen(),
            'Response submitted.',
            'score'
          );
        }

        return;
      }

      if (
        n === 12 &&
        target.closest('#u11Reset')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        resetSlide12();
        return;
      }


      /* ===================================================
         S13 CHECK
         =================================================== */

      if (
        n === 13 &&
        target.closest('#u11Check')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (teacherMode()) {
          armTeacherS13();
        }

        return;
      }


      /* ===================================================
         S13 TEACHER CARD
         =================================================== */

      if (
        n === 13 &&
        teacherMode()
      ) {
        const card =
          target.closest(
            '.challenge-card'
          );

        if (card) {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (
            activeScreen()
              .dataset.teacherCheck ===
            'on'
          ) {
            revealS13(card);
          }

          return;
        }
      }


      /* ===================================================
         S13 RESET
         =================================================== */

      if (
        n === 13 &&
        target.closest('#u11Reset')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        resetSlide13();
        return;
      }

    },
    true
  );


  /* =======================================================
     INIT / REFRESH
     ======================================================= */

  function refresh() {
    rebuildSlide9();
    setupSlide12();
    setupSlide13();
    applyRoleUI();
  }


  const observer =
    new MutationObserver(() => {
      clearTimeout(
        window.__u11CleanRefresh
      );

      window.__u11CleanRefresh =
        setTimeout(
          refresh,
          15
        );
    });


  observer.observe(
    document.body,
    {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'class'
      ]
    }
  );


  /*
    Run immediately.
    app.js has already loaded, so rebuilding S9 here
    removes its old direct matching listeners.
  */

  refresh();


  window.ELEAP_U11_CLEAN = {
    version: '7.0',
    refresh,
    resetSlide9,
    resetSlide12,
    resetSlide13
  };

})();
