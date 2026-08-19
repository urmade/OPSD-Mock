/** 7×24 Gantt timeline, 15 tail rows, storm overlay */

const HOURS_TOTAL = 168; // 7 days × 24
const ORIGIN = new Date('2026-08-17T00:00:00Z');

let flightsData = null;
let stormVisible = false;

export function setFlightsData(data) {
  flightsData = data;
}

export function showStormBand(show = true) {
  stormVisible = show;
  const overlay = document.querySelector('.storm-overlay');
  if (overlay) {
    overlay.classList.toggle('hidden', !show);
  }
}

/**
 * Gantt math: left% = ((dayIndex * 24 + hour) / 168) * 100
 */
function hourToPercent(dayIndex, hour) {
  return ((dayIndex * 24 + hour) / HOURS_TOTAL) * 100;
}

function parseBarPosition(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startHours = (start - ORIGIN) / (1000 * 60 * 60);
  const endHours = (end - ORIGIN) / (1000 * 60 * 60);
  const left = (startHours / HOURS_TOTAL) * 100;
  const width = ((endHours - startHours) / HOURS_TOTAL) * 100;
  return { left, width };
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
    const tailBars = bars.filter((b) => b.tailId === tail.id);
    html += `<div class="gantt-row">
      <div class="gantt-tail">${tail.label}</div>
      <div class="gantt-track" data-tail="${tail.id}">`;

    // Storm overlay per track (same position on all rows)
    if (stormWindow) {
      const stormLeft = hourToPercent(stormWindow.dayIndex, stormWindow.startHour);
      const stormWidth =
        hourToPercent(stormWindow.dayIndex, stormWindow.endHour) - stormLeft;
      html += `<div class="storm-overlay hidden" style="left:${stormLeft}%;width:${stormWidth}%"></div>`;
    }

    for (const bar of tailBars) {
      const { left, width } = parseBarPosition(bar.start, bar.end);
      const typeCls = bar.type === 'GROUND' ? 'ground' : 'flight';
      const fraCls = bar.fraTouch ? 'fra-touch' : '';
      const label = bar.flight || (bar.type === 'GROUND' ? 'GND' : '');
      html += `<div class="gantt-bar ${typeCls} ${fraCls}" style="left:${left}%;width:${width}%">${label}</div>`;
    }

    html += '</div></div>';
  }

  html += '</div>';
  container.innerHTML = html;
}
