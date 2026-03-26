/* =========================================================
   PM Polly – app.js
   Handles rating interactions, form validation, and
   live progress tracking.
   ========================================================= */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Rating descriptions ──────────────────────────────── */
  const ratingLabels = {
    1: 'Needs significant improvement',
    2: 'Poor',
    3: 'Below average',
    4: 'Fair',
    5: 'Average',
    6: 'Above average',
    7: 'Good',
    8: 'Very good',
    9: 'Excellent',
    10: 'Outstanding! 🏆',
  };

  /* ── Attach rating display updates ───────────────────── */
  function initRatings() {
    $$('.rating-group').forEach((group) => {
      const display = $('.rating-display', group);
      const radios  = $$('input[type="radio"]', group);

      radios.forEach((radio) => {
        radio.addEventListener('change', () => {
          if (display) {
            display.textContent = ratingLabels[radio.value] || '';
          }
          updateProgress();
          clearError(group);
        });
      });
    });
  }

  /* ── Case study selection ─────────────────────────────── */
  function initCaseStudy() {
    $$('.case-btn input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        updateProgress();
        const wrap = radio.closest('.card');
        if (wrap) clearError(wrap);
      });
    });
  }

  /* ── Progress bar ─────────────────────────────────────── */
  const TOTAL_FIELDS = 4; // case study + 3 ratings

  function updateProgress() {
    const caseSelected    = !!$('input[name="case_study"]:checked');
    const presentSelected = !!$('input[name="overall_presentation"]:checked');
    const contentSelected = !!$('input[name="content_quality"]:checked');
    const groupSelected   = !!$('input[name="group_participation"]:checked');

    const filled = [caseSelected, presentSelected, contentSelected, groupSelected]
      .filter(Boolean).length;

    const bar = $('.progress-bar');
    if (bar) {
      bar.style.width = ((filled / TOTAL_FIELDS) * 100) + '%';
    }
  }

  /* ── Validation ───────────────────────────────────────── */
  function showError(el, msg) {
    el.classList.add('field-error');
    const err = $('.error-msg', el);
    if (err) err.textContent = msg;
  }

  function clearError(el) {
    el.classList.remove('field-error');
  }

  function validate() {
    let valid = true;

    // Case study
    const caseCard = $('#case-study-card');
    if (caseCard && !$('input[name="case_study"]:checked')) {
      showError(caseCard, 'Please select a case study.');
      valid = false;
    } else if (caseCard) {
      clearError(caseCard);
    }

    // Ratings
    [
      { name: 'overall_presentation', label: 'Overall Presentation' },
      { name: 'content_quality',      label: 'Content Quality' },
      { name: 'group_participation',  label: 'Group Participation' },
    ].forEach(({ name, label }) => {
      const group = $(`[data-rating="${name}"]`);
      if (group && !$(`input[name="${name}"]:checked`)) {
        showError(group, `Please rate ${label}.`);
        valid = false;
      } else if (group) {
        clearError(group);
      }
    });

    return valid;
  }

  /* ── Form submission ──────────────────────────────────── */
  function initForm() {
    const form = $('#feedback-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      if (!validate()) {
        e.preventDefault();
        // Scroll to first error
        const firstError = $('.field-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Let native form action (Formspree) handle the request
      const btn = $('#submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting…';
      }
    });
  }

  /* ── Keyboard accessibility for case buttons ─────────── */
  function initKeyboard() {
    $$('.case-btn label').forEach((lbl) => {
      lbl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          lbl.click();
        }
      });
      lbl.setAttribute('tabindex', '0');
    });
  }

  /* ── Formspree setup check ────────────────────────────── */
  function warnIfUnconfigured() {
    const form = $('#feedback-form');
    if (!form) return;
    if (form.action && form.action.includes('YOUR_FORM_ID')) {
      const banner = document.createElement('div');
      banner.setAttribute('role', 'alert');
      banner.style.cssText = [
        'background:#fef9c3', 'color:#854d0e', 'border:1.5px solid #fde047',
        'border-radius:8px', 'padding:.75rem 1rem', 'margin-bottom:1rem',
        'font-size:.9rem', 'font-weight:600',
      ].join(';');
      banner.textContent =
        '⚠️ Setup needed: replace YOUR_FORM_ID in index.html with your ' +
        'Formspree form ID before going live. See the comment in index.html for instructions.';
      form.insertAdjacentElement('beforebegin', banner);
    }
  }

  /* ── Boot ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    warnIfUnconfigured();
    initRatings();
    initCaseStudy();
    initForm();
    initKeyboard();
    updateProgress();
  });
})();
