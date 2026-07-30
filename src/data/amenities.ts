import type { MapLocation } from '@/domain/types';

/**
 * Amenity pins for the reference layout.
 *
 * Montréal's site plan is unpublished, so this is the minimal set the app's
 * own features depend on: the Water / Restrooms / First Aid map filters — the
 * things people actually open a festival map for — plus one target per
 * break-planner errand (eat, water, recharge, restroom, lockers).
 *
 * Positions are a neutral spread across the reference grid, NOT observed
 * locations: enough for the features to work, useless for navigation, and Map
 * Setup says so until a human verifies the layout against the official 2026
 * map. Real positions arrive by coordinates code or calibration.
 */

interface AmenitySeed {
  type: string;
  /** [xPercent, yPercent] pairs, one per pin of this type. */
  points: [number, number][];
}

const AMENITY_SEEDS: AmenitySeed[] = [
  { type: 'Water Stations', points: [[30, 40], [70, 48]] },
  { type: 'Restrooms', points: [[14, 40], [50, 48], [86, 40]] },
  { type: 'First Aid', points: [[50, 36], [50, 66]] },
  { type: 'Food', points: [[30, 66], [70, 66]] },
  { type: 'Charge Station', points: [[60, 40]] },
  { type: 'Lockers', points: [[40, 66]] },
];

function slug(type: string): string {
  return type
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Stable ids (`restrooms-01`, `restrooms-02`, …) so calibrated positions and
 * shared coordinate codes survive across devices and app updates.
 */
export const AMENITY_LOCATIONS: MapLocation[] = AMENITY_SEEDS.flatMap((seed) =>
  seed.points.map((point, i) => ({
    id: `${slug(seed.type)}-${String(i + 1).padStart(2, '0')}`,
    // Multiple pins of a type need distinguishing in a list; the map itself
    // only ever shows the icon.
    name: seed.points.length > 1 ? `${seed.type} ${i + 1}` : seed.type,
    shortName: seed.type,
    category: 'amenity' as const,
    amenityType: seed.type,
    xPercent: point[0],
    yPercent: point[1],
  })),
);
