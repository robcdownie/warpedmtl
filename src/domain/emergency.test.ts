import { describe, it, expect } from 'vitest';
import { buildEmergencyText, type EmergencyInput } from './emergency';
import { hhmmToMinutes } from './time';
import type { Artist, MapLocation, Performance, Selection, User, DayId } from './types';
import type { MeetupSuggestion } from './meetups';

// The plain-text export is the last-resort backup (spec §35) — the one
// surface read with no app to cross-check, so its lines are pinned here.

const user: User = { id: 'member-1', name: 'Alex', initials: 'A', avatar: null, colorKey: 'pink' };

const locations: MapLocation[] = [
  { id: 'ghost', name: 'Ghost Stage', shortName: 'Ghost', category: 'stage', xPercent: 93, yPercent: 45 },
  { id: 'rex', name: 'Rex Stage', shortName: 'Rex', category: 'stage', xPercent: 26, yPercent: 70 },
  { id: 'lobos-1707', name: 'Lobos 1707', category: 'bar', xPercent: 59, yPercent: 60 },
];

const artists: Artist[] = [
  { id: 'a-early', name: 'Early Band', searchAliases: [], category: 'main-lineup' },
  { id: 'a-late', name: 'Late Band', searchAliases: [], category: 'main-lineup' },
];

function perf(id: string, artistId: string, stageId: string, start: string, end: string): Performance {
  return {
    id,
    artistId,
    type: 'main',
    day: 'saturday',
    stageId,
    startTime: start,
    endTime: end,
    estimatedEndTime: null,
    scheduleStatus: 'scheduled',
  };
}

function sel(pid: string): Selection {
  return { userId: user.id, performanceId: pid, priority: 'want-to-see', selected: true, attendanceDecision: 'attending', notes: '' };
}

const meetup: MeetupSuggestion = {
  id: 'meetup-saturday-840-lobos-1707',
  day: 'saturday',
  startMinute: hhmmToMinutes('14:00'),
  endMinute: hhmmToMinutes('14:20'),
  durationMinutes: 20,
  location: locations[2],
  userIds: [user.id],
  perUser: [{ userId: user.id, openAfter: false }],
  reason: 'Shared opening',
  confidence: 'high',
  usesEstimated: false,
};

function makeInput(meetups: MeetupSuggestion[] = []): EmergencyInput {
  // Early Band ends 13:40; Late Band starts 15:00 — an 80-minute gap, well
  // past the 25-minute floor that inserts an OPEN line.
  const perfs = [perf('p-early', 'a-early', 'ghost', '13:00', '13:40'), perf('p-late', 'a-late', 'rex', '15:00', '15:40')];
  return {
    user,
    selections: perfs.map((p) => sel(p.id)),
    performanceById: new Map(perfs.map((p) => [p.id, p])),
    artistById: new Map(artists.map((a) => [a.id, a])),
    locationById: new Map(locations.map((l) => [l.id, l])),
    allPerformances: perfs,
    turnoverBuffer: 10,
    meetupsByDay: { saturday: meetups, sunday: [] } as Record<DayId, MeetupSuggestion[]>,
  };
}

describe('emergency schedule text (spec §35)', () => {
  it('header carries the entity list and the unofficial line', () => {
    const text = buildEmergencyText(makeInput());
    expect(text).toContain("ALEX'S PLAN");
    expect(text).toContain('Unofficial personal companion. Times you entered.');
    expect(text).toContain(
      'Not affiliated with Vans, Vans Warped Tour, Insomniac, Live Nation, evenko, or Parc Jean-Drapeau.',
    );
  });

  it('labels the suggested meetup as a window, matching the in-app grammar', () => {
    const text = buildEmergencyText(makeInput([meetup]));
    expect(text).toContain('Suggested meetup at Lobos 1707 — window 2:00 PM – 2:20 PM');
    // The old bare "(2:00 PM)" read as an arrival deadline — never again.
    expect(text).not.toContain('Lobos 1707 (2:00 PM)');
  });

  it('marks a sizeable gap OPEN even with no meetup to suggest', () => {
    const text = buildEmergencyText(makeInput());
    expect(text).toMatch(/OPEN/);
    expect(text).not.toContain('Suggested meetup');
  });

  it('signs off with the one sentence that matters most', () => {
    const text = buildEmergencyText(makeInput());
    expect(text.trimEnd().endsWith('The printed board at the gates is the only authority.')).toBe(true);
  });
});
