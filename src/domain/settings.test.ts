import { describe, it, expect } from 'vitest';
import { mergeSettings, DEFAULT_SETTINGS } from './settings';
import type { TipId } from './types';

/**
 * Dismissals are forever — that's the promise every one-time surface makes
 * ("one tap to dismiss, never returns"). The store's dismissTip appends to
 * dismissedTips and writes settings; what this suite pins is the other half
 * of the round trip: hydration must hand a stored dismissal back intact, on
 * every load, including loads from a device that saved settings before the
 * tip in question existed. The full in-browser path (dismiss -> IndexedDB ->
 * re-render) is driven by scripts/verify-e2e.mjs.
 */
describe('mergeSettings — dismissedTips round-trip', () => {
  it('a fresh install has dismissed nothing', () => {
    expect(mergeSettings(undefined).dismissedTips).toEqual([]);
    expect(DEFAULT_SETTINGS.dismissedTips).toEqual([]);
  });

  it('a stored dismissal survives hydration', () => {
    const stored: TipId[] = ['post-import-thanks'];
    expect(mergeSettings({ dismissedTips: stored }).dismissedTips).toEqual([
      'post-import-thanks',
    ]);
  });

  it('dismissals accumulate rather than replace each other', () => {
    const stored: TipId[] = ['wrap-up', 'post-import-thanks', 'board-code'];
    const merged = mergeSettings({ dismissedTips: stored });
    expect(merged.dismissedTips).toContain('post-import-thanks');
    expect(merged.dismissedTips).toHaveLength(3);
  });

  it('settings saved before a tip existed still hydrate (no crash, no ghost dismissal)', () => {
    // A device that stored settings before dismissedTips existed at all:
    const ancient = mergeSettings({ activeUserId: 'alex' } as Partial<typeof DEFAULT_SETTINGS>);
    expect(ancient.dismissedTips).toEqual([]);
  });
});
