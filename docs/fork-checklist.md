# Fork checklist — standing up a new city instance

Every file that carries the event's identity, in the order to change them, with
why each one exists. Written while forking Long Beach → Montréal so the next
fork (Mexico City, Orlando) is a ~3-session job instead of nine. Work through
it top to bottom; the order is dependency order, not importance.

Status reflects the Montréal fork: all five sessions are done — S1
(identity), S2 (sweep + harness), S3 (seeds + ship), S4 (measurement +
owned audience), S5 (bilingual disclaimer + local-language blocks).

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

- [x] `src/data/stages.ts` — neutral numbered stages (`stage-1`…`stage-8`,
  names "Stage 1"…) on a grid until the real map exists; keep
  `warped-unplugged-stage` verbatim (board entry pins unplugged sets to that
  exact id). Real names/positions arrive by coordinates code — imports match
  by id and renames propagate, so nothing strands.
- [x] `src/data/locations.ts` — strip old-city pins, seed the new entrance
  (`parc-jean-drapeau-entrance`); update `ENTRANCE_LOCATION_ID` in `event.ts`
  in the same commit — travel math falls back to it, so they must move
  together. `PREFERRED_LANDMARK_IDS` in `domain/meetups.ts` names old-city
  pins too; shrink it to the entrance (missing ids are skipped harmlessly, so
  it regrows with the coordinates code).
- [x] `src/data/amenities.ts` — down to the minimal set the features need:
  the Water / Restrooms / First Aid map filters plus one pin per
  break-planner errand (Food, Water Stations, Charge Station, Restrooms,
  Lockers). Neutral spread positions; Map Setup's reference-layout state
  carries the honesty.
- [x] Seed-dependent tests: `seed.test.ts` pins the neutral layout (8+1
  stages, entrance exists and matches config, break-planner coverage);
  `leaveBy.test.ts` / `meetups.test.ts` fixtures carry the entrance id; and
  `verify-e2e.mjs` drives the store with REAL seeded stage ids — its
  check-in/schedule/stale-position steps must track the rename or the
  export-validation check fails against the new stage table.
- [x] Lineup: NOT seeded until the official day split drops. **Done in S2,
  not S3, and not "harmless to keep":** the old city's bands are string
  literals in the built bundle, and Long Beach's bill included Taking Back
  Sunday — which trips the `Sunday` string ban. So `artists-saturday.ts` /
  `artists-sunday.ts` / `artists-unplugged.ts` ship EMPTY, and everything
  that needed a lineup brings its own: the e2e harness seeds a fixture bill
  through the new `__WLB__.seedLineup()` debug hook (same pattern as
  `HARNESS_USERS`), demo mode ships obviously-fictional bands in
  `demoSchedule.ts`, `seed.test.ts` runs the dedup mechanics on fixture
  lists via `buildSeed(lists)`, and `shots.mjs` seeds its own five. Band names that
  legitimately embed a banned word (Montréal: Taking Back Sunday) are
  already taught to the ban via `BAN_EXCEPTIONS` in `verify-e2e.mjs` — done
  in S4, ahead of the lineup, so the floating seed task can't go red on it;
  see §4 for the rule and the self-test that keeps the exception honest.
  Lineup fill procedure: `festival-blueprint/montreal/lineup-staging.md`
  (its §3 step 6 is pre-satisfied).
- [x] Ship: full gate (`npm test` + `verify-e2e`), enable Pages (workflow
  build type) BEFORE the first push, push to `main` (`deploy.yml` fires on
  push and gates on the same suites), then verify the live URL + string ban
  against the served bundle — the deployed text, not the local dist.

## 4. Measurement + owned audience (S4)

- [x] `src/config/analytics.ts` — `GOATCOUNTER_SITE_CODE`, one per instance
  (a NEW free GoatCounter site per city, or the numbers blend). Empty string
  = analytics fully off: no tag in the built HTML, zero requests. The
  count.js tag is injected at build time by the `goatcounter-snippet` plugin
  in `vite.config.ts`; nothing to edit per fork besides the code itself.
