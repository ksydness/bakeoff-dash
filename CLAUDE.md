# bakeoff-dash

A shareable web dashboard / hub for a friends-league **Fantasy Great British Bake Off** game.
This is a sibling of [`survivor-dash`](https://github.com/ksydness/survivor-dash) — same stack,
same patterns, same sheet-only architecture. If you've worked in that repo, everything here is
familiar; this file documents only what's shared in brief and what's **different** in detail.

## How the game works

- 2 players (**Lenny** and **Daegan**) draft 5 GBBO bakers each (Season 1 had 12 bakers; 2 went
  undrafted). Kenny commissions.
- Each episode, actions are tallied in the sheet's **Input** tab (Handshake +5, Star Baker +4,
  Soggy bottom −2, "Raw" −3, …), then **Bakeoff Tools → Update Scores** multiplies tallies by the
  **Scoring** tab, writes the week into **Episodes**, rolls up the **Leaderboard**, and clears Input.
- Most cumulative points at the finale wins.

**Key design principle (inherited):** the Google Sheet + Apps Script are the source of truth and
the scoring engine. This app is a read-only presentation layer.

## Differences from survivor-dash — do not "fix" these back

1. **Decimal-safe parsing.** Bake Off produces half-points (10.5, 213.5). `num()` in
   `lib/sheets.ts` uses `parseFloat`, and `splitNamePts` accepts `"Lenny (25.5)"`. Survivor's
   integer-only `parseInt` version would silently read 10.5 as 105. Any new parsing must stay
   decimal-safe.
2. **Fixed 10-episode season.** Episodes columns are B..J = Week 2..Week 10 (scoring starts the
   week after the draft, same convention as Survivor). Registry `Weeks = 9`. The Apps Script's
   week scan caps at column 10, not 14.
3. **Episodes has a Total column (K) with SUM formulas.** The script's season reset clears only
   the 9 week columns so those formulas survive.
4. **2 teams, 5 picks each.** Team colors in `dashboard.tsx`: Lenny = tent pink `#f9a8d4`,
   Daegan = tent blue `#93c5fd`.
5. **Branding**: 🧁, "Fantasy Bake Off", the Contestants tab is displayed as **Bakers** (the
   sheet tab, payload fields, and the literal `Top Contestant` / `Top Team` Leaderboard labels
   are unchanged — the parsers match those strings).
6. **No `future-db/`, no `prototype/`** — those were survivor-specific.
7. **Draft room localStorage keys**: role `bakeoff-live-role-s<n>` (`t<i>`, `watch`, `commish`,
   `commish:<i>`), commissioner key `bakeoff-commish-key`. `LEAGUE = 'bakeoff'` in
   `lib/draftConfig.ts` scopes the shared Supabase `drafts` table.
8. **`package-lock.json` IS committed** here (survivor-dash has none).

## Everything else (see survivor-dash CLAUDE.md for depth)

- Next.js 15 App Router + React 19 on Vercel; no database, no auth, no cron.
- Published-to-web CSV per tab → `lib/sheets.ts` parsers → `lib/data.ts` (all data access goes
  through it) → `/api/season/[season]` → `app/s/[season]/dashboard.tsx`. Cache 180s; Refresh
  button passes `?sync=1`.
- **Seasons registry tab** drives everything:
  `Season | Name | Status | Episodes URL | Contestants URL | Leaderboard URL | Scoring URL | Weeks | Teams`
  with Status `drafting | active | final`. Add a row = new season. `Teams` = `Lenny|Daegan`.
- **History-Dash** tab (`Season | Place | Team | Points`) powers the all-time page via
  `HISTORY_CSV_URL`.
- Env vars (Vercel dashboard): `SEASONS_CSV_URL` (required), `HISTORY_CSV_URL` (optional),
  `SUPABASE_SERVICE_ROLE_KEY` + `COMMISSIONER_KEY` (live draft secrets). Public Supabase URL/anon
  key ship in `lib/draftConfig.ts` (the `NEXT_PUBLIC_SUPABASE_*` vars still set in Vercel are
  optional overrides).
