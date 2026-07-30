import { describe, it, expect } from 'vitest';
import { EVENT } from '@/config/event';
import {
  parseBoardTime,
  shouldAdvanceBoardTime,
  timeUntilFestival,
  getNow,
  windDownStarted,
  festivalDateRange,
  festivalDaysLine,
} from './time';

// The board lists start times only, within festival hours (11:00-23:00), so a
// bare number is unambiguous. These cases are transcribed from the real 2025
// set-time poster.
describe('parseBoardTime', () => {
  it('reads morning hours as AM', () => {
    expect(parseBoardTime('1153')).toBe('11:53');
    expect(parseBoardTime('11:30')).toBe('11:30');
  });

  it('keeps noon as PM', () => {
    expect(parseBoardTime('1254')).toBe('12:54');
    expect(parseBoardTime('12:41')).toBe('12:41');
  });

  it('infers PM for hours 1-10', () => {
    expect(parseBoardTime('205')).toBe('14:05');
    expect(parseBoardTime('148')).toBe('13:48');
    expect(parseBoardTime('931')).toBe('21:31');
    expect(parseBoardTime('3:31')).toBe('15:31');
    expect(parseBoardTime('1000')).toBe('22:00');
  });

  it('honours an explicit meridiem over the festival-hours guess', () => {
    expect(parseBoardTime('3:05 pm')).toBe('15:05');
    expect(parseBoardTime('3:05pm')).toBe('15:05');
    expect(parseBoardTime('11:15 am')).toBe('11:15');
    expect(parseBoardTime('12:00 am')).toBe('00:00');
    expect(parseBoardTime('12:00 pm')).toBe('12:00');
  });

  it('keeps a full 24-hour time as typed', () => {
    expect(parseBoardTime('15:05')).toBe('15:05');
    expect(parseBoardTime('2130')).toBe('21:30');
  });

  it('accepts a bare hour', () => {
    expect(parseBoardTime('3')).toBe('15:00');
    expect(parseBoardTime('3 pm')).toBe('15:00');
    expect(parseBoardTime('11')).toBe('11:00');
  });

  it('tolerates surrounding whitespace and dots', () => {
    expect(parseBoardTime('  205  ')).toBe('14:05');
    expect(parseBoardTime('3:05 p.m.')).toBe('15:05');
  });

  it('returns null for anything unparseable', () => {
    expect(parseBoardTime('')).toBeNull();
    expect(parseBoardTime('   ')).toBeNull();
    expect(parseBoardTime('abc')).toBeNull();
    expect(parseBoardTime('12:75')).toBeNull();
    expect(parseBoardTime('25:00')).toBeNull();
    expect(parseBoardTime('13 pm')).toBeNull();
    expect(parseBoardTime('12345')).toBeNull();
  });
});

describe('shouldAdvanceBoardTime', () => {
  it('advances once four digits are in', () => {
    expect(shouldAdvanceBoardTime('1153')).toBe(true);
    expect(shouldAdvanceBoardTime('1030')).toBe(true);
  });

  it('advances on three digits that cannot be extended', () => {
    expect(shouldAdvanceBoardTime('148')).toBe(true); // 14:8x is never valid
    expect(shouldAdvanceBoardTime('530')).toBe(true);
    expect(shouldAdvanceBoardTime('931')).toBe(true);
  });

  it('waits when a fourth digit could still change the reading', () => {
    expect(shouldAdvanceBoardTime('115')).toBe(false); // could become 11:5x
    expect(shouldAdvanceBoardTime('200')).toBe(false); // could become 20:0x
  });

  it('never assumes from one or two digits', () => {
    expect(shouldAdvanceBoardTime('3')).toBe(false); // might be the start of 331
    expect(shouldAdvanceBoardTime('11')).toBe(false);
    expect(shouldAdvanceBoardTime('')).toBe(false);
  });
});

// `ended` gates the post-festival wrap-up, which replaces the Now tab. A false
// positive would hijack the main screen mid-festival — the single worst thing
// this flag can do — so the boundaries are pinned in festival-local time.
// Montréal is EDT (UTC-4) in August; the last day closes at 23:00.
describe('timeUntilFestival', () => {
  const at = (iso: string) => timeUntilFestival(new Date(iso));

  it('has not started the night before', () => {
    const t = at('2026-08-20T20:00:00-04:00');
    expect(t.started).toBe(false);
    expect(t.ended).toBe(false);
  });

  it('counts down in festival-local time, not UTC', () => {
    // 11:00 EDT Friday is 15:00Z — an implementation that forgot the offset
    // would report the festival as already open at 07:00 EDT.
    const t = at('2026-08-21T07:00:00-04:00');
    expect(t.started).toBe(false);
    expect(t.hours).toBe(4);
  });

  it('is running, not ended, in the middle of day one', () => {
    const t = at('2026-08-21T14:30:00-04:00');
    expect(t.started).toBe(true);
    expect(t.ended).toBe(false);
  });

  it('is running, not ended, overnight between the two days', () => {
    const t = at('2026-08-22T02:00:00-04:00');
    expect(t.started).toBe(true);
    expect(t.ended).toBe(false);
  });

  it('is still running one minute before the last set could end', () => {
    const t = at('2026-08-22T22:59:00-04:00');
    expect(t.ended).toBe(false);
  });

  it('ends after close on the final day', () => {
    const t = at('2026-08-22T23:01:00-04:00');
    expect(t.started).toBe(true);
    expect(t.ended).toBe(true);
  });

  it('stays ended the following week', () => {
    expect(at('2026-08-29T12:00:00-04:00').ended).toBe(true);
  });
});

