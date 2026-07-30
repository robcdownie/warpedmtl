import { describe, it, expect } from 'vitest';
import { stageNowNext } from './stageNow';
import type { OfficialStatus, Performance, PerformanceType } from './types';

const BUFFER = 10;

function perf(
  id: string,
  start: string | null,
  end: string | null = null,
  stageId = 's1',
  extra: Partial<{ day: Performance['day']; type: PerformanceType; officialStatus: OfficialStatus }> = {},
): Performance {
  return {
    id,
    artistId: id,
    type: extra.type ?? 'main',
    day: extra.day === undefined ? 'saturday' : extra.day,
    stageId,
    startTime: start,
    endTime: end,
    estimatedEndTime: null,
    scheduleStatus: 'scheduled',
    officialStatus: extra.officialStatus ?? 'confirmed',
  };
}

const min = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

describe('stageNowNext — who is on this stage, who is next (F1)', () => {
  it('mid-set with an exact end: a hard "on" claim', () => {
    const bill = [perf('a', '15:00', '15:40')];
    const r = stageNowNext('s1', 'saturday', min('15:10'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('a');
    expect(r.now?.state).toBe('on');
    expect(r.now?.end.kind).toBe('exact');
    expect(r.next).toBeNull();
  });

  it('is on from the first minute, and off at the exact end minute', () => {
    const bill = [perf('a', '15:00', '15:40')];
    expect(stageNowNext('s1', 'saturday', min('15:00'), bill, BUFFER).now?.state).toBe('on');
    expect(stageNowNext('s1', 'saturday', min('14:59'), bill, BUFFER).now).toBeNull();
    expect(stageNowNext('s1', 'saturday', min('15:40'), bill, BUFFER).now).toBeNull();
  });

  it('an exact end is never hedged — no "likely done" after a hard finish', () => {
    const bill = [perf('a', '15:00', '15:40')];
    const r = stageNowNext('s1', 'saturday', min('15:41'), bill, BUFFER);
    expect(r.now).toBeNull();
  });

  it('mid-set on an assumed end: on, with the est-class end exposed for the est. affordance', () => {
    const bill = [perf('a', '15:00')]; // no end entered → assumed 15:30
    const r = stageNowNext('s1', 'saturday', min('15:15'), bill, BUFFER);
    expect(r.now?.state).toBe('on');
    expect(r.now?.end.kind).toBe('assumed');
    expect(r.now?.end.hhmm).toBe('15:30');
  });

  it('past an assumed end the register softens to likely-done, not a hard claim', () => {
    const bill = [perf('a', '15:00')];
    const r = stageNowNext('s1', 'saturday', min('15:31'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('a');
    expect(r.now?.state).toBe('likely-done');
  });

  it('likely-done decays after one further typical set length', () => {
    const bill = [perf('a', '15:00')]; // assumed end 15:30, grace to 16:00
    expect(stageNowNext('s1', 'saturday', min('15:59'), bill, BUFFER).now?.state).toBe('likely-done');
    expect(stageNowNext('s1', 'saturday', min('16:00'), bill, BUFFER).now).toBeNull();
  });

  it('the grace derives from the slot: a late set gets the late length', () => {
    const bill = [perf('a', '17:00')]; // late slot → assumed 50 min → end 17:50, grace to 18:40
    expect(stageNowNext('s1', 'saturday', min('18:39'), bill, BUFFER).now?.state).toBe('likely-done');
    expect(stageNowNext('s1', 'saturday', min('18:40'), bill, BUFFER).now).toBeNull();
  });

  it('a gap between sets: likely-done for the last act, next act still offered', () => {
    const bill = [perf('a', '15:00'), perf('b', '15:45')]; // a assumed to 15:30
    const r = stageNowNext('s1', 'saturday', min('15:32'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('a');
    expect(r.now?.state).toBe('likely-done');
    expect(r.next?.perf.id).toBe('b');
    expect(r.next?.startMinute).toBe(min('15:45'));
  });

  it('the moment the next set starts, it is simply ON — no leftover register', () => {
    const bill = [perf('a', '15:00'), perf('b', '15:45')];
    const r = stageNowNext('s1', 'saturday', min('15:45'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('b');
    expect(r.now?.state).toBe('on');
    expect(r.next).toBeNull();
  });

  it('a turnover-estimated end behaves like any est-class end', () => {
    // b at 15:20 caps a's end at 15:10 (estimated). Past 15:10 but before b: likely-done.
    const bill = [perf('a', '15:00'), perf('b', '15:20')];
    const during = stageNowNext('s1', 'saturday', min('15:05'), bill, BUFFER);
    expect(during.now?.state).toBe('on');
    expect(during.now?.end.kind).toBe('estimated');
    expect(during.next?.perf.id).toBe('b');
    const between = stageNowNext('s1', 'saturday', min('15:12'), bill, BUFFER);
    expect(between.now?.perf.id).toBe('a');
    expect(between.now?.state).toBe('likely-done');
  });

  it('before the first set: no now, only next', () => {
    const bill = [perf('a', '15:00'), perf('b', '16:00')];
    const r = stageNowNext('s1', 'saturday', min('12:00'), bill, BUFFER);
    expect(r.now).toBeNull();
    expect(r.next?.perf.id).toBe('a');
  });

  it('a stage with no timed sets says nothing — unknown is not a quiet stage', () => {
    const bill = [perf('a', null), perf('b', null)];
    const r = stageNowNext('s1', 'saturday', min('15:00'), bill, BUFFER);
    expect(r.now).toBeNull();
    expect(r.next).toBeNull();
  });

  it('other days and other stages never bleed in', () => {
    const bill = [
      perf('sun', '15:00', null, 's1', { day: 'sunday' }),
      perf('s2-set', '15:00', null, 's2'),
      perf('dayless', '15:00', null, 's1', { day: null }),
    ];
    const r = stageNowNext('s1', 'saturday', min('15:10'), bill, BUFFER);
    expect(r.now).toBeNull();
    expect(r.next).toBeNull();
  });

  it('cancelled and removed rows are never claimed, as now or as next', () => {
    const bill = [
      perf('gone', '15:00', null, 's1', { officialStatus: 'canceled' }),
      perf('never', '16:00', null, 's1', { officialStatus: 'removed' }),
    ];
    const r = stageNowNext('s1', 'saturday', min('15:10'), bill, BUFFER);
    expect(r.now).toBeNull();
    expect(r.next).toBeNull();
  });

  it('unplugged sets count — the unplugged stage answers for its own bill', () => {
    const bill = [perf('acoustic', '15:00', null, 'warped-unplugged-stage', { type: 'unplugged' })];
    const r = stageNowNext('warped-unplugged-stage', 'saturday', min('15:10'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('acoustic');
  });

  it('overlapping entered data: the later start wins the "on" claim', () => {
    const bill = [perf('a', '15:00', '16:00'), perf('b', '15:30', '16:00')];
    const r = stageNowNext('s1', 'saturday', min('15:45'), bill, BUFFER);
    expect(r.now?.perf.id).toBe('b');
    expect(r.now?.state).toBe('on');
  });

  it('next is the first future start, not just any future start', () => {
    const bill = [perf('a', '15:00'), perf('c', '18:00'), perf('b', '16:00')];
    const r = stageNowNext('s1', 'saturday', min('15:05'), bill, BUFFER);
    expect(r.next?.perf.id).toBe('b');
  });
});
