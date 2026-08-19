# 🧁 bakeoff-dash

A shareable web hub for a friends-league **Fantasy Great British Bake Off** game. Your Google
Sheet stays the source of truth (you keep tallying in the **Input** tab and running
**Bakeoff Tools → Update Scores**); this app reads the computed results and displays them as a
clean, mobile-friendly, auto-updating dashboard with a link you can send anyone.

> Sibling of [`survivor-dash`](https://github.com/ksydness/survivor-dash) — same stack, same
> patterns. See **CLAUDE.md** for the full context, including the handful of deliberate
> differences (decimal-safe parsing for half-points, a fixed 10-episode season, 2 teams).

**Sheet-only**: no database. The app reads your published Google Sheet tabs directly, driven by a
**Seasons** control tab. Everything a commissioner does happens in the sheet.

## What's here

```
CLAUDE.md              ← project context / spec (read before changing anything)
app/                   ← Next.js App Router (landing, season dashboard, draft room, API routes)
lib/                   ← data.ts (sheet reader/assembler), sheets.ts (CSV parsers), scoring.ts, types.ts
apps-script/           ← BakeoffTools.complete.gs — paste into the hub workbook's Apps Script
```

## Tabs

Leaderboard (standings + rank-through-season chart + weekly highlights) · Teams (rosters) ·
Bakers (sortable, weekly trend) · Stats (records) · History (all-time).

## Quick start (local)

```bash
npm install
SEASONS_CSV_URL="<published CSV url of the Seasons tab>" npm run dev
```

## Deploy

Vercel, auto-deploys on push to `main`. Env vars: `SEASONS_CSV_URL` (required),
`HISTORY_CSV_URL` (optional, powers the all-time page). `vercel.json` pins
`{"framework":"nextjs"}` and `.npmrc` keeps `legacy-peer-deps=true` — both required.
