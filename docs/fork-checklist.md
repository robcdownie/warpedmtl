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

- [x] Day-label ternaries → `dayLabel()` from `domain/time.ts`. Full site
  list (grep `'Saturday' : 'Sunday'` to re-find them): `GroupScreen.tsx`,
  `ScheduleScreen.tsx` `DayToggle`, `BoardEntry.tsx` ×3 (day toggle, column
  header, no-match warning), `ScheduleEditor.tsx` completion line + Sat/Sun
  `DayTab`s (abbreviate with `dayLabel(d).slice(0, 3)`), `BandsScreen.tsx`
  Sat/Sun filter chips, `lineupMigrations.ts` `label()`, `emergency.ts`
  header. `ScheduleStatusStrip`/`wrapUp.ts` already used `dayLabel`/labels.
- [x] Rendered date strings → new `festivalDateRange()` /
  `festivalDaysLine()` helpers in `domain/time.ts`, derived from
  `EVENT.days`: `NowScreen.tsx` countdown + doors sublines (close time is
  never displayed — it's unverified; the Hours card became a Doors card),
  "Bands Fri/Sat" stat labels mapped over `EVENT.days`, `AboutScreen.tsx`
  event dates. Their pins in `time.test.ts` re-anchor per fork.
- [x] Rendered city strings: `WarpedWordmark.tsx` ("LONG BEACH" text tag →
  MONTRÉAL), `NowScreen.tsx` hero, `WrapUpScreen.tsx` hero tag + wrap-up
  copy, `FriendsScreen.tsx` export filename prefix (`warpedlb-…` →
  `warpedmtl-…`), `MapCanvas.tsx` img alt, `types.ts`/`theme.css` headers,
  food jokes localized (corndogs → poutine).
- [x] Map-provenance honesty copy: `settings.ts` + `MapSetupScreen.tsx` +
  `docs/trust-states.md` + `docs/replace-map.md` now say "reference layout,
  not yet drawn or calibrated for this venue" — placeholder-accurate until
  real map art ships.
- [x] Donation rail: `AboutScreen.tsx` + `WrapUpScreen.tsx` links →
  `${BASE_URL}donate.html` ("Chip in"), new `public/donate.html`
  meta-refresh redirect (founder pastes the live Ko-fi URL; agents never
  hold it). Venmo-specific copy removed everywhere.
- [x] Harness: `verify-e2e.mjs` `HARNESS_NOW` → mid-festival day one in the
  new zone, `BASE` → new path; **built-bundle string ban** added (`Sunday`
  case-sensitive — lowercase day ids are storage tokens and stay; `Long
  Beach`, `July 25`, `venmo.com` case-insensitive). The functional pass's
  day-toggle click targets the day-one LABEL (Friday), not the id.
- [x] `scripts/shots.mjs` `BASE`, contact-sheet titles, and its seeded pass
  (now brings its own fixture bill — see the lineup note below).
- [x] Docs + README: live-app URLs and city references in `README.md`,
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
- [x] Lineup: NOT seeded until the official day split drops. **Done in S2,
  not S3, and not "harmless to keep":** the old city's bands are string
  literals in the built bundle, and Long Beach's bill included Taking Back
  Sunday — which trips the `Sunday` string ban. So `artists-saturday.ts` /
  `artists-sunday.ts` / `artists-unplugged.ts` ship EMPTY, and everything
  that needed a lineup brings its own: the e2e harness seeds a fixture bill
  through the new `__WLB__.seedLineup()` debug hook (same pattern as
  `HARNESS_USERS`), demo mode ships obviously-fictional bands in
  `demoSchedule.ts`, `seed.test.ts` runs the dedup mechanics on fixture
  lists via `buildSeed(lists)`, and `shots.mjs` seeds its own five. When the
  real lineup lands (fill procedure:
  `festival-blueprint/montreal/lineup-staging.md`), note its §3 step 6: the
  ban needs the one Taking Back Sunday exception taught to it THEN — never
  pre-emptively.
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