describe('the festival day does not end at midnight', () => {
  it('the small hours after the last night are not a festival day', () => {
    // 00:30 the morning after the FINAL day. getNow reports no festival day,
    // so the clock used to fall back to a day-one NOON simulation labelled
    // "Previewing Friday" — right when you're in a dark metro queue trying to
    // find people. useFestivalClock now looks back a day instead.
    const last = EVENT.days[EVENT.days.length - 1].date;
    const [y, m, d] = last.split('-').map(Number);
    const afterMidnight = new Date(Date.UTC(y, m - 1, d + 1, 4, 30)); // 00:30 ET
    expect(getNow(afterMidnight).day).toBeNull();
    expect(getNow(afterMidnight).minutes).toBe(30);

    // …and the previous calendar day, which is what the clock falls back to.
    // 'sunday' is the final day's LEGACY STORAGE ID (it renders as
    // "Saturday" here) — see the day-token comment in config/event.ts.
    const nightBefore = new Date(afterMidnight.getTime() - 24 * 60 * 60 * 1000);
    expect(getNow(nightBefore).day).toBe('sunday');
  });
});

// This flag strips the public app down to a thank-you, the band list and a
// tip link. A false positive takes the map away from someone still on the
// island — Parc Jean-Drapeau empties through the metro for 45–60 minutes
// after close, which is exactly when the map is needed — so the boundary is
// close + 180 min on the FINAL day, pinned in festival-local time. EDT is
// UTC-4; the final day closes 23:00 Sat, so wind-down is 02:00 Sun.
describe('windDownStarted', () => {
  const at = (iso: string) => windDownStarted(new Date(iso));

  it('is false all through the first day', () => {
    expect(at('2026-08-21T22:45:00-04:00')).toBe(false);
    expect(at('2026-08-21T23:59:00-04:00')).toBe(false);
  });

  it('does not fire off the FIRST night close — only the final day counts', () => {
    // Friday also closes 23:00, so Friday close + 180 min is 02:00 Saturday.
    // An implementation deriving from the wrong day would delete the app to a
    // thank-you page between the two festival days.
    expect(at('2026-08-21T23:30:00-04:00')).toBe(false); // Fri, after close
    expect(at('2026-08-22T02:30:00-04:00')).toBe(false); // Fri close + 3.5 h
  });

  it('is false through the final day, close, and the egress window', () => {
    expect(at('2026-08-22T11:00:00-04:00')).toBe(false);
    expect(at('2026-08-22T23:30:00-04:00')).toBe(false); // out past close, map alive
    expect(at('2026-08-23T01:59:00-04:00')).toBe(false); // close + 179 min
  });

  it('is true from three hours after the final close', () => {
    expect(at('2026-08-23T02:00:00-04:00')).toBe(true); // close + 180 min, exact
    expect(at('2026-08-23T02:01:00-04:00')).toBe(true); // close + 181 min
  });

  it('reads the boundary in festival time, not UTC', () => {
    // 02:00 EDT Sunday is 06:00Z. An implementation that compared UTC clock
    // time would fire this at 22:00 Saturday local — an hour before close.
    expect(at('2026-08-22T22:00:00-04:00')).toBe(false);
    expect(at('2026-08-23T06:00:00Z')).toBe(true);
  });

  it('stays wound down afterwards', () => {
    expect(at('2026-08-23T09:00:00-04:00')).toBe(true);
    expect(at('2026-12-01T09:00:00-05:00')).toBe(true);
  });
});

// Rendered date lines are derived from EVENT.days (string-ban rule: no
// hardcoded weekday or month in JSX). These pins re-anchor per fork, like the
// date fixtures above.
describe('derived date display', () => {
  it('festivalDateRange follows EVENT.days', () => {
    expect(festivalDateRange()).toBe('August 21–22, 2026');
  });

  it('festivalDaysLine renders labels, not day ids', () => {
    // Ids are storage tokens ('saturday' = Friday here); labels must win.
    expect(festivalDaysLine('short')).toBe('Fri Aug 21 & Sat Aug 22');
    expect(festivalDaysLine('long')).toBe('Friday August 21 & Saturday August 22, 2026');
  });
});
