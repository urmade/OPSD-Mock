/** 7×24 Gantt timeline — draggable bars within tail lanes */

const HOURS_TOTAL = 168;
const ORIGIN = new Date('2026-08-17T00:00:00Z');

let flightsData = null;
let stormVisible = false;
let dragState = null;

export function setFlightsData(data) {
  flightsData = data;
}

export function showStormBand(show = true) {
  stormVisible = show;
  document.querySelectorAll('.storm-overlay').forEach((overlay) => {
    overlay.classList.toggle('hidden', !show);
  });
}

function hourToPercent(dayIndex, hour) {
  return ((dayIndex * 24 + hour) / HOURS_TOTAL) * 100;
}

function hoursToPercent(hours) {
  return (hours / HOURS_TOTAL) * 100;
}

function percentToHours(percent) {
  return (percent / 100) * HOURS_TOTAL;
}

function parseBarPosition(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startHours = (start - ORIGIN) / (1000 * 60 * 60);
  const endHours = (end - ORIGIN) / (1000 * 60 * 60);
  return {
    left: hoursToPercent(startHours),
    width: hoursToPercent(endHours - startHours),
    startHours,
    durationHours: endHours - startHours,
  };
}

function hoursToIso(hours) {
  const ms = ORIGIN.getTime() + hours * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace('.000', '');
}

function snapHours(hours, duration) {
  const snapped = Math.round(hours);
  return Math.max(0, Math.min(HOURS_TOTAL - duration, snapped));
}

function updateBarTimes(barIndex, leftPercent) {
  if (!flightsData?.bars?.[barIndex]) return;
  const bar = flightsData.bars[barIndex];
  const { durationHours } = parseBarPosition(bar.start, bar.end);
  const startHours = snapHours(percentToHours(leftPercent), durationHours);
  bar.start = hoursToIso(startHours);
  bar.end = hoursToIso(startHours + durationHours);
}

function bindBarDrag(barEl, barIndex, trackEl) {
  barEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    barEl.setPointerCapture(e.pointerId);
    dragState = {
      barEl,
      barIndex,
      trackEl,
      startX: e.clientX,
      startLeft: parseFloat(barEl.style.left) || 0,
      width: parseFloat(barEl.style.width) || 0,
    };
    barEl.classList.add('dragging');
  });

  barEl.addEventListener('pointermove', (e) => {
    if (!dragState || dragState.barEl !== barEl) return;
    const trackWidth = trackEl.offsetWidth;
    if (!trackWidth) return;
    const deltaPct = ((e.clientX - dragState.startX) / trackWidth) * 100;
    let newLeft = dragState.startLeft + deltaPct;
    newLeft = Math.max(0, Math.min(100 - dragState.width, newLeft));
    barEl.style.left = `${newLeft}%`;
  });

  barEl.addEventListener('pointerup', (e) => {
    if (!dragState || dragState.barEl !== barEl) return;
    barEl.releasePointerCapture(e.pointerId);
    barEl.classList.remove('dragging');
    const left = parseFloat(barEl.style.left) || 0;
    updateBarTimes(barIndex, left);
    const pos = parseBarPosition(
      flightsData.bars[barIndex].start,
      flightsData.bars[barIndex].end
    );
    barEl.style.left = `${pos.left}%`;
    dragState = null;
  });

  barEl.addEventListener('pointercancel', () => {
    if (dragState?.barEl === barEl) {
      barEl.classList.remove('dragging');
      dragState = null;
    }
  });
}

function bindAllDrags(container) {
  container.querySelectorAll('.gantt-bar').forEach((barEl) => {
    const index = parseInt(barEl.dataset.barIndex, 10);
    const track = barEl.parentElement;
    if (!Number.isNaN(index) && track) {
      bindBarDrag(barEl, index, track);
    }
  });
}

export function initGantt(containerId = 'gantt-wrap') {
  if (!flightsData) return;

  const container = document.getElementById(containerId);
  if (!container) return;

  const { days, tails, bars, stormWindow } = flightsData;

  let html = '<div class="gantt-grid">';

  html += '<div class="gantt-tail gantt-corner"></div>';
  html += '<div class="gantt-days">';
  for (const day of days) {
    const cls = day.fraWx ? 'gantt-day-header fra-wx' : 'gantt-day-header';
    const label = day.header || day.label;
    html += `<div class="${cls}">${label}</div>`;
  }
  html += '</div>';

  for (const tail of tails) {
    html += `<div class="gantt-row">
      <div class="gantt-tail">${tail.label}</div>
      <div class="gantt-track" data-tail="${tail.id}">`;

    if (stormWindow) {
      const stormLeft = hourToPercent(stormWindow.dayIndex, stormWindow.startHour);
      const stormWidth =
        hourToPercent(stormWindow.dayIndex, stormWindow.endHour) - stormLeft;
      const stormCls = stormVisible ? 'storm-overlay' : 'storm-overlay hidden';
      html += `<div class="${stormCls}" style="left:${stormLeft}%;width:${stormWidth}%"></div>`;
    }

    bars.forEach((bar, i) => {
      if (bar.tailId !== tail.id) return;
      const { left, width } = parseBarPosition(bar.start, bar.end);
      const typeCls = bar.type === 'GROUND' ? 'ground' : 'flight';
      const fraCls = bar.fraTouch ? 'fra-touch' : '';
      const label = bar.flight || (bar.type === 'GROUND' ? 'GND' : '');
      html += `<div class="gantt-bar ${typeCls} ${fraCls}" data-bar-index="${i}" title="Drag to reschedule" style="left:${left}%;width:${width}%">${label}</div>`;
    });

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
  bindAllDrags(container);
}

export function getScheduleState() {
  if (!flightsData) return null;
  return flightsData.bars.map((b) => ({
    tailId: b.tailId,
    type: b.type,
    flight: b.flight,
    start: b.start,
    end: b.end,
  }));
}
