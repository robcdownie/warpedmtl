import { describe, it, expect } from 'vitest';
import { buildSeed, type SeedLists } from './seed';
import { SATURDAY_ARTISTS } from './artists-saturday';
import { SUNDAY_ARTISTS } from './artists-sunday';
import { UNPLUGGED_APPEARANCES } from './artists-unplugged';
import { STAGES } from './stages';
import { NAMED_LOCATIONS } from './locations';
import { AMENITY_LOCATIONS } from './amenities';
import { ENTRANCE_LOCATION_ID } from '@/config/event';

/**
 * The shipped Montréal seed is deliberately EMPTY of bands: the official day
 * split is unpublished, and shipping another city's lineup as if it were the
 * bill is exactly the kind of confident fiction this app refuses. The
 * mechanism tests below therefore run on fixture lists — the machinery has to
 * keep working for the day the real lineup lands
 * (festival-blueprint/montreal/lineup-staging.md).
 */
describe('shipped seed state (Montréal, pre-lineup)', () => {
  it('ships no bands until the day split is published', () => {
    expect(SATURDAY_ARTISTS).toHaveLength(0);
    expect(SUNDAY_ARTISTS).toHaveLength(0);
    expect(UNPLUGGED_APPEARANCES).toHaveLength(0);
    const { artists, performances, locations } = buildSeed();
    expect(artists).toHaveLength(0);
    expect(performances).toHaveLength(0);
    // Stages and map pins still seed — the board and map work lineup-less.
    expect(locations.length).toBeGreaterThan(0);
  });

  it('ships neutral numbered stages until the real stage names land', () => {
    // Eight placeholder stages; real names and positions arrive by
    // coordinates code (renames propagate), never by guessing sponsors.
    expect(STAGES.filter((s) => /^stage-\d$/.test(s.id))).toHaveLength(8);
    // Warped Unplugged keeps its id — board entry pins unplugged sets to it.
    expect(STAGES.some((s) => s.id === 'warped-unplugged-stage')).toBe(true);
    expect(STAGES).toHaveLength(9);
  });

  it('the entrance the travel math falls back to actually exists', () => {
    const entrance = NAMED_LOCATIONS.find((l) => l.id === ENTRANCE_LOCATION_ID);
    expect(entrance).toBeDefined();
    expect(entrance!.category).toBe('entrance');
    // The entrance is the ONLY named pin — everything else about the site
    // layout is unannounced, and this app does not decorate maps with fiction.
    expect(NAMED_LOCATIONS).toHaveLength(1);
  });

  it('every break-planner errand has at least one amenity pin to aim at', () => {
    const types = new Set(AMENITY_LOCATIONS.map((l) => l.amenityType));
    for (const t of ['Food', 'Water Stations', 'Charge Station', 'Restrooms', 'Lockers', 'First Aid']) {
      expect(types.has(t), `missing amenity type: ${t}`).toBe(true);
    }
  });
});

describe('seed mechanics (fixture lineup — spec §33)', () => {
  // 'Shared Act' plays a main day AND unplugged; 'Both Days' plays both main
  // days — together they exercise every artist-dedup path buildSeed has.
  const FIXTURES: SeedLists = {
    saturday: ['Both Days', 'Solo Friday', 'Shared Act'],
    sunday: ['Both Days', 'Solo Saturday'],
    unplugged: ['Shared Act', 'Unplugged Only'],
  };
  const { artists, performances } = buildSeed(FIXTURES);

  it('every main artist appears exactly once per day (acceptance §13-14)', () => {
    const satMain = performances.filter((p) => p.type === 'main' && p.day === 'saturday');
    const sunMain = performances.filter((p) => p.type === 'main' && p.day === 'sunday');
    expect(satMain).toHaveLength(FIXTURES.saturday.length);
    expect(sunMain).toHaveLength(FIXTURES.sunday.length);
    // unique performance ids
    expect(new Set(performances.map((p) => p.id)).size).toBe(performances.length);
  });

  it('no duplicate main performance for the same artist+day', () => {
    const seen = new Set<string>();
    for (const p of performances.filter((x) => x.type === 'main')) {
      const key = `${p.artistId}:${p.day}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('Unplugged appearances do NOT duplicate artist records (acceptance §17)', () => {
    // Artists shared between main + unplugged reuse one artist record.
    const ids = artists.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every unplugged performance references an existing artist.
    const artistIds = new Set(ids);
    for (const p of performances.filter((x) => x.type === 'unplugged')) {
      expect(artistIds.has(p.artistId)).toBe(true);
      expect(p.stageId).toBe('warped-unplugged-stage');
      expect(p.day).toBeNull();
    }
    expect(performances.filter((p) => p.type === 'unplugged')).toHaveLength(
      FIXTURES.unplugged.length,
    );
  });

  it('a performer on both a main day and unplugged keeps one artist record', () => {
    const shared = artists.filter((a) => a.name === 'Shared Act');
    expect(shared).toHaveLength(1);
    expect(shared[0].category).toBe('main-lineup');
    const perfs = performances.filter((p) => p.artistId === shared[0].id);
    expect(perfs.some((p) => p.type === 'main')).toBe(true);
    expect(perfs.some((p) => p.type === 'unplugged')).toBe(true);
  });

  it('a performer on both main days keeps one artist record, two performances', () => {
    const both = artists.filter((a) => a.name === 'Both Days');
    expect(both).toHaveLength(1);
    const days = performances.filter((p) => p.artistId === both[0].id).map((p) => p.day);
    expect(days.sort()).toEqual(['saturday', 'sunday']);
  });

  it('all main performances start time-pending with no stage/time', () => {
    for (const p of performances.filter((x) => x.type === 'main')) {
      expect(p.scheduleStatus).toBe('time-pending');
      expect(p.startTime).toBeNull();
      expect(p.stageId).toBeNull();
    }
  });
});
