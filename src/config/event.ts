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

/**
 * Bilingual disclaimer, paragraph per entry (plan §8 appendix copy, drafted
 * 2026-07-29). Not legal armor — Quebec law voids bodily-injury exclusions
 * regardless of wording — its jobs are accuracy, non-affiliation, and being
 * honest about what the app can't know. EN renders everywhere the disclaimer
 * appears; FR is stacked under EN on the onboarding welcome step and About.
 *
 * ALL in-app French lives in this file (the constants below), plus three
 * satellite sites: the manifest description in vite.config.ts, the install
 * pointer in docs/install.md, and the README. The native-review pass
 * (window Aug 8–14) edits those spots and nothing else.
 */
export const APP_DISCLAIMER = [
  'Unofficial fan-made app. Not affiliated with, endorsed by, or connected to Vans, Vans Warped Tour, Insomniac, Live Nation, evenko, or Parc Jean-Drapeau.',
  "Set times are entered by you or imported from a code someone shared. Codes posted by this app's maintainer are compiled remotely from public sources and photos sent by attendees — nobody on site has verified them. The printed board at the gates is the only authority.",
  'Walking times, leave-by alerts, and end times are estimates, not promises. The app has no GPS and no way to know where you actually are. Use your own judgment in a crowd.',
] as const;

export const APP_DISCLAIMER_FR = [
  'Application non officielle créée par un fan. Aucune affiliation avec Vans, Vans Warped Tour, Insomniac, Live Nation, evenko ou le parc Jean-Drapeau, ni aucune approbation de leur part.',
  "Les heures de passage sont saisies par vous ou importées d'un code partagé. Les codes publiés par le responsable de l'application sont compilés à distance à partir de sources publiques et de photos envoyées par des festivaliers — personne sur place ne les a vérifiés. Le tableau affiché à l'entrée fait foi.",
  "Les temps de marche, les alertes de départ et les heures de fin sont des estimations, pas des garanties. L'application n'utilise pas le GPS et ne peut pas savoir où vous vous trouvez. Fiez-vous à votre jugement dans la foule.",
] as const;

/**
 * The two French orientation blocks (the app itself stays English — decided,
 * not deferred: machine-translated screens would be worse than an honest
 * one-paragraph welcome). Drafted 2026-07-29, native review pending.
 */
export const FR_WELCOME_NOTE =
  "Choisissez vos groupes, comparez vos plans entre amis et gardez l'horaire et la carte hors ligne, même sans signal au parc Jean-Drapeau. C'est gratuit, sans compte — vos données restent sur votre téléphone. L'appli est en anglais.";

export const FR_ABOUT_NOTE =
  "L'appli est en anglais, mais elle est simple — choisissez vos groupes, repérez les conflits d'horaire, partagez vos plans par code QR ou texte, et tout fonctionne hors ligne au parc Jean-Drapeau. Gratuite et sans compte — vos plans restent sur votre téléphone. Les heures de passage ne sont pas officielles ; le tableau affiché à l'entrée fait foi.";

/**
 * Location id of the festival entrance (see src/data/locations.ts). Used as the
 * origin/fallback point for travel math before a first set or without a stage.
 */
export const ENTRANCE_LOCATION_ID = 'parc-jean-drapeau-entrance';

/**
 * Owned audience — the one thing the wound-down Long Beach page never had.
 * A plain mailto, not a list service: the reader writes the email themselves,
 * so joining is the act of sending it, and there is nothing to unsubscribe
 * from but a reply. Rendered as one low-key line on About + the wrap-up.
 */
export const NOTIFY_MAILTO =
  'mailto:robcdownie@gmail.com?subject=Notify%20me%20for%20the%20next%20stop';

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
