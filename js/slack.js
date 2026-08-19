/** Mock Slack #opsd-war-room renderer + API push */

let slackData = null;
const feed = [];

export function setSlackData(data) {
  slackData = data;
}

function formatUtcTime() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function initSlack() {
  feed.length = 0;
  if (slackData?.idle) {
    feed.push(...slackData.idle);
  }
  render();
}

export function pushMessage(msg) {
  feed.push({
    author: msg.author || 'API',
    role: msg.role || 'EXTERNAL',
    time: msg.time || formatUtcTime(),
    text: msg.text || '',
  });
  render();
}

export function appendStormMessages() {
  if (slackData?.storm) {
    feed.push(...slackData.storm);
    render();
  }
}

export function appendRevisedMessages() {
  if (slackData?.revised) {
    feed.push(...slackData.revised);
    render();
  }
}

export function appendBlockedMessages() {
  if (slackData?.blocked) {
    feed.push(...slackData.blocked);
    render();
  }
}

function render() {
  const container = document.getElementById('slack-feed');
  if (!container) return;

  container.innerHTML = feed
    .map(
      (m) =>
        `<div class="slack-msg">
          <span class="slack-author">${escapeHtml(m.author)}</span>
          <span class="slack-role">${escapeHtml(m.role)}</span>
          <span class="slack-time">${escapeHtml(m.time)}</span>
          <p class="slack-text">${escapeHtml(m.text)}</p>
        </div>`
    )
    .join('');

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
