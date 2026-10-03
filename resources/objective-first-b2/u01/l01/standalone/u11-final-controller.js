/* =========================================================
   E-LEAP U1.1 — FINAL INTERACTION CONTROLLER v6.0

   FINAL LOCK:
   S09 Step 1
     Student: tick -> Check = score only, NO answer key
     Teacher: Check arms correction -> click each item ->
              HEARD / NOT HEARD, cumulative

   S09 Step 2
     Student: type phrasal-verb NUMBER for each definition
              -> Check = score only, NO answer key
     Teacher: Check arms correction -> click a phrasal verb ->
              matching definition highlights, cumulative

   S12
     Student: Type / Record / Submit / Reset
              NO answer-reveal Check
     Teacher: Check -> Suggested Answer

   S13
     Teacher: Check arms correction -> click each card ->
              reveal that card only, cumulative
   ========================================================= */

(function () {
  'use strict';

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const activeScreen = () =>
    $('.screen.active');

  const screenNo = () =>
    Number(
      activeScreen()?.dataset.screen || 0
    );

  const isStudent = () =>
    document.body.classList.contains(
      'u11-student'
    );

  const isTeacher = () =>
    document.body.classList.contains(
      'u11-teacher'
    ) ||
    document.body.classList.contains(
      'presentation'
    );


  /* =======================================================
     COMMON FEEDBACK
     ======================================================= */

  function clearMessage(screen) {
    $('.u11-final-message', screen)
      ?.remove();
  }

  function showMessage(
    screen,
    text,
    type = 'neutral'
  ) {
    if (!screen) return;

    clearMessage(screen);

    const box =
      document.createElement('div');

    box.className =
      `u11-final-message ${type}`;

    box.textContent = text;

    screen.appendChild(box);
  }


  /* =======================================================
     ENSURE ACTION BAR
     ======================================================= */

  function ensureActionBar(
    screen,
    {
      check = true,
      reset = true
    } = {}
  ) {
    if (!screen) return null;

    let bar =
      $('.u11-actionbar', screen);

    if (!bar) {
      bar =
        document.createElement('div');

      bar.className =
        'u11-actionbar';

      screen.appendChild(bar);
    }

    if (
      check &&
      !$('#u11Check', bar)
    ) {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.id = 'u11Check';
      button.className =
        'u11-check';

      button.textContent =
        'Check';

      bar.appendChild(button);
    }

    if (
      reset &&
      !$('#u11Reset', bar)
    ) {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.id = 'u11Reset';

      button.textContent =
        'Reset';

      bar.appendChild(button);
    }

    return bar;
  }


  /* =======================================================
     SLIDE 9 — BUILD STEP 2 STUDENT COLUMN
     ======================================================= */

  function buildStep2StudentColumn() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    const board =
      $('.matching-board', screen);

    if (
      !board ||
      $('.u11-s9-answer-col', board)
    ) {
      return;
    }

    const definitions =
      $$('.definition-item', board);

    const verbs =
      $$('.match-item', board);

    /*
      Build inverse map:
      definition letter -> phrasal verb number.

      Example:
      data-match="a" on verb 8
      => expected answer for definition a = 8
    */

    const expected = {};

    verbs.forEach(verb => {
      const letter =
        verb.dataset.match;

      const match =
        verb.textContent
          .trim()
          .match(/^(\d+)/);

      if (
        letter &&
        match
      ) {
        expected[letter] =
          match[1];
      }
    });

    const col =
      document.createElement('div');

    col.className =
      'match-col u11-s9-answer-col';

    col.innerHTML = `
      <div class="match-heading">
        Your answer
      </div>
    `;

    definitions.forEach(definition => {
      const letter =
        definition.dataset.letter;

      const row =
        document.createElement('div');

      row.className =
        'u11-s9-answer-row';

      row.innerHTML = `
        <span class="u11-s9-letter">
          ${letter}.
        </span>

        <input
          type="number"
          inputmode="numeric"
          min="1"
          max="9"
          class="u11-s9-number"
          data-letter="${letter}"
          data-expected="${expected[letter] || ''}"
          aria-label="Answer for definition ${letter}"
          placeholder="No.">
      `;

      col.appendChild(row);
    });

    board.appendChild(col);
  }


  /* =======================================================
     S09 STEP DETECTION
     ======================================================= */

  function activeStep9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return 1;

    if (
      screen.dataset.ex7Step
    ) {
      return Number(
        screen.dataset.ex7Step
      );
    }

    const active =
      $('.ex7-step.ex7-active', screen);

    const steps =
      $$('.ex7-step', screen);

    const index =
      steps.indexOf(active);

    return index === 1
      ? 2
      : 1;
  }


  /* =======================================================
     SLIDE 9 STUDENT CHECK — STEP 1
     SCORE ONLY
     ======================================================= */

  function checkStudentStep1() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    const items =
      $$('.candidate-item', screen);

    let correct = 0;

    items.forEach(item => {
      const checkbox =
        $('input[type="checkbox"]', item);

      const key =
        $('.item-check', item);

      if (
        !checkbox ||
        !key
      ) {
        return;
      }

      const expected =
        key.dataset.heard === 'yes';

      if (
        checkbox.checked === expected
      ) {
        correct += 1;
      }
    });

    /*
      IMPORTANT:
      Do NOT colour individual answers.
      Do NOT show HEARD / NOT HEARD.
      Student sees score only.
    */

    showMessage(
      screen,
      `You got ${correct}/${items.length} correct.`,
      'score'
    );
  }


  /* =======================================================
     SLIDE 9 STUDENT CHECK — STEP 2
     SCORE ONLY
     ======================================================= */

  function checkStudentStep2() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    const inputs =
      $$('.u11-s9-number', screen);

    let correct = 0;

    inputs.forEach(input => {
      if (
        input.value.trim() ===
        input.dataset.expected
      ) {
        correct += 1;
      }
    });

    /*
      No green/red per item.
      No answer key.
      Score only.
    */

    showMessage(
      screen,
      `You got ${correct}/${inputs.length} correct.`,
      'score'
    );
  }


  /* =======================================================
     SLIDE 9 TEACHER CHECK
     CHECK BUTTON ARMS CORRECTION MODE ONLY
     ======================================================= */

  function armTeacherSlide9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    screen.dataset.finalTeacherCheck =
      'on';

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        '✓ Check mode ON';

      check.classList.add(
        'final-check-on'
      );
    }

    showMessage(
      screen,
      'Check mode is ON. Click each item to reveal its answer.',
      'teacher'
    );
  }


  /* =======================================================
     SLIDE 9 TEACHER STEP 1
     CLICK EACH PHRASAL VERB
     ======================================================= */

  function revealTeacherStep1(item) {
    if (
      item.classList.contains(
        'u11-final-revealed'
      )
    ) {
      return;
    }

    const key =
      $('.item-check', item);

    if (!key) return;

    const heard =
      key.dataset.heard === 'yes';

    const answer =
      document.createElement('div');

    answer.className =
      'u11-final-item-answer';

    answer.textContent =
      heard
        ? 'HEARD'
        : 'NOT HEARD';

    item.appendChild(answer);

    item.classList.add(
      'u11-final-revealed'
    );
  }


  /* =======================================================
     SLIDE 9 TEACHER STEP 2
     CLICK LEFT VERB -> RIGHT DEFINITION HIGHLIGHTS
     CUMULATIVE
     ======================================================= */

  function revealTeacherStep2(verb) {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    const letter =
      verb.dataset.match;

    if (!letter) return;

    const definition =
      $(
        `.definition-item[data-letter="${letter}"]`,
        screen
      );

    if (!definition) return;

    const numberMatch =
      verb.textContent
        .trim()
        .match(/^(\d+)/);

    const number =
      numberMatch
        ? numberMatch[1]
        : '';

    verb.classList.add(
      'u11-final-match-left'
    );

    definition.classList.add(
      'u11-final-match-right'
    );

    if (
      !$('.u11-final-pair', definition)
    ) {
      const pair =
        document.createElement('div');

      pair.className =
        'u11-final-pair';

      pair.textContent =
        `Answer: ${letter} = ${number}`;

      definition.appendChild(pair);
    }
  }


  /* =======================================================
     SLIDE 9 RESET
     ======================================================= */

  function resetSlide9() {
    const screen =
      $('.screen[data-screen="9"]');

    if (!screen) return;

    delete screen.dataset.finalTeacherCheck;

    clearMessage(screen);

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        'Check';

      check.classList.remove(
        'final-check-on'
      );
    }

    /*
      STEP 1
    */

    $$('.candidate-item', screen)
      .forEach(item => {
        item.classList.remove(
          'u11-final-revealed',
          'u11-answer-correct',
          'u11-answer-wrong',
          'v5-revealed'
        );

        $('.u11-final-item-answer', item)
          ?.remove();

        $('.v5-teacher-answer', item)
          ?.remove();

        const checkbox =
          $('input[type="checkbox"]', item);

        if (checkbox) {
          checkbox.checked = false;
        }
      });

    /*
      STEP 2 student input
    */

    $$('.u11-s9-number', screen)
      .forEach(input => {
        input.value = '';
      });

    /*
      STEP 2 teacher states
    */

    $$('.match-item', screen)
      .forEach(item => {
        item.disabled = false;

        item.classList.remove(
          'selected',
          'matched',
          'wrong',
          'u11-v4-match-source',
          'v5-match-question',
          'u11-final-match-left'
        );
      });

    $$('.definition-item', screen)
      .forEach(item => {
        item.disabled = false;

        item.classList.remove(
          'selected',
          'matched',
          'wrong',
          'u11-v4-match-answer',
          'v5-match-answer',
          'u11-final-match-right'
        );

        $('.u11-v4-answer-label', item)
          ?.remove();

        $('.v5-answer-tag', item)
          ?.remove();

        $('.u11-final-pair', item)
          ?.remove();
      });

    /*
      Reset original app.js matching state.
      This clears its private selectedVerb too.
    */

    $('#resetMatch', screen)
      ?.click();

    const status =
      $('#matchStatus', screen);

    if (status) {
      status.textContent =
        'Select a phrasal verb, then select its definition.';
    }
  }


  /* =======================================================
     SLIDE 12
     ======================================================= */

  const slide12Answer = `
    <b>Suggested answer</b>

    <p>
      If I were Emma, I would wear clothes that make me
      feel comfortable and confident.
    </p>

    <p>
      She could <b>dress up</b> for special occasions,
      but she does not need to <b>keep up with</b>
      every new fashion.
    </p>

    <p>
      She could also <b>put together</b> an outfit
      that suits her personality and helps her feel
      like herself.
    </p>
  `;


  function ensureSlide12Submit() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    const bar =
      ensureActionBar(
        screen,
        {
          check: true,
          reset: true
        }
      );

    if (
      !$('#u11Submit12', bar)
    ) {
      const submit =
        document.createElement('button');

      submit.type =
        'button';

      submit.id =
        'u11Submit12';

      submit.className =
        'u11-submit12';

      submit.textContent =
        'Submit';

      bar.insertBefore(
        submit,
        $('#u11Reset', bar)
      );
    }
  }


  function submitSlide12() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    const textarea =
      $('textarea', screen);

    const playback =
      $('.u11-record-playback', screen);

    const hasText =
      Boolean(
        textarea?.value.trim()
      );

    const hasRecording =
      Boolean(
        playback &&
        !playback.hidden &&
        playback.src
      );

    if (
      !hasText &&
      !hasRecording
    ) {
      showMessage(
        screen,
        'Type or record your response before submitting.',
        'warning'
      );

      return;
    }

    const button =
      $('#u11Submit12', screen);

    if (button) {
      button.textContent =
        'Submitted ✓';

      button.classList.add(
        'submitted'
      );
    }

    showMessage(
      screen,
      'Response submitted.',
      'score'
    );
  }


  function showSlide12TeacherAnswer() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    let panel =
      $('.u11-final-s12-answer', screen);

    if (!panel) {
      panel =
        document.createElement('div');

      panel.className =
        'u11-final-s12-answer';

      panel.innerHTML =
        slide12Answer;

      $('.advice-layout', screen)
        ?.after(panel);
    }

    panel.classList.add(
      'show'
    );
  }


  function resetSlide12() {
    const screen =
      $('.screen[data-screen="12"]');

    if (!screen) return;

    clearMessage(screen);

    /*
      Typed response
    */

    $$(
      'textarea,' +
      '.u11-student-input',
      screen
    ).forEach(field => {
      field.value = '';
    });

    /*
      Stop recording if currently recording.
    */

    const stop =
      $('.u11-record-stop', screen);

    if (
      stop &&
      !stop.disabled
    ) {
      stop.click();
    }

    /*
      Reset record UI.
    */

    const start =
      $('.u11-record-start', screen);

    const status =
      $('.u11-record-status', screen);

    const audio =
      $('.u11-record-playback', screen);

    if (start) {
      start.disabled = false;
    }

    if (stop) {
      stop.disabled = true;
    }

    if (status) {
      status.textContent =
        'Ready';
    }

    if (audio) {
      try {
        audio.pause();
      } catch (_) {}

      audio.removeAttribute(
        'src'
      );

      audio.hidden = true;

      audio.load?.();
    }

    /*
      Recording stop callback may finish shortly after reset,
      so clear playback once more.
    */

    setTimeout(
      () => {
        const lateAudio =
          $('.u11-record-playback', screen);

        if (lateAudio) {
          try {
            lateAudio.pause();
          } catch (_) {}

          lateAudio.removeAttribute(
            'src'
          );

          lateAudio.hidden = true;
        }

        if (status) {
          status.textContent =
            'Ready';
        }
      },
      150
    );

    /*
      Submit state
    */

    const submit =
      $('#u11Submit12', screen);

    if (submit) {
      submit.textContent =
        'Submit';

      submit.disabled = false;

      submit.classList.remove(
        'submitted'
      );
    }

    /*
      Teacher suggested answer
    */

    $('.u11-final-s12-answer', screen)
      ?.classList.remove(
        'show'
      );

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        'Check';

      check.classList.remove(
        'final-check-on'
      );
    }
  }


  /* =======================================================
     SLIDE 13
     ======================================================= */

  function armTeacherSlide13() {
    const screen =
      $('.screen[data-screen="13"]');

    if (!screen) return;

    screen.dataset.finalTeacherCheck =
      'on';

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        '✓ Check mode ON';

      check.classList.add(
        'final-check-on'
      );
    }

    showMessage(
      screen,
      'Check mode is ON. Click each box to reveal its answer.',
      'teacher'
    );
  }


  function revealSlide13Card(card) {
    if (
      card.classList.contains(
        'u11-final-revealed'
      )
    ) {
      return;
    }

    const answer =
      card.dataset.back;

    if (!answer) return;

    const box =
      document.createElement('div');

    box.className =
      'u11-final-card-answer';

    box.textContent =
      answer;

    card.appendChild(box);

    card.classList.add(
      'u11-final-revealed'
    );
  }


  function resetSlide13() {
    const screen =
      $('.screen[data-screen="13"]');

    if (!screen) return;

    delete screen.dataset.finalTeacherCheck;

    clearMessage(screen);

    const check =
      $('#u11Check', screen);

    if (check) {
      check.textContent =
        'Check';

      check.classList.remove(
        'final-check-on'
      );
    }

    $$('.challenge-card', screen)
      .forEach(card => {
        card.classList.remove(
          'u11-final-revealed',
          'flipped',
          'v5-revealed'
        );

        $('.u11-final-card-answer', card)
          ?.remove();

        $('.v5-teacher-answer', card)
          ?.remove();

        /*
          Restore question text if legacy
          app.js had replaced it.
        */

        if (
          card.dataset.front
        ) {
          const input =
            card.nextElementSibling
              ?.classList
              .contains(
                'u11-challenge-input'
              )
              ? card.nextElementSibling
              : null;

          card.textContent =
            card.dataset.front;

          /*
            Reinsert input is not needed because it
            is a sibling, not inside the button.
          */

          if (input) {
            input.value = '';
          }
        }
      });
  }


  /* =======================================================
     FINAL ROLE RULES
     ======================================================= */

  function applyRoleUI() {
    const s9 =
      $('.screen[data-screen="9"]');

    if (s9) {
      /*
        Legacy per-item Check buttons
        are hidden for EVERY role.
        We use the single standard Check.
      */

      $$('.item-check', s9)
        .forEach(button => {
          button.style.display =
            'none';
        });

      /*
        Third Student column:
        visible Student only.
      */

      const answerCol =
        $('.u11-s9-answer-col', s9);

      if (answerCol) {
        answerCol.hidden =
          !isStudent();
      }
    }


    const s12 =
      $('.screen[data-screen="12"]');

    if (s12) {
      const check =
        $('#u11Check', s12);

      const submit =
        $('#u11Submit12', s12);

      if (check) {
        /*
          Student must NOT have Teacher answer Check.
        */

        check.hidden =
          isStudent();
      }

      if (submit) {
        /*
          Submit belongs to Student.
        */

        submit.hidden =
          !isStudent();
      }
    }
  }


  /* =======================================================
     CENTRAL CLICK CONTROLLER
     IMPORTANT:
     Loaded BEFORE ui-alignment.js so this capture handler
     wins over legacy correction handlers.
     ======================================================= */

  document.addEventListener(
    'click',
    event => {
      const target =
        event.target;

      const n =
        screenNo();


      /* ---------------------------------------------------
         S09 CHECK
         --------------------------------------------------- */

      if (
        n === 9 &&
        target.closest('#u11Check')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (isStudent()) {
          if (
            activeStep9() === 1
          ) {
            checkStudentStep1();
          } else {
            checkStudentStep2();
          }

          return;
        }

        if (isTeacher()) {
          armTeacherSlide9();
          return;
        }
      }


      /* ---------------------------------------------------
         S09 RESET
         --------------------------------------------------- */

      if (
        n === 9 &&
        target.closest('#u11Reset')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        resetSlide9();
        return;
      }


      /* ---------------------------------------------------
         S09 STUDENT STEP 2
         Disable original click-matching engine.
         Student TYPES numbers only.
         --------------------------------------------------- */

      if (
        n === 9 &&
        isStudent() &&
        (
          target.closest(
            '.match-item'
          ) ||
          target.closest(
            '.definition-item'
          )
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }


      /* ---------------------------------------------------
         S09 TEACHER STEP 1
         --------------------------------------------------- */

      if (
        n === 9 &&
        isTeacher()
      ) {
        const s =
          activeScreen();

        const item =
          target.closest(
            '.candidate-item'
          );

        if (item) {
          /*
            Teacher should not tick the checkbox.
          */

          event.preventDefault();
          event.stopImmediatePropagation();

          if (
            s.dataset.finalTeacherCheck ===
            'on' &&
            activeStep9() === 1
          ) {
            revealTeacherStep1(
              item
            );
          }

          return;
        }
      }


      /* ---------------------------------------------------
         S09 TEACHER STEP 2
         --------------------------------------------------- */

      if (
        n === 9 &&
        isTeacher()
      ) {
        const s =
          activeScreen();

        const verb =
          target.closest(
            '.match-item'
          );

        if (verb) {
          event.preventDefault();
          event.stopImmediatePropagation();

          if (
            s.dataset.finalTeacherCheck ===
            'on' &&
            activeStep9() === 2
          ) {
            revealTeacherStep2(
              verb
            );
          }

          return;
        }

        /*
          Definitions themselves do nothing
          in Teacher correction mode.
        */

        if (
          target.closest(
            '.definition-item'
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }


      /* ---------------------------------------------------
         S12 STUDENT SUBMIT
         --------------------------------------------------- */

      if (
        n === 12 &&
        target.closest(
          '#u11Submit12'
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (isStudent()) {
          submitSlide12();
        }

        return;
      }


      /* ---------------------------------------------------
         S12 CHECK
         Student cannot use it.
         Teacher Check shows Suggested Answer.
         --------------------------------------------------- */

      if (
        n === 12 &&
        target.closest(
          '#u11Check'
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (isTeacher()) {
          showSlide12TeacherAnswer();

          const button =
            $('#u11Check', activeScreen());

          if (button) {
            button.textContent =
              '✓ Answer shown';

            button.classList.add(
              'final-check-on'
            );
          }
        }

        return;
      }


      /* ---------------------------------------------------
         S12 RESET
         --------------------------------------------------- */

      if (
        n === 12 &&
        target.closest(
          '#u11Reset'
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        resetSlide12();
        return;
      }


      /* ---------------------------------------------------
         S13 CHECK
         --------------------------------------------------- */

      if (
        n === 13 &&
        target.closest(
          '#u11Check'
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (isTeacher()) {
          armTeacherSlide13();
        }

        return;
      }


      /* ---------------------------------------------------
         S13 TEACHER CARD
         --------------------------------------------------- */

      if (
        n === 13 &&
        isTeacher()
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
              .dataset
              .finalTeacherCheck ===
            'on'
          ) {
            revealSlide13Card(
              card
            );
          }

          return;
        }
      }


      /* ---------------------------------------------------
         S13 RESET
         --------------------------------------------------- */

      if (
        n === 13 &&
        target.closest(
          '#u11Reset'
        )
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
     REBUILD / REFRESH
     ======================================================= */

  function refresh() {
    buildStep2StudentColumn();

    const s9 =
      $('.screen[data-screen="9"]');

    const s12 =
      $('.screen[data-screen="12"]');

    const s13 =
      $('.screen[data-screen="13"]');

    if (s9) {
      ensureActionBar(
        s9,
        {
          check: true,
          reset: true
        }
      );
    }

    if (s12) {
      ensureSlide12Submit();
    }

    if (s13) {
      ensureActionBar(
        s13,
        {
          check: true,
          reset: true
        }
      );
    }

    applyRoleUI();
  }


  /*
    ui-alignment.js runs AFTER this controller
    and creates some UI dynamically.
    MutationObserver keeps this final controller
    synchronized with those changes.
  */

  const observer =
    new MutationObserver(
      () => {
        clearTimeout(
          window.__u11FinalRefresh
        );

        window.__u11FinalRefresh =
          setTimeout(
            refresh,
            10
          );
      }
    );

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
    First pass after all synchronous scripts.
  */

  setTimeout(
    refresh,
    50
  );


  window.ELEAP_U11_FINAL = {
    version: '6.0',
    refresh,
    resetSlide9,
    resetSlide12,
    resetSlide13
  };

})();
