/**
 * PM Polly – Application JavaScript
 * Handles: case study data, form interactions, submission to Google Apps Script,
 *          results display, and all UI state.
 */

/* ── Configuration ─────────────────────────────────────────────────────────
 * Replace APPS_SCRIPT_URL with your deployed Google Apps Script Web App URL.
 * See apps-script/Code.gs for the script to deploy.
 * ─────────────────────────────────────────────────────────────────────────*/
const CONFIG = {
  APPS_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  TOTAL_STUDENTS: 40,
};

/* ── Case Studies Data ────────────────────────────────────────────────────*/
const CASE_STUDIES = [
  {
    id: 1,
    title: 'Digital Transformation in Retail',
    team: 'Group Alpha',
    description:
      'An in-depth analysis of how a legacy retail chain successfully implemented digital transformation strategies to boost revenue and customer engagement.',
  },
  {
    id: 2,
    title: 'Agile Adoption in Healthcare',
    team: 'Group Beta',
    description:
      'Exploring the journey of a mid-size hospital adopting Agile project management methods to reduce patient wait times and improve operational efficiency.',
  },
  {
    id: 3,
    title: 'Supply Chain Resilience Post-Pandemic',
    team: 'Group Gamma',
    description:
      'A case study on how a global manufacturing firm restructured its supply chain to withstand future disruptions following the COVID-19 pandemic.',
  },
  {
    id: 4,
    title: 'Stakeholder Management in Mega Projects',
    team: 'Group Delta',
    description:
      'Examining stakeholder identification, engagement, and conflict resolution strategies employed during a large-scale infrastructure development project.',
  },
  {
    id: 5,
    title: 'Risk Management in FinTech Start-ups',
    team: 'Group Epsilon',
    description:
      'How early-stage FinTech companies can build robust risk frameworks to satisfy regulators, investors, and customers while maintaining agility.',
  },
  {
    id: 6,
    title: 'Sustainability-Driven Project Portfolio',
    team: 'Group Zeta',
    description:
      'Evaluating how an energy company aligned its project portfolio with ESG goals, and the PM methodologies that drove measurable sustainability outcomes.',
  },
];

const CRITERIA = [
  {
    key: 'presentation',
    label: 'Overall Presentation',
    icon: '🎤',
    description: 'Quality of slides, delivery clarity, confidence, and structure of the presentation.',
  },
  {
    key: 'content',
    label: 'Content',
    icon: '📋',
    description: 'Depth of research, accuracy, relevance, and quality of insights presented.',
  },
  {
    key: 'participation',
    label: 'Group Participation',
    icon: '🤝',
    description: 'Equal contribution, teamwork, responsiveness to questions, and collaboration.',
  },
];

/* ── Page Detection ───────────────────────────────────────────────────────*/
const PAGE = (() => {
  const path = window.location.pathname;
  if (path.includes('feedback')) return 'feedback';
  if (path.includes('results')) return 'results';
  return 'index';
})();

