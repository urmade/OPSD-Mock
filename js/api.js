/** SSE client — receives pushed desk and Slack events from server API */

import { handleDeskPush } from './desk.js';
import { pushMessage } from './slack.js';

let eventSource = null;

export function initApiStream() {
  if (eventSource) return;

  eventSource = new EventSource('/api/events/stream');

  eventSource.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.type === 'connected') return;
      if (event.type === 'desk') handleDeskPush(event.payload);
      if (event.type === 'slack') pushMessage(event.payload);
    } catch (err) {
      console.warn('API event parse error', err);
    }
  };

  eventSource.onerror = () => {
    // EventSource reconnects automatically
  };
}

export function closeApiStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}
