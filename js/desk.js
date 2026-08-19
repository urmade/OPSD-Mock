/** Proposal desk: stamps, KPIs, cancel table, Grok panel */

let flightsData = null;
let briefData = null;
let phase = 'idle';

export function setDeskData(flights, brief) {
  flightsData = flights;
  briefData = brief;
}

export function setPhase(p) {
  phase = p;
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

function renderKpis(kpis, crewBroken) {
  const el = document.getElementById('desk-kpis');
  el.innerHTML = `
    <div class="kpi">IMPACTED FRA WINDOW <span>${kpis.impacted}</span></div>
    <div class="kpi">CANCEL SET <span>${kpis.cancelSet}</span></div>
    <div class="kpi">PAX <span>${kpis.pax}</span></div>
  `;

  const crew = document.getElementById('desk-crew');
  const breakInfo = flightsData.storm.crewBreak;
  crew.innerHTML = `Crew: <strong>${crewBroken}</strong> pairings break FDP · named break <strong>${breakInfo.pairing}</strong> on <strong>${breakInfo.flight}</strong> already at <strong>${breakInfo.duty}</strong> duty`;
}

function renderCancelTable(cancels, recovered) {
  const tbody = document.getElementById('cancel-tbody');
  tbody.innerHTML = cancels
    .map((c) => {
      const isRecovered = recovered.includes(c.flight);
      return `<tr class="${isRecovered ? 'recovered' : ''}">
        <td>${c.flight}</td>
        <td>${c.route}</td>
        <td>${c.pnr}</td>
        <td>${c.pax}</td>
        <td>${isRecovered ? 'RECOVERED' : 'CANCEL'}</td>
      </tr>`;
    })
    .join('');
}

function showDelayRow(delay) {
  const row = document.getElementById('delay-row');
  row.classList.remove('hidden');
  row.innerHTML = `<strong>${delay.flight}</strong> — ${delay.action} · dep ${delay.newDep} · tail ${delay.tail}<br><span style="color:var(--text-muted)">${delay.note}</span>`;
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
