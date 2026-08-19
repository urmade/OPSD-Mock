/** Agent pill states: IDLE | WORKING | DONE | BLOCKED */

export const PILLS = [
  { id: 'tower', name: 'TOWER (CoS / EVENT)' },
  { id: 'gantt', name: 'GANTT (ROTATIONS)' },
  { id: 'pax', name: 'PAX (REPROTECT)' },
  { id: 'crew', name: 'CREW (FDP / PAIRING)' },
  { id: 'knox', name: 'KNOX (RESIDENCY GATE)' },
  { id: 'apron', name: 'APRON (COMMS)' },
];

const states = Object.fromEntries(PILLS.map((p) => [p.id, 'idle']));

export function getPillStates() {
  return { ...states };
}

export function setPillState(id, state) {
  if (states[id] !== undefined) {
    states[id] = state;
    renderPills();
  }
}

export function setAllPills(state) {
  for (const p of PILLS) {
    states[p.id] = state;
  }
  renderPills();
}

export function initPills(containerId = 'pills-row') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = PILLS.map(
    (p) =>
      `<div class="pill" data-pill="${p.id}">
        <span class="pill-name">${p.name}</span>
        <span class="pill-state idle" data-state="${p.id}">IDLE</span>
      </div>`
  ).join('');
}

function renderPills() {
  for (const p of PILLS) {
    const el = document.querySelector(`[data-state="${p.id}"]`);
    if (!el) continue;
    const s = states[p.id];
    el.textContent = s.toUpperCase();
    el.className = `pill-state ${s}`;
  }
}

/**
 * Stagger pills WORKING → DONE on storm (Tower first … Apron last)
 */
export async function animateStormPills() {
  const order = PILLS.map((p) => p.id);
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const id of order) {
    setPillState(id, 'working');
    await delay(280);
    setPillState(id, 'done');
    await delay(120);
  }
}

export function blockKnoxPill() {
  setPillState('knox', 'blocked');
}
