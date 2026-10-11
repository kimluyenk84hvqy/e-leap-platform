/* =========================================================
   E-LEAP U1.1 — SLIDE 9 FINAL CLEAN CONTROLLER v8.0

   This file now owns ONLY Slide 9.

   STEP 1
   STUDENT:
   - Tick phrasal verbs
   - Check -> score only
   - NO answer key
   - Reset clears all

   TEACHER:
   - Check -> correction mode
   - Click one phrasal verb -> HEARD / NOT HEARD
   - Previous answers remain
   - Reset clears all

   STEP 2
   STUDENT:
   - a–i Phrasal verbs
   - 1–9 Definitions
   - Type definition number for each a–i
   - Check -> score only
   - NO answer key
   - Reset clears all

   TEACHER:
   - Check -> correction mode
   - Click one phrasal verb a–i
   - Correct numbered definition highlights
   - Previous pairs remain
   - Reset clears all
   ========================================================= */

(function () {
  'use strict';

  const $ = (s, r = document) =>
    r.querySelector(s);

  const $$ = (s, r = document) =>
    [...r.querySelectorAll(s)];


  /* =======================================================
     DATA — FROM ORIGINAL U1.1
     ======================================================= */

  const STEP1 = [
    { text:'cut down',     heard:true  },
    { text:'dress up',     heard:true  },
    { text:'fit in with',  heard:false },
    { text:'go out',       heard:true  },
    { text:'keep up with', heard:true  },
    { text:'pull on',      heard:false },
    { text:'put together', heard:true  },
    { text:'save up',      heard:true  },
    { text:'slip on',      heard:true  },
    { text:'stand out',    heard:true  },
    { text:'take back',    heard:true  }
  ];


  /*
    FINAL FORMAT:

    a–i = Phrasal verbs

    1–9 = Definitions

    Student types NUMBER
    corresponding to each letter.
  */

  const VERBS = [
    { letter:'a', text:'cut down',     answer:6 },
    { letter:'b', text:'dress up',     answer:4 },
    { letter:'c', text:'go out',       answer:8 },
    { letter:'d', text:'keep up with', answer:9 },
    { letter:'e', text:'put together', answer:2 },
    { letter:'f', text:'save up',      answer:5 },
    { letter:'g', text:'slip on',      answer:7 },
    { letter:'h', text:'stand out',    answer:1 },
    { letter:'i', text:'take back',    answer:3 }
  ];


  const DEFINITIONS = [
    { no:1, text:'be easy to see or notice' },
    { no:2, text:'create something by joining or combining different things' },
    { no:3, text:'return something' },
    { no:4, text:'wear smarter clothes than usual' },
    { no:5, text:'keep money for something in the future' },
    { no:6, text:'reduce' },
    { no:7, text:'put something on quickly' },
    { no:8, text:'go somewhere for entertainment' },
    { no:9, text:'understand something that is changing fast' }
  ];


  /* =======================================================
     ROLE
     ======================================================= */

  function isStudent() {
    return document.body.classList.contains(
      'u11-student'
    );
  }

  function isTeacher() {
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
     SCREEN
     ======================================================= */

  function screen9() {
    return $('.screen[data-screen="9"]');
  }


  /* =======================================================
     BUILD SLIDE 9 COMPLETELY
     ======================================================= */

  function buildSlide9() {
    const screen = screen9();

    if (!screen) return;


    /*
      Do not depend on old Slide 9 DOM.
      Rebuild only this screen.
    */

    screen.innerHTML = `
      <div class="stage-label">
        EXERCISE 7 · LISTENING + MATCHING
      </div>

      <h2>
        Listen, identify, then match
      </h2>

      <p
        class="instruction"
        id="s9Instruction">
        Listen again to Speakers 2–5 and identify
        the phrasal verbs you hear.
      </p>


      <div class="s9-tabs">

        <button
          type="button"
          class="s9-tab active"
          data-step="1">
          Step 1
        </button>

        <button
          type="button"
          class="s9-tab"
          data-step="2">
          Step 2
        </button>

      </div>


      <!-- ================================================
           STEP 1
           ================================================ -->

      <section
        class="s9-panel"
        data-panel="1">

        <div class="step-title">
          <span>STEP 1</span>
          Which phrasal verbs do you hear?
        </div>

        <div class="s9-heard-grid">

          ${STEP1.map((item, index) => `
            <div
              class="s9-heard-item"
              data-heard="${item.heard ? 'yes' : 'no'}"
              data-index="${index}">

              <label>

                <input
                  type="checkbox"
                  class="s9-student-check">

                <span>
                  ${item.text}
                </span>

              </label>

              <div
                class="s9-teacher-answer">
              </div>

            </div>
          `).join('')}

        </div>

      </section>


      <!-- ================================================
           STEP 2
           ================================================ -->

      <section
        class="s9-panel"
        data-panel="2"
        hidden>

        <div class="step-title">
          <span>STEP 2</span>
          Match phrasal verbs a–i with definitions 1–9.
        </div>


        <div class="s9-match-layout">


          <!-- LEFT -->
          <div class="s9-column">

            <div class="match-heading">
              Phrasal verbs
            </div>

            ${VERBS.map(v => `
              <button
                type="button"
                class="s9-verb"
                data-letter="${v.letter}"
                data-answer="${v.answer}">

                <b>${v.letter}.</b>
                <span>${v.text}</span>

              </button>
            `).join('')}

          </div>


          <!-- MIDDLE -->
          <div class="s9-column">

            <div class="match-heading">
              Definitions
            </div>

            ${DEFINITIONS.map(d => `
              <div
                class="s9-definition"
                data-number="${d.no}">

                <b>${d.no}.</b>

                <span>
                  ${d.text}
                </span>

              </div>
            `).join('')}

          </div>


          <!-- RIGHT — STUDENT ONLY -->
          <div
            class="s9-column
                   s9-answer-column">

            <div class="match-heading">
              Your answer
            </div>

            ${VERBS.map(v => `
              <div class="s9-answer-row">

                <b>${v.letter}.</b>

                <input
                  type="number"
                  min="1"
                  max="9"
                  inputmode="numeric"

                  class="s9-answer-input"

                  data-letter="${v.letter}"
                  data-answer="${v.answer}"

                  placeholder="No.">

              </div>
            `).join('')}

          </div>

        </div>

      </section>


      <!-- ================================================
           SLIDE 9 OWN ACTIONS
           ================================================ -->

      <div class="s9-actions">

        <button
          type="button"
          id="s9Check">
          Check
        </button>

        <button
          type="button"
          id="s9Reset">
          Reset
        </button>

      </div>


      <div
        class="s9-feedback"
        id="s9Feedback">
      </div>
    `;

    screen.dataset.s9Step = '1';

    applyRole();

    bindSlide9();
  }


  /* =======================================================
     ROLE UI
     ======================================================= */

  function applyRole() {
    const screen = screen9();

    if (!screen) return;


    /*
      TEACHER:
      no checkboxes
    */

    $$('.s9-student-check', screen)
      .forEach(input => {
        input.disabled =
          isTeacher();
      });


    /*
      Student answer column only
    */

    const answerColumn =
      $('.s9-answer-column', screen);

    if (answerColumn) {
      answerColumn.style.display =
        isStudent()
          ? ''
          : 'none';
    }


    /*
      Teacher display uses 2 columns.
      Student display uses 3.
    */

    screen.classList.toggle(
      's9-role-student',
      isStudent()
    );

    screen.classList.toggle(
      's9-role-teacher',
      isTeacher()
    );
  }


  /* =======================================================
     CHANGE STEP
     ======================================================= */

  function setStep(step) {
    const screen = screen9();

    if (!screen) return;

    screen.dataset.s9Step =
      String(step);


    $$('.s9-tab', screen)
      .forEach(btn => {

        btn.classList.toggle(
          'active',
          Number(btn.dataset.step) === step
        );
      });


    $$('.s9-panel', screen)
      .forEach(panel => {

        panel.hidden =
          Number(panel.dataset.panel) !== step;
      });


    const instruction =
      $('#s9Instruction', screen);

    if (instruction) {

      instruction.textContent =
        step === 1

          ? 'Listen again to Speakers 2–5 and identify the phrasal verbs you hear.'

          : 'Match phrasal verbs a–i with definitions 1–9. Type the correct definition number for each phrasal verb.';
    }


    clearFeedback();

    disarmTeacher();
  }


  /* =======================================================
     FEEDBACK
     ======================================================= */

  function clearFeedback() {
    const box =
      $('#s9Feedback', screen9());

    if (!box) return;

    box.textContent = '';
    box.className =
      's9-feedback';
  }


  function showFeedback(
    text,
    type
  ) {
    const box =
      $('#s9Feedback', screen9());

    if (!box) return;

    box.textContent = text;

    box.className =
      `s9-feedback ${type}`;
  }


  /* =======================================================
     STUDENT STEP 1 CHECK
     SCORE ONLY
     ======================================================= */

  function studentCheckStep1() {
    const screen = screen9();

    let correct = 0;

    const items =
      $$('.s9-heard-item', screen);

    items.forEach(item => {

      const selected =
        $('.s9-student-check', item)
          .checked;

      const expected =
        item.dataset.heard === 'yes';

      if (
        selected === expected
      ) {
        correct++;
      }
    });


    /*
      NEVER reveal individual answer.
    */

    showFeedback(
      `You got ${correct}/${items.length} correct.`,
      'student-score'
    );
  }


  /* =======================================================
     STUDENT STEP 2 CHECK
     SCORE ONLY
     ======================================================= */

  function studentCheckStep2() {
    const screen = screen9();

    let correct = 0;

    const inputs =
      $$('.s9-answer-input', screen);

    inputs.forEach(input => {

      if (
        String(input.value).trim() ===
        String(input.dataset.answer)
      ) {
        correct++;
      }
    });


    /*
      NEVER show which answers are correct.
    */

    showFeedback(
      `You got ${correct}/${inputs.length} correct.`,
      'student-score'
    );
  }


  /* =======================================================
     TEACHER CHECK MODE
     ======================================================= */

  function armTeacher() {
    const screen = screen9();

    screen.dataset.teacherCheck =
      'on';

    const check =
      $('#s9Check', screen);

    if (check) {

      check.textContent =
        '✓ Check mode ON';

      check.classList.add(
        'active'
      );
    }


    if (
      Number(
        screen.dataset.s9Step
      ) === 1
    ) {

      showFeedback(
        'Click each phrasal verb to reveal HEARD or NOT HEARD.',
        'teacher-note'
      );

    } else {

      showFeedback(
        'Click each phrasal verb a–i to reveal its matching definition.',
        'teacher-note'
      );
    }
  }


  function disarmTeacher() {
    const screen = screen9();

    if (!screen) return;

    delete screen.dataset.teacherCheck;

    const check =
      $('#s9Check', screen);

    if (check) {

      check.textContent =
        'Check';

      check.classList.remove(
        'active'
      );
    }
  }


  /* =======================================================
     TEACHER STEP 1
     ======================================================= */

  function revealHeard(item) {
    const answer =
      $('.s9-teacher-answer', item);

    if (!answer) return;


    /*
      THIS is the only point where
      HEARD / NOT HEARD becomes visible.
    */

    answer.textContent =
      item.dataset.heard === 'yes'
        ? 'HEARD'
        : 'NOT HEARD';

    item.classList.add(
      'revealed'
    );
  }


  /* =======================================================
     TEACHER STEP 2
     ======================================================= */

  function revealPair(verb) {
    const screen = screen9();

    const number =
      Number(
        verb.dataset.answer
      );

    const definition =
      $(
        `.s9-definition[data-number="${number}"]`,
        screen
      );

    if (!definition) return;


    /*
      Preserve previous pairs.
    */

    verb.classList.add(
      'paired'
    );

    definition.classList.add(
      'paired'
    );


    if (
      !$('.s9-pair-badge', definition)
    ) {

      const badge =
        document.createElement('div');

      badge.className =
        's9-pair-badge';

      badge.textContent =
        `${verb.dataset.letter} = ${number}`;

      definition.appendChild(
        badge
      );
    }
  }


  /* =======================================================
     RESET
     ======================================================= */

  function resetSlide9() {
    const screen = screen9();

    if (!screen) return;

    disarmTeacher();
    clearFeedback();


    /*
      Step 1 Student
    */

    $$('.s9-student-check', screen)
      .forEach(input => {
        input.checked = false;
      });


    /*
      Step 1 Teacher
    */

    $$('.s9-heard-item', screen)
      .forEach(item => {

        item.classList.remove(
          'revealed'
        );

        const answer =
          $('.s9-teacher-answer', item);

        if (answer) {
          answer.textContent = '';
        }
      });


    /*
      Step 2 Student
    */

    $$('.s9-answer-input', screen)
      .forEach(input => {
        input.value = '';
      });


    /*
      Step 2 Teacher
    */

    $$('.s9-verb', screen)
      .forEach(verb => {
        verb.classList.remove(
          'paired'
        );
      });

    $$('.s9-definition', screen)
      .forEach(definition => {

        definition.classList.remove(
          'paired'
        );

        $('.s9-pair-badge', definition)
          ?.remove();
      });
  }


  /* =======================================================
     BIND
     ======================================================= */

  function bindSlide9() {
    const screen = screen9();

    if (!screen) return;


    /* TABS */

    $$('.s9-tab', screen)
      .forEach(btn => {

        btn.addEventListener(
          'click',
          event => {

            event.preventDefault();
            event.stopPropagation();

            setStep(
              Number(btn.dataset.step)
            );
          }
        );
      });


    /* CHECK */

    $('#s9Check', screen)
      ?.addEventListener(
        'click',
        event => {

          event.preventDefault();
          event.stopPropagation();

          const step =
            Number(
              screen.dataset.s9Step
            );


          if (isStudent()) {

            if (step === 1) {
              studentCheckStep1();
            } else {
              studentCheckStep2();
            }

            return;
          }


          if (isTeacher()) {
            armTeacher();
          }
        }
      );


    /* RESET */

    $('#s9Reset', screen)
      ?.addEventListener(
        'click',
        event => {

          event.preventDefault();
          event.stopPropagation();

          resetSlide9();
        }
      );


    /* TEACHER STEP 1 */

    $$('.s9-heard-item', screen)
      .forEach(item => {

        item.addEventListener(
          'click',
          event => {

            if (
              !isTeacher()
            ) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();


            if (
              screen.dataset.teacherCheck !==
              'on'
            ) {
              return;
            }


            if (
              Number(
                screen.dataset.s9Step
              ) !== 1
            ) {
              return;
            }


            revealHeard(item);
          }
        );
      });


    /* TEACHER STEP 2 */

    $$('.s9-verb', screen)
      .forEach(verb => {

        verb.addEventListener(
          'click',
          event => {

            if (
              !isTeacher()
            ) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();


            if (
              screen.dataset.teacherCheck !==
              'on'
            ) {
              return;
            }


            if (
              Number(
                screen.dataset.s9Step
              ) !== 2
            ) {
              return;
            }


            revealPair(verb);
          }
        );
      });
  }


  /* =======================================================
     WATCH ROLE CHANGE ONLY
     Do NOT rebuild again.
     ======================================================= */

  const roleObserver =
    new MutationObserver(() => {

      applyRole();

      /*
        Changing Teacher / Student
        should clear answer-key state.
      */

      resetSlide9();
    });


  roleObserver.observe(
    document.body,
    {
      attributes:true,
      attributeFilter:[
        'class'
      ]
    }
  );


  /* =======================================================
     INIT — AFTER ui-alignment.js
     ======================================================= */

  function init() {

    /*
      Remove ui-alignment generic action bar
      from Slide 9 so only ONE Check / Reset exists.
    */

    $('.screen[data-screen="9"] .u11-actionbar')
      ?.remove();


    buildSlide9();
  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();
  }


  window.ELEAP_U11_SLIDE9 = {
    version:'8.0',
    reset:resetSlide9
  };

})();
