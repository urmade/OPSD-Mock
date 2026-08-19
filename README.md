# OPSD War Room — OCC Glass (Demo)

Greenfield static SPA for the Cursor enablement demo: charcoal glass ops-center, interactive 7-day NetLine-shape Gantt, fixture state machine, and local event-push API.

**Not live.** No databases, real Slack, xAI, or OCC write-back.

## Quick start

```bash
python3 server.py 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/)

`server.py` serves static files and the event API (required for desk/Slack push and SSE). Plain `python3 -m http.server` still works for static-only use but **will not** receive API pushes.

**Do not** open `index.html` as `file://` — browser `fetch()` of JSON fixtures will fail.

## Interactive Gantt

Drag flight and ground bars **horizontally within their tail lane** to reschedule. Positions snap to whole-hour boundaries on the 7-day timeline.

## Event push API

The UI subscribes to `GET /api/events/stream` (Server-Sent Events). Push events with POST:

### POST `/api/slack`

```bash
curl -s -X POST http://127.0.0.1:8765/api/slack \
  -H 'Content-Type: application/json' \
  -d '{"author":"Tower","role":"CoS / EVENT","text":"External agent ping — FRA gate hold."}'
```

### POST `/api/desk`

```bash
curl -s -X POST http://127.0.0.1:8765/api/desk \
  -H 'Content-Type: application/json' \
  -d '{
    "stamp": "API PUSH",
    "stampClass": "active",
    "note": "Disruption brief from external orchestrator.",
    "title": "ORCHESTRATOR"
  }'
```

Full desk update example:

```bash
curl -s -X POST http://127.0.0.1:8765/api/desk \
  -H 'Content-Type: application/json' \
  -d '{
    "stamp": "STORM PROPOSAL",
    "stampClass": "active",
    "kpis": {"impacted": 27, "cancelSet": 8, "pax": 574},
    "crewBroken": 6,
    "crew": "Crew: <strong>6</strong> pairings break FDP",
    "grok": "API-injected recap text."
  }'
```

### POST `/api/events` (unified)

```bash
curl -s -X POST http://127.0.0.1:8765/api/events \
  -H 'Content-Type: application/json' \
  -d '{"target":"slack","data":{"author":"Apron","role":"COMMS","text":"Unified endpoint works."}}'
```

### GET `/api/health`

Returns `{"ok": true, "service": "opsd-war-room"}`.

## Demo click path

1. **Idle** — six IDLE pills, empty desk, Slack seed, Gantt chrome (74 flights · 15 tails · 7 days)
2. **FRA thunderstorm 14:00–18:00** — red band on day 3, pills WORKING→DONE, desk **27 / 8 / 574**, Slack stream, Grok stub
3. **Human reject 3 cancels** — drop LH400, OS211, SN315 from cancel set → **5 / 267**, stamp `REVISED · HUMAN EDIT`, crew **6→4**, LH400 delay/swap
4. **Apply to OCC** — Knox modal refuses, Knox pill BLOCKED, desk `BLOCKED · KNOX`, Slack refuse; demo Apply does not mutate Gantt (manual drag still works)

## Fixture numbers (UI contracts)

| Metric | Storm | Revised |
|--------|-------|---------|
| Impacted FRA window | 27 | 5 |
| Cancel set | 8 | 5 |
| PAX | 574 | 267 |
| Crew breaks | 6 | 4 |

Universe: **13,042** · Slice: **74** flights · **22** ground · **15** tails · Days **17 MON – 23 SUN** (Aug 2026)

## Structure

```
server.py           Static + event API (use this to run)
index.html          Shell + buttons + Knox dialog
styles.css          Charcoal glass visual system
js/
  app.js            Phase machine + button wiring
  api.js            SSE client for pushed events
  gantt.js          Interactive 7×24 timeline
  pills.js          Agent pill states
  desk.js           Proposal desk + API push handler
  slack.js          Mock Slack + API push handler
  knox.js           Apply refusal modal
ops/
  flights.json      Schedule fixture (source of truth for KPIs)
fixtures/
  brief.json        Grok recap stub
  slack.json        Slack message fixtures
```

## Guardrails

See `.cursor/rules/demo-only.mdc` — no live NetLine, real Slack, or xAI write-back to OCC.
