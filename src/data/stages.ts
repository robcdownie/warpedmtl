import type { MapLocation } from '@/domain/types';

// Montréal's stage names are unannounced, so the eight main stages ship as
// numbered placeholders spread across the reference layout — honest about
// knowing nothing rather than confident about another city's sponsors. Real
// names and positions arrive by coordinates code (imports match by id, and
// both adds and renames propagate), so 'stage-1' can become the real thing
// without stranding anyone's plan.
//
// Warped Unplugged keeps its id and name: the Montréal roster is unconfirmed,
// but the stage is a fixture of the tour and board entry pins unplugged sets
// to this exact id.
export const STAGES: MapLocation[] = [
  {
    id: 'warped-unplugged-stage',
    name: 'Warped Unplugged Stage',
    shortName: 'Unplugged',
    category: 'stage',
    xPercent: 30,
    yPercent: 47,
  },
  {
    id: 'stage-1',
    name: 'Stage 1',
    shortName: 'Stage 1',
    category: 'stage',
    xPercent: 20,
    yPercent: 30,
  },
  {
    id: 'stage-2',
    name: 'Stage 2',
    shortName: 'Stage 2',
    category: 'stage',
    xPercent: 40,
    yPercent: 30,
  },
  {
    id: 'stage-3',
    name: 'Stage 3',
    shortName: 'Stage 3',
    category: 'stage',
    xPercent: 60,
    yPercent: 30,
  },
  {
    id: 'stage-4',
    name: 'Stage 4',
    shortName: 'Stage 4',
    category: 'stage',
    xPercent: 80,
    yPercent: 30,
  },
  {
    id: 'stage-5',
    name: 'Stage 5',
    shortName: 'Stage 5',
    category: 'stage',
    xPercent: 20,
    yPercent: 58,
  },
  {
    id: 'stage-6',
    name: 'Stage 6',
    shortName: 'Stage 6',
    category: 'stage',
    xPercent: 40,
    yPercent: 58,
  },
  {
    id: 'stage-7',
    name: 'Stage 7',
    shortName: 'Stage 7',
    category: 'stage',
    xPercent: 60,
    yPercent: 58,
  },
  {
    id: 'stage-8',
    name: 'Stage 8',
    shortName: 'Stage 8',
    category: 'stage',
    xPercent: 80,
    yPercent: 58,
  },
];

export const STAGE_IDS = STAGES.map((s) => s.id);
