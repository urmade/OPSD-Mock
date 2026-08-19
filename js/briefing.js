/** AI-assisted situation briefing — between OCC Gantt and Proposal desk */

let briefData = null;

export function setBriefingData(brief) {
  briefData = brief;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBriefingContent(data) {
  const section = document.getElementById('briefing-section');
  const statusEl = document.getElementById('briefing-status');
  const headlineEl = document.getElementById('briefing-headline');
  const bulletsEl = document.getElementById('briefing-bullets');
  const actionsEl = document.getElementById('briefing-actions');
  const updatedEl = document.getElementById('briefing-updated');
  const badgeEl = document.getElementById('briefing-badge');

  if (!section || !data) return;

  section.classList.remove('hidden');

  if (statusEl) {
    statusEl.textContent = data.status || 'BRIEFING';
    statusEl.className = `briefing-status ${data.statusClass || ''}`;
  }

  if (headlineEl) headlineEl.textContent = data.headline || '';

  if (bulletsEl) {
    const bullets = data.bullets || [];
    bulletsEl.innerHTML = bullets
      .map((b) => `<li>${escapeHtml(b)}</li>`)
      .join('');
  }

  if (actionsEl) {
    actionsEl.textContent = data.actions || '';
  }

  if (updatedEl && data.updated) {
    updatedEl.textContent = `Updated ${data.updated}`;
  }

  if (badgeEl && briefData?.badge) {
    badgeEl.textContent = briefData.badge;
  }
}

export function renderBriefingIdle() {
  renderBriefingContent(briefData?.briefing?.idle);
}

export function renderBriefingStorm() {
  renderBriefingContent(briefData?.briefing?.storm);
}

export function renderBriefingRevised() {
  renderBriefingContent(briefData?.briefing?.revised);
}

export function renderBriefingBlocked() {
  renderBriefingContent(briefData?.briefing?.blocked);
}

/** API push — partial or full briefing update */
export function handleBriefingPush(payload = {}) {
  let base = {};
  if (payload.phase && briefData?.briefing?.[payload.phase]) {
    base = { ...briefData.briefing[payload.phase] };
  }
  renderBriefingContent({ ...base, ...payload });
}

export function initBriefing() {
  renderBriefingIdle();
}
