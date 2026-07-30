// Event configuration — spec §2. Do not display fictional schedule data in production.

export const EVENT = {
  id: 'warped-montreal-2026',
  name: 'Vans Warped Tour Montréal',
  venue: 'Espace 67, Parc Jean-Drapeau',
  address: '1 Circuit Gilles-Villeneuve, Montréal, QC H3C 1A9',
  timezone: 'America/Toronto',
  festivalHours: {
    opens: '11:00',
    // UNVERIFIED-LATER-CANDIDATE: 23:00 is single-sourced fan info (LB closed
    // 22:00). Never displayed in the UI — it only drives countdown end and the
    // derived wind-down — so it is one number to correct at S9 when the
    // official FAQ settles it.
    closes: '23:00',
  },
  // ⚠️ DAY IDS ARE LEGACY STORAGE TOKENS, NOT WEEKDAYS. Montréal runs
  // Friday/Saturday, but every store index, share payload, and migration keyed
  // a day by 'saturday'/'sunday' at Long Beach, and renaming the ids would
  // strand that data. The `label` is the ONLY thing that renders. Never print
  // an id; route all display through dayLabel() in domain/time.ts.
  days: [
    { id: 'saturday', label: 'Friday', date: '2026-08-21' },
    { id: 'sunday', label: 'Saturday', date: '2026-08-22' },
  ],
} as const;

export type EventDay = (typeof EVENT.days)[number];

export const APP_NAME = 'Warped MTL Companion';
export const APP_DISCLAIMER =
  'Unofficial fan-made app. Not affiliated with, endorsed by, or connected to Vans, Vans Warped Tour, or the venue. Set times are entered by you or imported from a code — always check the official board.';

/**
 * Location id of the festival entrance (see src/data/locations.ts). Used as the
 * origin/fallback point for travel math before a first set or without a stage.
 */
export const ENTRANCE_LOCATION_ID = 'shoreline-village-drive-entrance';

/** Base path used for asset URLs (matches vite base + PWA scope). */
export const BASE_URL = import.meta.env.BASE_URL;

export const MAP_IMAGE_URL = `${BASE_URL}map/festival-map.webp`;

/** Illustration set, all offline-bundled + precached. */
export const ART = {
  hero: `${BASE_URL}art/hero.webp`,
  emptyGroup: `${BASE_URL}art/empty-group.webp`,
  emptySchedule: `${BASE_URL}art/empty-schedule.webp`,
  emptyMap: `${BASE_URL}art/empty-map.webp`,
  emptyBands: `${BASE_URL}art/empty-bands.webp`,
  emptyTimeline: `${BASE_URL}art/empty-timeline.webp`,
  emptyShared: `${BASE_URL}art/empty-shared.webp`,
  noConflicts: `${BASE_URL}art/no-conflicts.webp`,
} as const;