- [x] Beacons (`src/analytics.ts`, wired in `main.tsx` + the selections
  branch of `applyImport` in `appStore.ts`): once-ever `/install`,
  once-per-local-day `/standalone-launch` (standalone display mode only),
  `/crew-import` per selections code that lands ≥1 pick. All queue in the
  meta store until online, all no-op with an empty site code or on
  localhost (dev + e2e must never inflate the live counter). City-agnostic —
  no per-fork edit; the site code is the namespace. Gating logic is
  unit-tested in `src/analytics.test.ts`.
- [x] SW must never cache the analytics script: `runtimeCaching` in
  `vite.config.ts` is same-origin + BASE-scoped, so cross-origin gc.zgo.at
  never matches — keep it that way (comment in the config says why).
- [x] About screen discloses the counting (anonymous, cookieless, bare
  tallies) — the bullet renders ONLY when a site code is set, so a build
  that sends nothing claims nothing. Tip-jar footnotes on About + wrap-up
  name Ko-fi as whose site the donate page is.
- [x] Owned audience: `NOTIFY_MAILTO` in `config/event.ts` ("Get notified
  for the next tour stop"), one low-key line on About + wrap-up. The
  wrap-up line matters most — it's the wound-down page, i.e. the only
  audience surface that outlives the instance.
- [x] String-ban exceptions: `BAN_EXCEPTIONS` in `verify-e2e.mjs` strips
  exact known-safe names (full band names only, added only when they
  actually ship) before the scan. Self-tested in the functional pass: a
  seeded "Taking Back Sunday" must render AND pass the ban, and a bare
  "Sunday" literal in the same text must still trip it. Per fork: empty the
  list, re-add whichever of the new city's confirmed bands embed banned
  words.

## 5. Disclaimer + local language (S5)

The app stays English per instance; the local language gets an honest
handful of blocks, not a half-translation. (Montréal: French. Mexico City
would repeat this section with Spanish.)

- [x] `src/config/event.ts` — `APP_DISCLAIMER` replaced with the plan's
  appendix copy as an array of paragraphs (entity list, where codes come
  from + board authority, estimates-not-promises), `APP_DISCLAIMER_FR`
  added alongside. Every render site maps paragraphs now —
  `MenuDrawer.tsx` and `NowScreen.tsx` render EN only; the onboarding
  welcome step and `AboutScreen.tsx` stack EN then FR (French wrapped in
  `lang="fr"` for screen readers).
- [x] Local-language orientation blocks, constants in the same file so the
  native-review pass edits one place: `FR_WELCOME_NOTE` on the welcome
  step (what it does, offline at the venue, free, no account, "the app is
  in English"), `FR_ABOUT_NOTE` under an "En français" heading on About.
  NO i18n framework, no other screens — that's the decided scope, not a
  shortcut.
- [x] `src/domain/emergency.ts` — the plain-text export header carries the
  same entity list as the disclaimer (the printout outlives the app);
  sign-off line is the board-authority sentence.
- [x] `vite.config.ts` — one local-language sentence at the end of the
  manifest description ("l'appli est en anglais" belongs on the install
  card, before anyone installs).
- [x] `docs/install.md` — one local-language pointer at the top, using the
  OS's own localized menu labels («Sur l'écran d'accueil»).
- [x] `README.md` — disclaimer blockquote matches the in-app copy;
  measurement paragraph tells the truth about the tally (S4 added
  counting, so "no analytics" claims had to go).
- [x] Native review is a launch gate, not a nicety: drafted FR is marked
  unreviewed until a francophone checks register (window Aug 8–14).
  Review edits land in `event.ts` + the three satellite sites its header
  comment names. No reviewer → cut public-facing French except the in-app
  disclaimer.

## Left for a human, per instance

- Create the instance's GoatCounter site (free, ~1 min) and paste the site
  code into `src/config/analytics.ts` — until then the app sends nothing
  and the About disclosure stays hidden.
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
- Native speaker reviews every local-language string (register, not just
  grammar — machine-flavored copy in the local subreddit reads as spam).
  The full list of sites is in the `event.ts` header comment. No reviewer
  by the deadline → ship English only, keep just the in-app disclaimer
  bilingual.