- **Live multi-device draft** (built here first, 2026-08-31, then ported to survivor): shared
  Supabase project **bakeoff-drafts**, table `drafts` keyed `(league, season)`; files
  `lib/draftConfig.ts`, `lib/liveDraft.ts`, `app/api/live-draft/[season]/route.ts`,
  `app/s/[season]/DraftRoom.tsx`. Commissioner = `/s/<n>?key=<COMMISSIONER_KEY>`; order can be
  rolled or set manually (▲/▼). Full behaviour is documented in survivor-dash's CLAUDE.md — the
  code is identical apart from branding, so **port draft-room changes to both repos**.
- **Link previews / icons / manifest / 404 / noindex** (2026-09-01/02): `lib/og.tsx`,
  `app/opengraph-image.tsx`, `app/s/[season]/opengraph-image.tsx`, `app/icon.tsx`,
  `app/apple-icon.tsx`, `app/icon-512/route.tsx`, `app/manifest.ts`, `app/not-found.tsx`,
  `app/robots.ts`; `app/layout.tsx` has metadataBase (`https://bakeoff-dash.vercel.app`), OG/Twitter,
  `robots: noindex`, `themeColor #0c0a09`. Same files as survivor with 🧁 branding.
- Pushing: GitHub connector `create_or_update_file` with the remote blob sha (from the last push
  result — local clones are stale); verify the Vercel deploy (`prj_93x8XOiv2zvXUlAoD7PFw0lL7Po2`,
  team `team_ehXYoYTnX36nTlQX4GkRIbwA`) goes READY.
- Build config: `vercel.json` must keep `{"framework":"nextjs"}`; `.npmrc` keeps
  `legacy-peer-deps=true`.
- Parser tolerances (optional Leaderboard, header-optional Contestants, label-based Top rows)
  are inherited on purpose — leave them.

## Sheet tab schema (Season 1 hub workbook)

- **Seasons** — the registry (row: `1 | Series 16 | final | …urls… | 9 | Lenny|Daegan`).
- **Episodes** — col A baker; B..J = Week 2..Week 10; K = Total (formula). All 12 bakers,
  including the 2 undrafted (the app ignores anyone not in Contestants).
- **Contestants** — `Contestant | Team | Previous Team | Round Drafted`; the 10 drafted bakers.
- **Leaderboard** — `Team | Total | Week 2..Week 10`; 2 team rows (col B script-written total,
  weekly cells = cumulative rank), then `Top Contestant` / `Top Team` rows with weekly
  `"Name (pts)"` strings.
- **Scoring** — `Action | Points`, 16 GBBO actions (Handshake 5 … "Raw" −3).
- **Draft** — round-by-round picks. **Input** — weekly tally grid (not read by the app).
- **History-Dash** — `1 | 1 | Lenny | 213.5` and `1 | 2 | Daegan | 51`.

Verified Season 1 totals — any change must keep these intact: **Lenny 213.5 · Daegan 51**
(Jasmine 96.5 top baker).

## Season turnover (Kenny's workflow, mirrors Survivor)

1. Copy the hub workbook → publish it once (Entire Document → CSV).
2. **Bakeoff Tools → Start New Season** → season number + weeks → it registers the row (with
   `Lenny|Daegan` teams) and offers a data reset.
3. Draft (set Status `drafting` for the draft room, or fill Contestants + Draft by hand).
4. Tally weekly with Update Scores. **Bakeoff Tools → Finalize Season** at the end.

## Working style (inherited from survivor-dash)

Small shippable changes · `npx tsc --noEmit` before pushing · verify the Vercel deploy went
green · validate new sheet URLs against the real parsers (and totals against History) before
declaring them working.
