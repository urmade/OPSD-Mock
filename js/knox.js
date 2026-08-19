/** Knox modal — Apply always refuses */

import { blockKnoxPill } from './pills.js';
import { renderBlocked } from './desk.js';
import { appendBlockedMessages } from './slack.js';

let modal = null;

export function initKnox() {
  modal = document.getElementById('knox-modal');
  const closeBtn = document.getElementById('knox-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal?.close());
  }
}

export function showKnoxModal() {
  blockKnoxPill();
  renderBlocked();
  appendBlockedMessages();

  if (modal) {
    modal.showModal();
  }
}
