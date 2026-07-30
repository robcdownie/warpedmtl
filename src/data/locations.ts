import type { MapLocation } from '@/domain/types';

// Named check-in / meetup destinations (spec §15). Montréal's vendor village,
// bars, and activations are unannounced, so the only named pin that ships is
// the one thing every festival has: the way in. Travel math falls back to it
// before a first set (config/event.ts ENTRANCE_LOCATION_ID), which is why it
// cannot wait for the real site layout. Everything else arrives by
// coordinates code; the starter position is correctable in calibration mode
// like any other pin.
export const NAMED_LOCATIONS: MapLocation[] = [
  {
    id: 'parc-jean-drapeau-entrance',
    name: 'Parc Jean-Drapeau Entrance',
    shortName: 'Entrance',
    category: 'entrance',
    xPercent: 50,
    yPercent: 88,
  },
];
