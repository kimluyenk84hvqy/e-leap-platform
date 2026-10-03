/* =========================================================
   E-LEAP U1.1 CONTROL ALIGNMENT v2.0
   Objective First B2 — Unit 1.1

   Aligns U1.1 with U1.2 Golden Reference:
   - Student / Teacher / Presentation
   - Timer
   - Responses
   - Lucky No.
   - Reveal next
   - Check / Reset where meaningful
   - Screen 9 Step 1 / Step 2
   - Homework response + suggested answer
   ========================================================= */

(function () {
  'use strict';

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  let mode = 'teacher';
  let timerInt = null;

  /* =======================================================
     HELPERS
     ======================================================= */

  function activeScreen() {
    return $('.screen.active');
  }

  function activeScreenNumber() {
    return activeScreen()?.dataset.screen || '';
  }

  function stopAllMedia() {
    $$('audio,video').forEach(m => {
      try {
        m.pause();
      } catch (_) {}
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function feedbackTone(ok) {
    try {
      const C =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!C) return;

      const c = new C();
      const g = c.createGain();

      g.connect(c.destination);

      g.gain.setValueAtTime(
        .0001,
        c.currentTime
      );

      g.gain.exponentialRampToValueAtTime(
        .14,
        c.currentTime + .015
      );

      g.gain.exponentialRampToValueAtTime(
        .0001,
        c.currentTime + (ok ? .34 : .28)
      );

      const notes = ok
        ? [659.25, 783.99]
        : [220, 174.61];

      notes.forEach((f, n) => {
        const o = c.createOscillator();

        o.type =
          ok ? 'sine' : 'triangle';

        o.frequency.setValueAtTime(
          f,
          c.currentTime + n * .11
        );

        o.connect(g);

        o.start(
          c.currentTime + n * .11
        );

        o.stop(
          c.currentTime +
          n * .11 +
          .18
        );
      });

      setTimeout(
        () => c.close(),
        650
      );

    } catch (_) {}
  }


  /* =======================================================
     HEADER MODES + TEACHER TOOLS
     ======================================================= */

  const topbar = $('.topbar');

  if (topbar) {
    const oldBadge =
      $('.review-badge');

    const right =
      document.createElement('div');

    right.className =
      'u11-header-right';

    right.innerHTML = `
      <div class="u11-modes">

        <button
          type="button"
          data-u11-mode="student">
          Student
        </button>

        <button
          type="button"
          data-u11-mode="teacher"
          class="active">
          Teacher
        </button>

        <button
          type="button"
          data-u11-mode="presentation">
          Presentation
        </button>

      </div>

      <div class="u11-teacher-tools">

        <button
          type="button"
          id="u11Timer">
          ⏱ Timer
        </button>

        <button
          type="button"
          id="u11Responses">
          ▦ Responses
        </button>

        <button
          type="button"
          id="u11Lucky">
          ★ Lucky No.
        </button>

        <button
          type="button"
          id="u11Reveal">
          Reveal next
        </button>

      </div>
    `;

    if (oldBadge) {
      oldBadge.remove();
    }

    topbar.appendChild(right);
  }


  /* =======================================================
     SHARED MODAL — SAME LOGIC AS U1.2
     ======================================================= */

  const modal =
    document.createElement('div');

  modal.className =
    'u11-modal';

  modal.innerHTML = `
    <div class="u11-modalbox">

      <button
        class="u11-close"
        id="u11CloseModal">
        ×
      </button>

      <div id="u11ModalBody"></div>

    </div>
  `;

  document.body.appendChild(modal);

  function openModal(html) {
    $('#u11ModalBody').innerHTML =
      html;

    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  $('#u11CloseModal')
    ?.addEventListener(
      'click',
      closeModal
    );

  modal.addEventListener(
    'click',
    e => {
      if (e.target === modal) {
        closeModal();
      }
    }
  );


  /* =======================================================
     MODES
     ======================================================= */

  function setMode(nextMode) {
    mode = nextMode;

    document.body.classList.remove(
      'u11-student',
      'u11-teacher',
      'presentation'
    );

    if (mode === 'student') {
      document.body.classList.add(
        'u11-student'
      );
    }

    if (mode === 'teacher') {
      document.body.classList.add(
        'u11-teacher'
      );
    }

    if (mode === 'presentation') {
      document.body.classList.add(
        'presentation'
      );
    }

    $$('[data-u11-mode]')
      .forEach(btn => {
        btn.classList.toggle(
          'active',
          btn.dataset.u11Mode === mode
        );
      });

    stopAllMedia();

    refreshActionBar();
  }

  $$('[data-u11-mode]')
    .forEach(btn => {
      btn.addEventListener(
        'click',
        () => {
          setMode(
            btn.dataset.u11Mode
          );
        }
      );
    });


  /* =======================================================
     RESPONSES — U1.2 STYLE
     ======================================================= */

  function collectResponses() {
    const screen =
      activeScreen();

    if (!screen) return [];

    const result = [];

    const poll =
      $('.poll-btn.selected', screen);

    if (poll) {
      result.push(
        poll.textContent.trim()
      );
    }

    $$('.confidence button.selected', screen)
      .forEach(btn => {
        result.push(
          `Confidence: ${btn.textContent.trim()}`
        );
      });

    $$('textarea', screen)
      .forEach(box => {
        const value =
          box.value.trim();

        if (value) {
          result.push(value);
        }
      });

    const selected =
      $$(
        '.candidate-grid input[type="checkbox"]:checked',
        screen
      );

    if (selected.length) {
      result.push(
        selected
          .map(x =>
            x.closest('label')
              ?.textContent.trim()
          )
          .filter(Boolean)
          .join(', ')
      );
    }

    const matched =
      $$('.match-item.matched', screen);

    if (matched.length) {
      result.push(
        `${matched.length} correct matches`
      );
    }

    return result;
  }

  $('#u11Responses')
    ?.addEventListener(
      'click',
      () => {
        const responses =
          collectResponses();

        const displayResponses =
          responses.length
            ? responses
            : [
                'No response yet.',
                'Responses will appear here during classroom use.'
              ];

        openModal(`
          <h2>Responses</h2>

          <div class="u11-tabs">
            <button class="active">
              By option
            </button>

            <button>
              All
            </button>

            <button>
              Spotlight
            </button>
          </div>

          <p>
            <b>
              Names hidden by default
              in classroom display.
            </b>
          </p>

          ${displayResponses
            .map((r, n) => `
              <div class="u11-response-card">
                Response ${n + 1}:
                ${escapeHtml(r)}
              </div>
            `)
            .join('')}

          <p class="u11-media-status">
            Current-screen response view.
          </p>
        `);
      }
    );


  /* =======================================================
     TIMER — SAME BEHAVIOUR AS U1.2
     ======================================================= */

  $('#u11Timer')
    ?.addEventListener(
      'click',
      () => {

        openModal(`
          <h2>Classroom Timer</h2>

          <div
            class="u11-timerbig"
            id="u11Clock">
            01:00
          </div>

          <div class="u11-timercontrols">

            <button id="u11T30">
              30 sec
            </button>

            <button id="u11T60">
              60 sec
            </button>

            <button id="u11T120">
              2 min
            </button>

            <button id="u11TStart">
              Start / Pause
            </button>

          </div>
        `);

        let left = 60;
        let running = false;

        const draw = () => {
          const clock =
            $('#u11Clock');

          if (!clock) return;

          clock.textContent =
            String(
              Math.floor(left / 60)
            ).padStart(2, '0')
            +
            ':'
            +
            String(
              left % 60
            ).padStart(2, '0');
        };

        const set = n => {
          left = n;
          draw();
        };

        $('#u11T30').onclick =
          () => set(30);

        $('#u11T60').onclick =
          () => set(60);

        $('#u11T120').onclick =
          () => set(120);

        $('#u11TStart').onclick =
          () => {

            running = !running;

            if (timerInt) {
              clearInterval(timerInt);
            }

            if (running) {
              timerInt =
                setInterval(
                  () => {
                    if (left > 0) {
                      left--;
                      draw();
                    } else {
                      clearInterval(
                        timerInt
                      );

                      running = false;
                    }
                  },
                  1000
                );
            }
          };
      }
    );


  /* =======================================================
     LUCKY NUMBER — SAME RANGE AS U1.2
     ======================================================= */

  $('#u11Lucky')
    ?.addEventListener(
      'click',
      () => {

        openModal(`
          <h2>Lucky Number</h2>

          <div class="u11-lucky">
            ${
              Math.floor(
                Math.random() * 24
              ) + 1
            }
          </div>

          <p style="text-align:center">
            Use for random participation.
          </p>
        `);
      }
    );


  /* =======================================================
     SCREEN 9 — STEP TABS
     ======================================================= */

  const screen9 =
    $('.screen[data-screen="9"]');

  if (screen9) {
    const steps =
      $$('.ex7-step', screen9);

    if (
      steps.length >= 2 &&
      !$('.ex7-step-tabs', screen9)
    ) {
      const tabs =
        document.createElement('div');

      tabs.className =
        'ex7-step-tabs';

      tabs.innerHTML = `
        <button
          class="ex7-step-tab active"
          data-step="0">
          Step 1
        </button>

        <button
          class="ex7-step-tab"
          data-step="1">
          Step 2
        </button>
      `;

      steps[0]
        .parentNode
        .insertBefore(
          tabs,
          steps[0]
        );

      const originalInstruction =
        $('.instruction', screen9);

      const instructions = [
        'Listen again to Speakers 2–5 and identify the phrasal verbs you hear. Check the items one by one.',
        'Match the nine target phrasal verbs to definitions a–i.'
      ];

      function activate(index) {
        steps.forEach(
          (step, n) => {
            step.classList.toggle(
              'ex7-active',
              n === index
            );
          }
        );

        $$('.ex7-step-tab', tabs)
          .forEach(
            (btn, n) => {
              btn.classList.toggle(
                'active',
                n === index
              );
            }
          );

        if (originalInstruction) {
          originalInstruction.textContent =
            instructions[index];
        }

        screen9.dataset.ex7Step =
          String(index + 1);

        refreshActionBar();
      }

      $$('.ex7-step-tab', tabs)
        .forEach(btn => {
          btn.addEventListener(
            'click',
            () => {
              activate(
                Number(btn.dataset.step)
              );
            }
          );
        });

      activate(0);
    }
  }


  /* =======================================================
     HOMEWORK — STUDENT RESPONSE + SUGGESTED ANSWER
     ======================================================= */

  const homework =
    $('.screen[data-screen="15"]');

  if (
    homework &&
    !$('.u11-homework-response', homework)
  ) {
    const card =
      $('.homework-card', homework);

    if (card) {
      const response =
        document.createElement('div');

      response.className =
        'u11-homework-response';

      response.innerHTML = `
        <label
          class="u11-homework-label"
          for="u11HomeworkText">
          Your response
        </label>

        <textarea
          id="u11HomeworkText"
          class="u11-homework-textarea"
          placeholder="Type your response here…">
        </textarea>

        <div class="u11-homework-actions">

          <button
            type="button"
            class="u11-homework-submit"
            id="u11HomeworkSubmit">
            Submit
          </button>

          <button
            type="button"
            id="u11SuggestedAnswer">
            Suggested answer
          </button>

        </div>

        <div
          class="u11-suggested-answer"
          id="u11SuggestedPanel">

          <b>Suggested answer</b>

          <p>
            Dear Emma,
          </p>

          <p>
            I think you should wear clothes
            that make you feel comfortable
            and confident. You do not need
            to <b>keep up with</b> every new
            fashion. If you are going somewhere
            special, you could <b>dress up</b>,
            but you can still choose an outfit
            that suits your own style.
          </p>

          <p>
            You could also <b>put together</b>
            an outfit with one unusual item
            if you want to <b>stand out</b>.
            The most important thing is to
            feel like yourself.
          </p>

          <p>
            Best wishes
          </p>

        </div>
      `;

      card.appendChild(response);

      $('#u11HomeworkSubmit')
        ?.addEventListener(
          'click',
          e => {
            e.currentTarget.textContent =
              'Submitted ✓';

            e.currentTarget.disabled =
              true;

            e.currentTarget.classList.add(
              'submitted'
            );
          }
        );

      $('#u11SuggestedAnswer')
        ?.addEventListener(
          'click',
          () => {
            $('#u11SuggestedPanel')
              ?.classList.toggle('show');
          }
        );
    }
  }


  /* =======================================================
     GENERIC ACTION BAR
     Check / Reset
     ======================================================= */

  function removeActionBar() {
    $('.u11-actionbar')
      ?.remove();
  }

  function isCheckableScreen(number) {
    return [
      '9',
      '10',
      '11'
    ].includes(number);
  }

  function resetActiveScreen() {
    const screen =
      activeScreen();

    if (!screen) return;

    screen
      .querySelectorAll(
        '.revealed'
      )
      .forEach(el => {
        el.classList.remove(
          'revealed'
        );

        if (
          el.matches(
            '.blank-reveal,.inline-blank'
          )
        ) {
          el.textContent =
            el.dataset.originalText ||
            '__________';
        }
      });

    screen
      .querySelectorAll(
        '.item-check'
      )
      .forEach(btn => {
        btn.textContent =
          'check';

        btn.classList.remove(
          'heard',
          'not-heard'
        );
      });

    screen
      .querySelectorAll(
        '.candidate-grid input[type="checkbox"]'
      )
      .forEach(box => {
        box.checked = false;
      });

    screen
      .querySelectorAll(
        '.match-item,.definition-item'
      )
      .forEach(el => {
        el.disabled = false;

        el.classList.remove(
          'selected',
          'matched',
          'wrong'
        );
      });

    const matchStatus =
      $('#matchStatus', screen);

    if (matchStatus) {
      matchStatus.textContent =
        'Select a phrasal verb, then select its definition.';
    }

    screen
      .querySelectorAll('textarea')
      .forEach(box => {
        if (
          box.id !==
          'u11HomeworkText'
        ) {
          box.value = '';
        }
      });

    screen
      .querySelectorAll(
        '.u11-check-feedback'
      )
      .forEach(x => x.remove());

    feedbackTone(true);
  }

  function checkScreen9() {
    const screen =
      activeScreen();

    if (!screen) return;

    const step =
      screen.dataset.ex7Step || '1';

    let ok = true;

    if (step === '1') {
      const items =
        $$('.candidate-item', screen);

      items.forEach(item => {
        const box =
          $('input[type="checkbox"]', item);

        const check =
          $('.item-check', item);

        if (!box || !check) return;

        const expected =
          check.dataset.heard === 'yes';

        const correct =
          box.checked === expected;

        ok = ok && correct;

        item.classList.toggle(
          'u11-answer-correct',
          correct
        );

        item.classList.toggle(
          'u11-answer-wrong',
          !correct
        );
      });
    }

    if (step === '2') {
      ok =
        $$('.match-item.matched', screen)
          .length === 9;
    }

    showCheckFeedback(ok);
  }

  function showCheckFeedback(ok) {
    const screen =
      activeScreen();

    if (!screen) return;

    $('.u11-check-feedback', screen)
      ?.remove();

    const msg =
      document.createElement('div');

    msg.className =
      'u11-check-feedback ' +
      (ok ? 'good' : 'try');

    msg.textContent =
      ok
        ? '✓ Correct!'
        : 'Try again — check the highlighted answer(s).';

    screen.appendChild(msg);

    feedbackTone(ok);

    window.ELEAP_LAST_RESULT = {
      activityId:
        activeScreenNumber(),
      isCorrect: ok,
      score: ok ? 1 : 0,
      checkedAt:
        new Date().toISOString()
    };
  }

  function refreshActionBar() {
    removeActionBar();

    const number =
      activeScreenNumber();

    if (
      !number ||
      number === '16' ||
      number === '15'
    ) {
      return;
    }

    const screen =
      activeScreen();

    if (!screen) return;

    const bar =
      document.createElement('div');

    bar.className =
      'u11-actionbar';

    if (
      isCheckableScreen(number)
    ) {
      bar.innerHTML += `
        <button
          type="button"
          class="u11-check"
          id="u11Check">
          Check
        </button>
      `;
    }

    bar.innerHTML += `
      <button
        type="button"
        id="u11Reset">
        Reset
      </button>
    `;

    screen.appendChild(bar);

    $('#u11Check')
      ?.addEventListener(
        'click',
        () => {
          if (number === '9') {
            checkScreen9();
            return;
          }

          /*
            Screens 10 and 11 are teacher-led
            click-to-reveal activities.
            Check here reveals the teacher answer
            state rather than fabricating student input.
          */

          revealNext(true);
        }
      );

    $('#u11Reset')
      ?.addEventListener(
        'click',
        resetActiveScreen
      );
  }


  /* =======================================================
     REVEAL NEXT
     Same teacher purpose as U1.2.
     ======================================================= */

  function revealNext(fromCheck = false) {
    const screen =
      activeScreen();

    if (!screen) return;

    /*
      1. Hidden language support
    */

    const hiddenSupport =
      $('.support.hidden', screen);

    if (hiddenSupport) {
      hiddenSupport.classList.remove(
        'hidden'
      );

      feedbackTone(true);
      return;
    }

    /*
      2. Blank answers
    */

    const blank =
      $(
        '.blank-reveal:not(.revealed),' +
        '.inline-blank:not(.revealed)',
        screen
      );

    if (blank) {
      blank.click();
      feedbackTone(true);
      return;
    }

    /*
      3. Guided discovery
    */

    const discovery =
      $('.discovery-card:not(.revealed)', screen);

    if (discovery) {
      discovery.click();
      feedbackTone(true);
      return;
    }

    /*
      4. Speaking strategy cards
    */

    const layer =
      $('.layer-card:not(.revealed)', screen);

    if (layer) {
      layer.click();
      feedbackTone(true);
      return;
    }

    /*
      5. Exercise 7 item check
    */

    const item =
      $('.item-check:not(.heard):not(.not-heard)', screen);

    if (item) {
      item.click();
      feedbackTone(true);
      return;
    }

    /*
      6. Challenge cards
    */

    const challenge =
      $('.challenge-card:not(.flipped)', screen);

    if (challenge) {
      challenge.click();
      feedbackTone(true);
      return;
    }

    /*
      7. Homework suggested answer
    */

    if (
      activeScreenNumber() === '15'
    ) {
      $('#u11SuggestedPanel')
        ?.classList.add('show');

      feedbackTone(true);
      return;
    }

    if (!fromCheck) {
      openModal(`
        <h2>Reveal next</h2>
        <p>
          No more teacher answers
          to reveal on this screen.
        </p>
      `);
    }
  }

  $('#u11Reveal')
    ?.addEventListener(
      'click',
      () => revealNext(false)
    );


  /* =======================================================
     TRACK SCREEN CHANGES
     Existing U1.1 engine changes .active itself.
     Observe that instead of rewriting navigation.
     ======================================================= */

  const observer =
    new MutationObserver(
      mutations => {
        const changed =
          mutations.some(
            mutation =>
              mutation.type ===
                'attributes' &&
              mutation.attributeName ===
                'class' &&
              mutation.target.classList
                .contains('screen')
          );

        if (changed) {
          stopAllMedia();
          refreshActionBar();
        }
      }
    );

  $$('.screen')
    .forEach(screen => {
      observer.observe(
        screen,
        {
          attributes:true,
          attributeFilter:['class']
        }
      );
    });


  /* =======================================================
     KEYBOARD ESC
     ======================================================= */

  document.addEventListener(
    'keydown',
    e => {
      if (e.key === 'Escape') {
        closeModal();
      }
    }
  );


  /* =======================================================
     INITIAL STATE
     ======================================================= */

  setMode('teacher');
  refreshActionBar();

  window.ELEAP_U11_UI = {
    setMode,
    openModal,
    closeModal,
    revealNext,
    refreshActionBar
  };

})();
