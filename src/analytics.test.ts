import { describe, it, expect } from 'vitest';
import { launchBeacons, analyticsEnabled, EMPTY_BEACON_STATE } from './analytics';

// The delivery side (IndexedDB queue + fetch) is exercised by the e2e pass;
// what's unit-tested here is the gating that makes the numbers mean anything:
// install is once EVER, standalone-launch is once per day, and an empty site
// code (or localhost) switches the whole thing off.

describe('launchBeacons', () => {
  it('queues /install exactly once, ever', () => {
    const first = launchBeacons(EMPTY_BEACON_STATE, false, '2026-08-21');
    expect(first.queue).toEqual(['/install']);
    expect(first.installQueued).toBe(true);

    // Relaunch the same day — still queued from an offline first launch —
    // and again a week later after delivery: never a second /install.
    expect(launchBeacons(first, false, '2026-08-21').queue).toEqual(['/install']);
    expect(launchBeacons({ ...first, queue: [] }, false, '2026-08-28').queue).toEqual([]);
  });

  it('counts a standalone launch once per local day, and only standalone ones', () => {
    const installed = { ...EMPTY_BEACON_STATE, installQueued: true };
    // A plain browser-tab visit is not a standalone launch.
    expect(launchBeacons(installed, false, '2026-08-21').queue).toEqual([]);

    const day1 = launchBeacons(installed, true, '2026-08-21');
    expect(day1.queue).toEqual(['/standalone-launch']);
    // Second standalone launch the same day: nothing new.
    expect(launchBeacons(day1, true, '2026-08-21').queue).toEqual(['/standalone-launch']);
    // Next day: counts again.
    expect(launchBeacons({ ...day1, queue: [] }, true, '2026-08-22').queue).toEqual([
      '/standalone-launch',
    ]);
  });

  it('a first-ever standalone launch earns both beacons', () => {
    const st = launchBeacons(EMPTY_BEACON_STATE, true, '2026-08-21');
    expect(st.queue).toEqual(['/install', '/standalone-launch']);
  });
});

describe('analyticsEnabled', () => {
  it('an empty site code disables everything, everywhere', () => {
    expect(analyticsEnabled('', 'robcdownie.github.io')).toBe(false);
    expect(analyticsEnabled('', 'localhost')).toBe(false);
  });

  it('a real site code still never counts dev servers or the e2e harness', () => {
    expect(analyticsEnabled('warpedmtl', 'localhost')).toBe(false);
    expect(analyticsEnabled('warpedmtl', '127.0.0.1')).toBe(false);
    expect(analyticsEnabled('warpedmtl', '[::1]')).toBe(false);
    expect(analyticsEnabled('warpedmtl', 'robcdownie.github.io')).toBe(true);
  });
});
