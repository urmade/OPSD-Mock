# OPSD War Room — OCC Glass (Demo)

Greenfield static SPA for the Cursor enablement demo: charcoal glass ops-center, 7-day NetLine-shape Gantt, fixture-only state machine.

**Not live.** No databases, Slack, xAI, or OCC write-back.

## Quick start

```bash
python3 -m http.server 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/)

**Do not** open `index.html` as `file://` — browser `fetch()` of JSON fixtures will fail.

## Demo click path

1. **Idle** — six IDLE pills, empty desk, Slack seed, Gantt chrome (74 flights · 15 tails · 7 days)
2. **FRA thunderstorm 14:00–18:00** — red band on day 3, pills WORKING→DONE, desk **27 / 8 / 574**, Slack stream, Grok stub
3. **Human reject 3 cancels** — drop LH400, OS211, SN315 from cancel set → **5 / 267**, stamp `REVISED · HUMAN EDIT`, crew **6→4**, LH400 delay/swap
4. **Apply to OCC** — Knox modal refuses, Knox pill BLOCKED, desk `BLOCKED · KNOX`, Slack refuse; **Gantt unchanged**

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
index.html          Shell + banner + buttons + Knox dialog
styles.css          Charcoal glass visual system
js/
  app.js            Phase machine + button wiring
  gantt.js          7×24 timeline, storm overlay
  pills.js          Agent pill states
  desk.js           Proposal desk + Grok stub
  slack.js          Mock Slack renderer
  knox.js           Apply refusal modal
ops/
  flights.json      Schedule fixture (source of truth for KPIs)
  proposals/fra-storm.md
fixtures/
  brief.json        Grok recap stub
  slack.json        Slack message fixtures
```

## Grok stub

`fixtures/brief.json` provides the recap. The real xAI call is commented in `js/desk.js` — **never invoked in demo**.

Badge: `grok-4.6 (stub)`

## Guardrails

See `.cursor/rules/demo-only.mdc` — never wire live NetLine, Slack, xAI, or OCC write-back.
