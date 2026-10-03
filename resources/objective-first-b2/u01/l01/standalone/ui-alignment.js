/* =========================================================
   E-LEAP U1.1 UI ALIGNMENT v1.0
   - U1.2-style teacher tools
   - Presentation mode
   - Global timer
   - Local response summary
   - Screen 9 Step 1 / Step 2 tabs
   ========================================================= */

(function () {
  'use strict';

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  /* =======================================================
     TEACHER TOOLBAR
     ======================================================= */

  const topbar = $('.topbar');

  if (topbar) {
    let right = $('.u11-top-right');

    if (!right) {
      right = document.createElement('div');
      right.className = 'u11-top-right';

      const finalBadge = $('.review-badge');

      if (finalBadge) {
        finalBadge.parentNode.insertBefore(
          right,
          finalBadge
        );

        right.appendChild(finalBadge);
      } else {
        topbar.appendChild(right);
      }
    }

    const tools = document.createElement('div');
    tools.className = 'u11-teacher-tools';

    tools.innerHTML = `
      <button
        type="button"
        class="u11-tool-btn"
        id="u11ResponsesBtn"
      >
        Responses
      </button>

      <button
        type="button"
        class="u11-tool-btn"
        id="u11TimerBtn"
      >
        Timer
      </button>

      <button
        type="button"
        class="u11-tool-btn"
        id="u11PresentationBtn"
      >
        Presentation
      </button>
    `;

    right.appendChild(tools);
  }


  /* =======================================================
     MODAL
     ======================================================= */

  const modal = document.createElement('div');

  modal.className = 'u11-modal';

  modal.innerHTML = `
    <div class="u11-modal-box">
      <button
        type="button"
        class="u11-modal-close"
        aria-label="Close"
      >
        ×
      </button>

      <div id="u11ModalContent"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const modalContent =
    $('#u11ModalContent');

  function openModal(html) {
    modalContent.innerHTML = html;
    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
  }

  $('.u11-modal-close')
    ?.addEventListener(
      'click',
      closeModal
    );

  modal.addEventListener(
    'click',
    event => {
      if (event.target === modal) {
        closeModal();
      }
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Escape') {
        closeModal();
      }
    }
  );


  /* =======================================================
     PRESENTATION MODE
     ======================================================= */

  const presentationBtn =
    $('#u11PresentationBtn');

  presentationBtn
    ?.addEventListener(
      'click',
      () => {
        document.body.classList.toggle(
          'presentation'
        );

        const enabled =
          document.body.classList.contains(
            'presentation'
          );

        presentationBtn.textContent =
          enabled
            ? 'Exit Presentation'
            : 'Presentation';

        window.dispatchEvent(
          new Event('resize')
        );
      }
    );


  /* =======================================================
     GLOBAL TIMER
     ======================================================= */

  let timerSeconds = 30;
  let remaining = 30;
  let timerInterval = null;

  function formatTime(seconds) {
    const mins =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return (
      String(mins).padStart(2, '0') +
      ':' +
      String(secs).padStart(2, '0')
    );
  }

  function updateTimerDisplay() {
    const display =
      $('#u11GlobalTimerDisplay');

    if (display) {
      display.textContent =
        formatTime(remaining);
    }
  }

  function stopGlobalTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function startGlobalTimer() {
    stopGlobalTimer();

    if (remaining <= 0) {
      remaining = timerSeconds;
    }

    timerInterval =
      setInterval(() => {
        remaining -= 1;

        updateTimerDisplay();

        if (remaining <= 0) {
          stopGlobalTimer();

          const display =
            $('#u11GlobalTimerDisplay');

          if (display) {
            display.textContent =
              'TIME!';
          }
        }
      }, 1000);
  }

  function openTimer() {
    openModal(`
      <div class="u11-modal-kicker">
        TEACHER TIMER
      </div>

      <h2 class="u11-modal-title">
        Classroom Timer
      </h2>

      <div
        class="u11-global-timer"
        id="u11GlobalTimerDisplay"
      >
        ${formatTime(remaining)}
      </div>

      <div class="u11-timer-presets">
        <button data-time="30">30 sec</button>
        <button data-time="60">1 min</button>
        <button data-time="90">90 sec</button>
        <button data-time="120">2 min</button>
      </div>

      <div class="u11-timer-controls">
        <button id="u11TimerStart">
          Start
        </button>

        <button id="u11TimerPause">
          Pause
        </button>

        <button id="u11TimerReset">
          Reset
        </button>
      </div>
    `);

    $$('.u11-timer-presets button')
      .forEach(button => {
        button.addEventListener(
          'click',
          () => {
            timerSeconds =
              Number(
                button.dataset.time
              );

            remaining =
              timerSeconds;

            stopGlobalTimer();
            updateTimerDisplay();
          }
        );
      });

    $('#u11TimerStart')
      ?.addEventListener(
        'click',
        startGlobalTimer
      );

    $('#u11TimerPause')
      ?.addEventListener(
        'click',
        stopGlobalTimer
      );

    $('#u11TimerReset')
      ?.addEventListener(
        'click',
        () => {
          stopGlobalTimer();
          remaining = timerSeconds;
          updateTimerDisplay();
        }
      );
  }

  $('#u11TimerBtn')
    ?.addEventListener(
      'click',
      openTimer
    );


  /* =======================================================
     RESPONSES / CURRENT SCREEN SUMMARY
     ======================================================= */

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function currentScreen() {
    return $('.screen.active');
  }

  function responseRows(screen) {
    const rows = [];

    if (!screen) {
      return rows;
    }

    const selectedPoll =
      $('.poll-btn.selected', screen);

    if (selectedPoll) {
      rows.push({
        label: 'Quick choice',
        value:
          selectedPoll.textContent.trim()
      });
    }

    const selectedConfidence =
      $$('.confidence button.selected', screen);

    selectedConfidence.forEach(
      button => {
        rows.push({
          label: 'Confidence',
          value:
            button.textContent.trim()
        });
      }
    );

    const revealed =
      $$('.blank-reveal.revealed, .inline-blank.revealed', screen);

    if (revealed.length) {
      rows.push({
        label: 'Answers revealed',
        value:
          String(revealed.length)
      });
    }

    const checked =
      $$(
        '.candidate-grid input[type="checkbox"]:checked',
        screen
      );

    if (checked.length) {
      rows.push({
        label: 'Selected items',
        value:
          checked
            .map(input =>
              input
                .closest('label')
                ?.textContent
                .trim()
            )
            .filter(Boolean)
            .join(', ')
      });
    }

    const matched =
      $$('.match-item.matched', screen);

    if (matched.length) {
      rows.push({
        label: 'Correct matches',
        value:
          `${matched.length} / 9`
      });
    }

    const textareas =
      $$('textarea', screen)
        .map((textarea, index) => ({
          index:
            index + 1,
          value:
            textarea.value.trim()
        }))
        .filter(item =>
          item.value
        );

    textareas.forEach(item => {
      rows.push({
        label:
          `Written response ${item.index}`,
        value:
          item.value
      });
    });

    return rows;
  }

  function openResponses() {
    const screen =
      currentScreen();

    const screenNumber =
      screen?.dataset.screen || '—';

    const rows =
      responseRows(screen);

    const content =
      rows.length
        ? rows
            .map(row => `
              <div class="u11-response-card">
                <strong>
                  ${escapeHtml(row.label)}
                </strong>

                <div>
                  ${escapeHtml(row.value)}
                </div>
              </div>
            `)
            .join('')
        : `
          <div class="u11-empty-response">
            No response has been recorded
            on this screen yet.
          </div>
        `;

    openModal(`
      <div class="u11-modal-kicker">
        TEACHER RESPONSES
      </div>

      <h2 class="u11-modal-title">
        Screen ${escapeHtml(screenNumber)}
      </h2>

      <div class="u11-response-list">
        ${content}
      </div>
    `);
  }

  $('#u11ResponsesBtn')
    ?.addEventListener(
      'click',
      openResponses
    );


  /* =======================================================
     SCREEN 9 — STEP 1 / STEP 2
     ======================================================= */

  const screen9 =
    $('.screen[data-screen="9"]');

  if (screen9) {
    const steps =
      $$('.ex7-step', screen9);

    const instruction =
      $('.instruction', screen9);

    if (steps.length >= 2) {
      const tabs =
        document.createElement('div');

      tabs.className =
        'ex7-step-tabs';

      tabs.innerHTML = `
        <button
          type="button"
          class="ex7-step-tab active"
          data-step-index="0"
        >
          Step 1
        </button>

        <button
          type="button"
          class="ex7-step-tab"
          data-step-index="1"
        >
          Step 2
        </button>
      `;

      steps[0].parentNode.insertBefore(
        tabs,
        steps[0]
      );

      const instructions = [
        'Listen again to Speakers 2–5 and identify the phrasal verbs you hear. Check the items one by one.',
        'Match the nine target phrasal verbs to definitions a–i.'
      ];

      function activateStep(index) {
        steps.forEach(
          (step, stepIndex) => {
            step.classList.toggle(
              'ex7-active',
              stepIndex === index
            );
          }
        );

        $$('.ex7-step-tab', tabs)
          .forEach(
            (button, buttonIndex) => {
              button.classList.toggle(
                'active',
                buttonIndex === index
              );
            }
          );

        if (instruction) {
          instruction.textContent =
            instructions[index];
        }

        screen9.scrollTop = 0;
      }

      $$('.ex7-step-tab', tabs)
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              activateStep(
                Number(
                  button.dataset.stepIndex
                )
              );
            }
          );
        });

      activateStep(0);
    }
  }


  /* =======================================================
     PUBLIC HOOK
     ======================================================= */

  window.ELEAP_U11_UI = {
    openTimer,
    openResponses,
    closeModal
  };

})();