/* ── Utility helpers ──────────────────────────────────────────────────────*/
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function showToast(msg, duration = 3000) {
  const t = qs('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function badgeClass(val) {
  if (val <= 3) return 'badge-low';
  if (val <= 6) return 'badge-mid';
  if (val <= 8) return 'badge-good';
  return 'badge-high';
}

function countUniqueStudents(submissions) {
  return new Set(submissions.map(s => s.studentName?.toLowerCase().trim())).size;
}

function scoreAverage(a, b, c) {
  return (a + b + c) / 3;
}

/* ── Local storage helpers (for offline / no-backend fallback) ────────────*/
const STORAGE_KEY = 'pm_polly_submissions';

function saveLocal(data) {
  const existing = getLocal();
  existing.push(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function getLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/* ── Submit to Google Apps Script ─────────────────────────────────────────*/
async function submitToSheets(data) {
  if (CONFIG.APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
    // No backend configured – store locally and warn
    saveLocal(data);
    return { ok: true, local: true };
  }
  const resp = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // avoids CORS preflight for GAS
    body: JSON.stringify(data),
    mode: 'no-cors', // GAS returns opaque response
  });
  // With mode: no-cors we can't read response body; assume success if no throw
  saveLocal(data); // also keep local copy
  return { ok: true };
}

/* ═══════════════════════════════════════════════════════════════════════════
   INDEX PAGE
═══════════════════════════════════════════════════════════════════════════ */
function initIndexPage() {
  const grid = qs('#caseStudyGrid');
  if (!grid) return;

  const submissions = getLocal();

  // Stats
  qs('#statResponses').textContent = submissions.length;
  qs('#statStudents').textContent = countUniqueStudents(submissions);

  // Build case study cards
  CASE_STUDIES.forEach(cs => {
    const countForCase = submissions.filter(s => s.caseStudyId === cs.id).length;
    const card = document.createElement('div');
    card.className = 'case-card';
    card.innerHTML = `
      <div class="case-card-header">
        <div class="case-number">${cs.id}</div>
        <div class="case-info">
          <h3>${cs.title}</h3>
          <div class="case-team">👥 ${cs.team}</div>
        </div>
      </div>
      <p class="case-desc">${cs.description}</p>
      <a href="feedback.html?case=${cs.id}" class="btn btn-primary btn-sm">
        ✍️ Give Feedback
      </a>
    `;
    grid.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEEDBACK PAGE
═══════════════════════════════════════════════════════════════════════════ */
function initFeedbackPage() {
  const form = qs('#feedbackForm');
  const successPanel = qs('#successPanel');
  if (!form) return;

  // Pre-select case study from URL param
  const params = new URLSearchParams(window.location.search);
  const preCase = params.get('case');

  // Populate case study select
  const caseSelect = qs('#caseStudySelect');
  CASE_STUDIES.forEach(cs => {
    const opt = document.createElement('option');
    opt.value = cs.id;
    opt.textContent = `Case ${cs.id}: ${cs.title} (${cs.team})`;
    caseSelect.appendChild(opt);
  });
  if (preCase) caseSelect.value = preCase;

  // Build rating sections
  const ratingsContainer = qs('#ratingsContainer');
  CRITERIA.forEach(criterion => {
    const section = document.createElement('div');
    section.className = 'rating-section';
    section.innerHTML = `
      <h4>${criterion.icon} ${criterion.label}</h4>
      <p class="rating-desc">${criterion.description}</p>
      <div class="rating-widget">
        <div class="rating-stars" id="stars-${criterion.key}">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `
            <input type="radio" name="${criterion.key}" id="${criterion.key}-${n}" value="${n}" data-val="${n}" required>
            <label for="${criterion.key}-${n}" data-val="${n}" title="${n}/10">${n}</label>
          `).join('')}
        </div>
        <div class="rating-value-display" id="disp-${criterion.key}">
          Select a score from 1 (lowest) to 10 (highest)
        </div>
      </div>
    `;
    ratingsContainer.appendChild(section);

    // Update display when rating changes
    section.querySelectorAll(`input[name="${criterion.key}"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        const disp = qs(`#disp-${criterion.key}`);
        const labels = {
          1: 'Poor', 2: 'Poor', 3: 'Below Average',
          4: 'Below Average', 5: 'Average', 6: 'Average',
          7: 'Good', 8: 'Good', 9: 'Excellent', 10: 'Outstanding',
        };
        disp.innerHTML = `Score: <span>${radio.value}/10</span> – ${labels[radio.value]}`;
      });
    });
  });

  // Progress tracking
  updateProgress();
  form.addEventListener('change', updateProgress);

  function updateProgress() {
    const filled = CRITERIA.filter(c => form.querySelector(`input[name="${c.key}"]:checked`)).length;
    const hasName = qs('#studentName').value.trim().length > 0;
    const hasCase = qs('#caseStudySelect').value !== '';
    const total = CRITERIA.length + 2; // criteria + name + case
    const done = filled + (hasName ? 1 : 0) + (hasCase ? 1 : 0);
    const pct = Math.round((done / total) * 100);
    qs('#progressFill').style.width = pct + '%';
    qs('#progressLabel').textContent = `${pct}% complete`;
  }
  qs('#studentName').addEventListener('input', updateProgress);
  caseSelect.addEventListener('change', updateProgress);

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = qs('#submitBtn');
    const submitSpinner = qs('#submitSpinner');
    const alertBox = qs('#formAlert');

    // Validate ratings
    const ratings = {};
    let valid = true;
    CRITERIA.forEach(c => {
      const checked = form.querySelector(`input[name="${c.key}"]:checked`);
      if (!checked) { valid = false; } else { ratings[c.key] = parseInt(checked.value, 10); }
    });
    if (!valid) {
      alertBox.textContent = '⚠️ Please provide a rating for all three criteria before submitting.';
      alertBox.className = 'alert alert-warning';
      alertBox.classList.remove('hidden');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const selectedCase = CASE_STUDIES.find(cs => cs.id === parseInt(caseSelect.value, 10));

    const data = {
      timestamp: new Date().toISOString(),
      studentName: qs('#studentName').value.trim(),
      caseStudyId: selectedCase.id,
      caseStudyTitle: selectedCase.title,
      team: selectedCase.team,
      presentation: ratings.presentation,
      content: ratings.content,
      participation: ratings.participation,
      average: scoreAverage(ratings.presentation, ratings.content, ratings.participation).toFixed(2),
      comments: qs('#comments').value.trim(),
    };

    // Disable button, show spinner
    submitBtn.disabled = true;
    submitSpinner.classList.remove('hidden');
    alertBox.classList.add('hidden');

    try {
      const result = await submitToSheets(data);
      // Show success panel
      qs('#feedbackFormWrap').classList.add('hidden');
      successPanel.classList.remove('hidden');
      qs('#successCase').textContent = selectedCase.title;

      if (result.local) {
        qs('#successNote').textContent =
          'Your feedback was saved locally (no backend configured). See README for backend setup.';
      }
    } catch (err) {
      alertBox.textContent = '❌ Submission failed. Please check your connection and try again.';
      alertBox.className = 'alert alert-error';
      alertBox.classList.remove('hidden');
      submitBtn.disabled = false;
      submitSpinner.classList.add('hidden');
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULTS PAGE
═══════════════════════════════════════════════════════════════════════════ */
function initResultsPage() {
  const submissions = getLocal();
  renderSummaryCards(submissions);
  renderTable(submissions);
  renderOverallStats(submissions);

  // Export CSV
  qs('#exportBtn')?.addEventListener('click', () => exportCSV(submissions));

  // Filter by case study
  const caseFilter = qs('#caseFilter');
  if (caseFilter) {
    CASE_STUDIES.forEach(cs => {
      const opt = document.createElement('option');
      opt.value = cs.id;
      opt.textContent = `Case ${cs.id}: ${cs.title}`;
      caseFilter.appendChild(opt);
    });
    caseFilter.addEventListener('change', () => {
      const val = caseFilter.value;
      const filtered = val ? submissions.filter(s => s.caseStudyId === parseInt(val, 10)) : submissions;
      renderTable(filtered);
    });
  }
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((sum, s) => sum + (s[key] || 0), 0) / arr.length;
}

function renderSummaryCards(submissions) {
  const grid = qs('#summaryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  CASE_STUDIES.forEach(cs => {
    const subs = submissions.filter(s => s.caseStudyId === cs.id);
    const avgP = avg(subs, 'presentation');
    const avgC = avg(subs, 'content');
    const avgPa = avg(subs, 'participation');
    const overall = subs.length ? ((avgP + avgC + avgPa) / 3) : 0;

    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <h3><span class="case-number" style="background:var(--primary);color:#fff;font-size:.75rem;padding:.2rem .6rem;border-radius:6px;">CS${cs.id}</span> ${cs.title}</h3>
      ${renderMetricRow('🎤 Presentation', avgP)}
      ${renderMetricRow('📋 Content', avgC)}
      ${renderMetricRow('🤝 Participation', avgPa)}
      <div class="metric-row" style="margin-top:.75rem;border-top:1px solid var(--border);padding-top:.75rem;">
        <span class="metric-label" style="font-weight:700;">Overall Average</span>
        <span class="metric-value" style="font-size:1.1rem;">${subs.length ? overall.toFixed(1) : '–'}</span>
      </div>
      <div class="result-count">📊 ${subs.length} response${subs.length !== 1 ? 's' : ''} / ${CONFIG.TOTAL_STUDENTS} students</div>
    `;
    grid.appendChild(card);
  });
}

function renderMetricRow(label, value) {
  const pct = (value / 10) * 100;
  const display = value ? value.toFixed(1) : '–';
  return `
    <div class="metric-row">
      <span class="metric-label">${label}</span>
      <div class="metric-bar-wrap">
        <div class="metric-bar" style="width:${pct}%;background:${barColor(value)};"></div>
      </div>
      <span class="metric-value">${display}</span>
    </div>
  `;
}

function barColor(v) {
  if (v <= 3) return 'var(--danger)';
  if (v <= 6) return 'var(--accent)';
  if (v <= 8) return '#3b82f6';
  return 'var(--success)';
}

function renderOverallStats(submissions) {
  const el = qs('#overallStats');
  if (!el || !submissions.length) return;
  const totalResp = submissions.length;
  const avgAll = (
    (avg(submissions, 'presentation') + avg(submissions, 'content') + avg(submissions, 'participation')) / 3
  ).toFixed(1);
  el.innerHTML = `
    <div class="stat-card"><div class="stat-value">${totalResp}</div><div class="stat-label">Total Responses</div></div>
    <div class="stat-card"><div class="stat-value">${countUniqueStudents(submissions)}</div><div class="stat-label">Unique Students</div></div>
    <div class="stat-card"><div class="stat-value">${avgAll}</div><div class="stat-label">Overall Avg Score</div></div>
  `;
}

function renderTable(submissions) {
  const tbody = qs('#submissionsBody');
  if (!tbody) return;
  if (!submissions.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem;">No submissions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = submissions
    .slice()
    .reverse()
    .map(s => {
      const ov = scoreAverage(s.presentation, s.content, s.participation).toFixed(1);
      return `
        <tr>
          <td>${new Date(s.timestamp).toLocaleString()}</td>
          <td>${escHtml(s.studentName || '–')}</td>
          <td>CS${s.caseStudyId}</td>
          <td><span class="badge ${badgeClass(s.presentation)}">${s.presentation}</span></td>
          <td><span class="badge ${badgeClass(s.content)}">${s.content}</span></td>
          <td><span class="badge ${badgeClass(s.participation)}">${s.participation}</span></td>
          <td><strong>${ov}</strong></td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(s.comments || '')}</td>
        </tr>
      `;
    })
    .join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportCSV(submissions) {
  if (!submissions.length) { showToast('No data to export.'); return; }
  const headers = ['Timestamp','Student Name','Case Study ID','Case Study Title','Team','Presentation','Content','Participation','Average','Comments'];
  const rows = submissions.map(s => [
    s.timestamp, s.studentName, s.caseStudyId, s.caseStudyTitle, s.team,
    s.presentation, s.content, s.participation, s.average, s.comments,
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pm-polly-results-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 CSV exported!');
}

/* ── Bootstrap ────────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  if (PAGE === 'index')    initIndexPage();
  if (PAGE === 'feedback') initFeedbackPage();
  if (PAGE === 'results')  initResultsPage();

  // Highlight active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  qsa('.navbar-links a').forEach(a => {
    const linkPage = a.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) a.classList.add('active');
  });
});
