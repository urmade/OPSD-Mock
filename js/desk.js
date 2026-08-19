/** Proposal desk: stamps, KPIs, cancel table, Grok panel, API push */

let flightsData = null;
let briefData = null;

export function setDeskData(flights, brief) {
  flightsData = flights;
  briefData = brief;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderIdle() {
  const stamp = document.getElementById('desk-stamp');
  const empty = document.getElementById('desk-empty');
  const content = document.getElementById('desk-content');

  stamp.textContent = 'WAITING ON EVENT';
  stamp.className = 'stamp';
  empty.classList.remove('hidden');
  content.classList.add('hidden');
}

export function renderStorm() {
  if (!flightsData) return;
  const { storm } = flightsData;

  const stamp = document.getElementById('desk-stamp');
  const empty = document.getElementById('desk-empty');
  const content = document.getElementById('desk-content');

  stamp.textContent = 'STORM PROPOSAL';
  stamp.className = 'stamp active';
  empty.classList.add('hidden');
  content.classList.remove('hidden');

  renderKpis(storm.kpis, storm.crewBroken);
  renderCancelTable(storm.cancels, []);
  hideDelayRow();

  if (briefData) {
    fillGrok(briefData.recap);
  }
}

export function renderRevised() {
  if (!flightsData) return;
  const { revised } = flightsData;

  const stamp = document.getElementById('desk-stamp');
  stamp.textContent = 'REVISED · HUMAN EDIT';
  stamp.className = 'stamp revised';

  renderKpis(revised.kpis, revised.crewBroken);
  renderCancelTable(revised.cancels, revised.recovered || []);
  showDelayRow(revised.lh400Delay);
}

export function renderBlocked() {
  const stamp = document.getElementById('desk-stamp');
  stamp.textContent = 'BLOCKED · KNOX';
  stamp.className = 'stamp blocked';
}

/** Handle event pushed via POST /api/desk or POST /api/events */
export function handleDeskPush(payload = {}) {
  const empty = document.getElementById('desk-empty');
  const content = document.getElementById('desk-content');

  if (payload.showContent !== false) {
    empty?.classList.add('hidden');
    content?.classList.remove('hidden');
  }

  if (payload.stamp) {
    const stampEl = document.getElementById('desk-stamp');
    stampEl.textContent = payload.stamp;
    stampEl.className = 'stamp';
    if (payload.stampClass) stampEl.classList.add(payload.stampClass);
  }

  if (payload.kpis) {
    renderKpis(payload.kpis, payload.crewBroken ?? payload.kpis.crewBroken ?? 0);
  }

  if (payload.crew) {
    document.getElementById('desk-crew').innerHTML = payload.crew;
  }

  if (payload.cancels) {
    renderCancelTable(payload.cancels, payload.recovered || []);
  }

  if (payload.delay) {
    showDelayRow(payload.delay);
  }

  if (payload.grok) {
    fillGrok(payload.grok);
  }

  if (payload.note) {
    appendDeskEvent(payload.note, payload.title || 'API EVENT');
  }

  if (payload.html) {
    appendDeskHtml(payload.html, payload.title || 'API EVENT');
  }
}

export function appendDeskEvent(text, title = 'API EVENT') {
  const feed = document.getElementById('desk-api-feed');
  if (!feed) return;
  feed.classList.remove('hidden');
  const item = document.createElement('div');
  item.className = 'desk-api-item';
  item.innerHTML = `<div class="desk-api-title">${escapeHtml(title)}</div><div class="desk-api-text">${escapeHtml(text)}</div>`;
  feed.appendChild(item);
  feed.scrollTop = feed.scrollHeight;
}

export function appendDeskHtml(html, title = 'API EVENT') {
  const feed = document.getElementById('desk-api-feed');
  if (!feed) return;
  feed.classList.remove('hidden');
  const item = document.createElement('div');
  item.className = 'desk-api-item';
  item.innerHTML = `<div class="desk-api-title">${escapeHtml(title)}</div><div class="desk-api-html">${html}</div>`;
  feed.appendChild(item);
  feed.scrollTop = feed.scrollHeight;
}

function renderKpis(kpis, crewBroken) {
  const el = document.getElementById('desk-kpis');
  el.innerHTML = `
    <div class="kpi">IMPACTED FRA WINDOW <span>${kpis.impacted}</span></div>
    <div class="kpi">CANCEL SET <span>${kpis.cancelSet}</span></div>
    <div class="kpi">PAX <span>${kpis.pax}</span></div>
  `;

  const crew = document.getElementById('desk-crew');
  if (flightsData?.storm?.crewBreak && crewBroken) {
    const breakInfo = flightsData.storm.crewBreak;
    crew.innerHTML = `Crew: <strong>${crewBroken}</strong> pairings break FDP · named break <strong>${breakInfo.pairing}</strong> on <strong>${breakInfo.flight}</strong> already at <strong>${breakInfo.duty}</strong> duty`;
  } else if (crewBroken && !crew.innerHTML) {
    crew.innerHTML = `Crew: <strong>${crewBroken}</strong> pairings break FDP`;
  }
}

function renderCancelTable(cancels, recovered) {
  const tbody = document.getElementById('cancel-tbody');
  tbody.innerHTML = cancels
    .map((c) => {
      const isRecovered = recovered.includes(c.flight);
      return `<tr class="${isRecovered ? 'recovered' : ''}">
        <td>${escapeHtml(c.flight)}</td>
        <td>${escapeHtml(c.route)}</td>
        <td>${escapeHtml(c.pnr)}</td>
        <td>${c.pax}</td>
        <td>${isRecovered ? 'RECOVERED' : 'CANCEL'}</td>
      </tr>`;
    })
    .join('');
}

function showDelayRow(delay) {
  const row = document.getElementById('delay-row');
  row.classList.remove('hidden');
  row.innerHTML = `<strong>${escapeHtml(delay.flight)}</strong> — ${escapeHtml(delay.action)} · dep ${escapeHtml(delay.newDep)} · tail ${escapeHtml(delay.tail)}<br><span style="color:var(--text-muted)">${escapeHtml(delay.note || '')}</span>`;
}

function hideDelayRow() {
  document.getElementById('delay-row').classList.add('hidden');
}

export function fillGrok(text) {
  const el = document.getElementById('grok-text');
  if (el) el.textContent = text;
}

export async function loadGrokRecap() {
  /*
   * Real xAI call (DO NOT USE IN DEMO):
   *
   * const response = await fetch('https://api.x.ai/v1/responses', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'Authorization': 'Bearer <API_KEY>',
   *   },
   *   body: JSON.stringify({
   *     model: 'grok-4.6',
   *     input: 'Summarize FRA thunderstorm OCC proposal...',
   *   }),
   * });
   * const data = await response.json();
   */

  if (briefData) {
    fillGrok(briefData.recap);
    const badge = document.getElementById('grok-badge');
    if (badge && briefData.badge) badge.textContent = briefData.badge;
  }
}
