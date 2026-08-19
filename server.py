#!/usr/bin/env python3
"""OPSD War Room — static files + event push API for desk and Slack."""

import json
import os
import queue
import sys
import threading
import time
import uuid
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

_event_lock = threading.Lock()
_sse_queues: list[queue.Queue] = []


def broadcast(event: dict) -> None:
    with _event_lock:
        for q in _sse_queues:
            try:
                q.put_nowait(event)
            except queue.Full:
                pass


class WarRoomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/events/stream":
            self.handle_sse()
            return
        if path == "/api/health":
            self.send_json({"ok": True, "service": "opsd-war-room"})
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/events":
            self.handle_post_event()
            return
        if path == "/api/desk":
            self.handle_post_target("desk")
            return
        if path == "/api/slack":
            self.handle_post_target("slack")
            return
        self.send_error(404, "Not Found")

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b"{}"
        return json.loads(body.decode("utf-8"))

    def send_json(self, data: dict, status: int = 200) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def handle_post_target(self, target: str) -> None:
        try:
            payload = self.read_json()
            event = {
                "id": str(uuid.uuid4()),
                "type": target,
                "payload": payload,
                "ts": time.time(),
            }
            broadcast(event)
            self.send_json({"ok": True, "id": event["id"]})
        except json.JSONDecodeError:
            self.send_json({"error": "invalid json"}, 400)

    def handle_post_event(self) -> None:
        try:
            data = self.read_json()
            target = data.get("target")
            payload = data.get("data", {})
            if target not in ("desk", "slack"):
                self.send_json({"error": "target must be desk or slack"}, 400)
                return
            event = {
                "id": str(uuid.uuid4()),
                "type": target,
                "payload": payload,
                "ts": time.time(),
            }
            broadcast(event)
            self.send_json({"ok": True, "id": event["id"]})
        except json.JSONDecodeError:
            self.send_json({"error": "invalid json"}, 400)

    def handle_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        q: queue.Queue = queue.Queue(maxsize=64)
        with _event_lock:
            _sse_queues.append(q)

        try:
            self.wfile.write(b"data: {\"type\":\"connected\"}\n\n")
            self.wfile.flush()
            while True:
                try:
                    event = q.get(timeout=25)
                    line = f"data: {json.dumps(event)}\n\n"
                    self.wfile.write(line.encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    self.wfile.write(b": heartbeat\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        finally:
            with _event_lock:
                if q in _sse_queues:
                    _sse_queues.remove(q)


def main() -> None:
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), WarRoomHandler)
    print(f"OPSD War Room serving http://127.0.0.1:{PORT}/")
    print(f"  API: POST /api/desk  POST /api/slack  GET /api/events/stream")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
