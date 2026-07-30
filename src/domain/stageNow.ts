import type { DayId, Performance } from './types';
import { hhmmToMinutes } from './time';
import { typicalSetMinutes, withEffectiveEnds, type EffectiveEnd } from './endTimes';

// What a stage's own clock says at a given minute — "who is on, who is next" —
// so a map pin can answer without a tap-through (asked for at Long Beach).
//
// The honesty rules are the usual ones, applied to a stage instead of a person:
//   - Inside a set's effective end, the set is ON. If that end is estimated or
//     assumed, callers must carry the existing `est.` affordance wherever the
//     end itself is rendered — the claim "on now" is fair, the finish time is
//     the guess.
//   - Past an est-class end the set is *probably* over, but nobody measured
//     it: the register is "likely done", never a hard claim. The guess decays:
//     after one further typical set length it stops meaning anything and the
//     stage goes quiet (and once the next set starts, that set is simply ON).
//   - Past an EXACT end there is nothing to hedge — the set is over, no
//     lingering register.
//   - A stage with no timed sets says nothing at all. Unknown is not a free
//     stage, and it is definitely not a quiet one.

export interface StageNowNext {
  /**
   * The set this stage is answering for at `atMinute`. `state: 'on'` is a
   * fair claim (inside the effective end); `'likely-done'` is the softened
   * register for a set past an estimated/assumed end.
   */
  now: { perf: Performance; end: EffectiveEnd; state: 'on' | 'likely-done' } | null;
  /** The next set to start on this stage after `atMinute`, if one is timed. */
  next: { perf: Performance; startMinute: number } | null;
}

/**
 * Pure now/next for one stage. Follows the map's time slider: pass the
 * scrubbed minute and the answer moves with it. Cancelled/removed lineup rows
 * are never claimed — a band that isn't playing can't be "on now".
 */
export function stageNowNext(
  stageId: string,
  day: DayId,
  atMinute: number,
  performances: Performance[],
  turnoverBuffer: number,
): StageNowNext {
  const ends = withEffectiveEnds(performances, turnoverBuffer);
  const sets = performances
    .filter(
      (p) =>
        p.stageId === stageId &&
        p.day === day &&
        !!p.startTime &&
        p.officialStatus !== 'removed' &&
        p.officialStatus !== 'canceled',
    )
    .map((p) => ({ perf: p, start: hhmmToMinutes(p.startTime!) }))
    .sort((a, b) => a.start - b.start);

  const upcoming = sets.find((s) => s.start > atMinute);
  const next = upcoming ? { perf: upcoming.perf, startMinute: upcoming.start } : null;

  // The set whose window covers atMinute. If entered data overlaps, the later
  // start wins — whoever the board says came on last is who's on.
  let on: StageNowNext['now'] = null;
  for (const s of sets) {
    if (s.start > atMinute) break;
    const end = ends.get(s.perf.id);
    if (end?.minutes != null && atMinute < end.minutes) {
      on = { perf: s.perf, end, state: 'on' };
    }
  }
  if (on) return { now: on, next };

  // Nothing provably on. The latest started set may have run past a guessed
  // end — say "likely done" while the guess still means something: up to one
  // further typical set length. (An exact end needs no hedge, and the moment
  // the next set's start arrives that set is ON, so this register never
  // outlives it.)
  const last = [...sets].reverse().find((s) => s.start <= atMinute);
  if (last) {
    const end = ends.get(last.perf.id);
    if (
      end?.minutes != null &&
      (end.kind === 'estimated' || end.kind === 'assumed') &&
      atMinute < end.minutes + typicalSetMinutes(last.start)
    ) {
      return { now: { perf: last.perf, end, state: 'likely-done' }, next };
    }
  }
  return { now: null, next };
}
