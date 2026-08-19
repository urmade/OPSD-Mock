/** OPSD War Room — fixture state machine */

import { initPills, animateStormPills, setAllPills } from './pills.js';
import { setFlightsData, initGantt, showStormBand } from './gantt.js';
import { setDeskData, renderIdle, renderStorm, renderRevised, loadGrokRecap } from './desk.js';
import { setSlackData, initSlack, appendStormMessages, appendRevisedMessages } from './slack.js';
import { initKnox, showKnoxModal } from './knox.js';
import { initApiStream } from './api.js';
import {
  setBriefingData,
  initBriefing,
  renderBriefingStorm,
  renderBriefingRevised,
  renderBriefingBlocked,
} from './briefing.js';

const PHASE = { IDLE: 'idle', STORM: 'storm', REVISED: 'revised', BLOCKED: 'blocked' };
let phase = PHASE.IDLE;

async function loadFixtures() {
  const [flights, brief, slack] = await Promise.all([
    fetch('./ops/flights.json').then((r) => r.json()),
    fetch('./fixtures/brief.json').then((r) => r.json()),
    fetch('./fixtures/slack.json').then((r) => r.json()),
  ]);
  return { flights, brief, slack };
}

function updateButtons() {
  const btnStorm = document.getElementById('btn-storm');
  const btnReject = document.getElementById('btn-reject');
  const btnApply = document.getElementById('btn-apply');

  btnStorm.disabled = phase !== PHASE.IDLE;
  btnReject.disabled = phase !== PHASE.STORM;
  btnApply.disabled = phase !== PHASE.STORM && phase !== PHASE.REVISED;
}

function startClock() {
  const el = document.getElementById('utc-clock');
  const tick = () => {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    el.textContent = `${h}:${m}:${s} UTC`;
  };
  tick();
  setInterval(tick, 1000);
}

async function onStorm() {
  if (phase !== PHASE.IDLE) return;
  phase = PHASE.STORM;
  updateButtons();

  showStormBand(true);
  await animateStormPills();
  renderStorm();
  appendStormMessages();
  loadGrokRecap();
  renderBriefingStorm();
}

async function onReject() {
  if (phase !== PHASE.STORM) return;
  phase = PHASE.REVISED;
  updateButtons();

  renderRevised();
  appendRevisedMessages();
  renderBriefingRevised();
}

function onApply() {
  if (phase !== PHASE.STORM && phase !== PHASE.REVISED) return;
  phase = PHASE.BLOCKED;
  updateButtons();

  // Gantt unchanged — no schedule write-back
  showKnoxModal();
  renderBriefingBlocked();
}

async function init() {
  initPills();
  initKnox();
  startClock();

  try {
    const { flights, brief, slack } = await loadFixtures();
    setFlightsData(flights);
    setDeskData(flights, brief);
    setSlackData(slack);
    setBriefingData(brief);

    const sliceLabel = document.getElementById('slice-label');
    if (sliceLabel) {
      sliceLabel.textContent = `SLICE ${flights.meta.sliceFlights} / ${flights.meta.universe.toLocaleString()}`;
    }

    initGantt();
    initSlack();
    initBriefing();
    renderIdle();
    setAllPills('idle');
    updateButtons();
    initApiStream();
  } catch (err) {
    console.error('Fixture load failed — serve via server.py, not file://', err);
    document.body.insertAdjacentHTML(
      'beforeend',
      '<p style="color:#c44;padding:20px">Failed to load fixtures. Run: python3 server.py 8765</p>'
    );
  }

  document.getElementById('btn-storm').addEventListener('click', onStorm);
  document.getElementById('btn-reject').addEventListener('click', onReject);
  document.getElementById('btn-apply').addEventListener('click', onApply);
  document.getElementById('btn-grok').addEventListener('click', loadGrokRecap);
}

init();
