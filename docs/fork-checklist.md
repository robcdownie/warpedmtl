# Fork checklist — standing up a new city instance

Every file that carries the event's identity, in the order to change them, with
why each one exists. Written while forking Long Beach → Montréal so the next
fork (Mexico City, Orlando) is a ~3-session job instead of nine. Work through
it top to bottom; the order is dependency order, not importance.

Status keys below reflect the Montréal fork: **[x]** done in S1 (identity),
**[A2]** pending in S2 (sweep + harness), **[A3]** pending in S3 (seeds + ship).

## 1. Identity (S1) — do this before anything renders

- [x] `src/config/event.ts` — `EVENT.id` (new city + year; the share codec
  embeds it, so old-instance codes are rejected with a clean "different event"
  message), name, venue, address, `timezone` (IANA zone), `festivalHours`,
  `days`, `APP_NAME`. Two traps:
  - **Day ids are legacy storage tokens, not weekdays.** Keep
    `'saturday'`/`'sunday'` forever; only `label` renders. Renaming ids
    strands every store index, share payload, and migration.
  - Mark any unverified number (Montréal: the 23:00 close) with a loud
    comment so the final pre-freeze seed session knows to confirm it.
- [x] `src/domain/time.ts` — nothing city-named to edit by design, but check
  the header comment (timezone) and the festival-hours mentions in
  `parseBoardTime`. Wind-down is derived (`WIND_DOWN_AFTER_CLOSE_MINUTES`
  after the final day's close), so it follows `festivalHours` automatically —
  decide the offset per venue's egress reality (Montréal: island, metro-only,
  +180 min; Long Beach shipped −30 min as a hardcoded time).
- [x] `src/App.tsx` + `scripts/verify-e2e.mjs` — comments referencing the
  wind-down constant; keep them pointing at the real symbol.
- [x] `src/db/schema.ts` — `PROD_DB_NAME` / `DEMO_DB_NAME` →
  `<instance>-public-2026` / `-demo`. **This is the data-corruption guard.**
  Every instance lives on the same `github.io` origin and IndexedDB is scoped
  by origin, not path — a reused name means a phone with two instances
  installed silently cross-writes their picks.
- [x] `vite.config.ts` — `BASE` (**lowercase**, must equal the repo name;
  Pages paths are case-sensitive), manifest `name`/`short_name`/`description`
  (`id`/`scope`/`start_url` derive from `BASE`), workbox `cacheId` and runtime
  `cacheName` → `<instance>-public*` (Cache Storage shares the origin too).
- [x] `index.html` — `<title>`, meta description, `apple-mobile-web-app-title`
  (the name under the Home Screen icon).
- [x] `package.json` — `name`, `description`.
- [x] `package-lock.json` — the two `"name"` fields (root + `packages[""]`);
  npm tolerates a mismatch but the old city string survives greps otherwise.
- [x] Tests pinned to event dates: `src/domain/time.test.ts`
  (`timeUntilFestival`, the midnight-rollover block, `windDownStarted`).
  Re-pin to the new dates **in the new zone's UTC offset** and keep each
  boundary case: night-before, offset-bug canary, mid-day-one, overnight
  between days, minute-before-close, after-close-final-day, following-week;
  for wind-down: first-night close must NOT trigger (final day only),
  close+179 false / close+180 true, festival-time-not-UTC pair, December
  (watch DST: Montréal is −04:00 in August, −05:00 in December). Every other
  suite's dates are relative-age fixtures and pass untouched — run
  `npx vitest run` to prove it rather than editing them.

## 2. Copy + rails sweep (S2)

- [A2] Day-label ternaries → `dayLabel()` from `domain/time.ts`. Known sites:
  `GroupScreen.tsx` tabs, `ScheduleEditor.tsx` tabs, `lineupMigrations.ts`
  `label()`, `NowScreen.tsx` date strings + "Bands Sat/Sun" stat labels,
  `emergency.ts` header, `ScheduleProvenance` day-named renders.
- [A2] Rendered city strings: `WarpedWordmark.tsx` ("LONG BEACH" SVG text),
  `NowScreen.tsx` hero, `WrapUpScreen.tsx` hero tag + wrap-up copy,
  `FriendsScreen.tsx` export filename prefix (`warpedlb-…`).
- [A2] Map-provenance honesty copy: `settings.ts` + `MapSetupScreen.tsx`
  still describe the previous city's hand-traced map; make the wording match
  what actually ships (placeholder vs new art).
- [A2] Donation rail: `AboutScreen.tsx` + `WrapUpScreen.tsx` links →
  `public/donate.html` meta-refresh redirect (founder pastes the live
  Ko-fi/tip URL; agents never hold it).
- [A2] Harness: `verify-e2e.mjs` `HARNESS_NOW` → mid-festival in the new
  zone, `BASE` → new path; add the built-bundle string ban (old city name,
  old dates, old weekday labels, old payment rail) so regressions fail CI.
- [A2] `scripts/shots.mjs` `BASE` (screenshot harness serves the build from
  the Pages path).
- [A2] Docs + README: live-app URLs and city references in `README.md`,
  `docs/README.md`, `docs/install.md`, `docs/replace-map.md`,
  `docs/trust-states.md`.

## 3. Seeds + ship (S3)

- [A3] `src/data/stages.ts` — neutral stage ids until the real map exists
  (keep `warped-unplugged-stage`).
- [A3] `src/data/locations.ts` — strip old-city pins, seed the new entrance;
  update `ENTRANCE_LOCATION_ID` in `event.ts` to match (left as
  `shoreline-village-drive-entrance` until the locations seed lands — travel
  math falls back to it, so they must move together).
- [A3] Seed-dependent tests: `seed.test.ts` counts; `leaveBy.test.ts` /
  `meetups.test.ts` reference seeded location names.
- [A3] Lineup: NOT seeded until the official day split drops —
  `artists-saturday.ts` / `artists-sunday.ts` still hold the old city's bands
  until then (harmless pre-launch; the board is empty either way).
- [A3] Ship: full gate (`npm test` + `verify-e2e`), push to `main`
  (`deploy.yml` fires on push and gates on the same suites), enable Pages,
  verify the live URL + string ban against the served bundle.

## Left for a human, per instance

- Paste the real tip-jar URL into `public/donate.html`.
- Device pass on a phone with the previous instance installed: old app still
  opens with data intact, new app installs alongside it (the §1 DB/cache
  renames are what make this safe — verify, don't assume).
- Map art + `travel.ts` retune (`MAP_ASPECT`, `MIN_PER_PERCENT`) if a real
  map ships; icons/splash regeneration (`scripts/icon-source.mjs`,
  `crop-map.mjs`) go with it.
- Verify the close time against the official FAQ before the deploy freeze
  (wind-down and the board parser's PM inference both lean on
  `festivalHours`).
