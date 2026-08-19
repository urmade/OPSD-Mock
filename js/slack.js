/** Mock Slack #opsd-war-room renderer */

let slackData = null;
const feed = [];

export function setSlackData(data) {
  slackData = data;
}

export function initSlack() {
  feed.length = 0;
  if (slackData?.idle) {
    feed.push(...slackData.idle);
  }
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
          <span class="slack-author">${m.author}</span>
          <span class="slack-role">${m.role}</span>
          <span class="slack-time">${m.time}</span>
          <p class="slack-text">${m.text}</p>
        </div>`
    )
    .join('');

  container.scrollTop = container.scrollHeight;
}
