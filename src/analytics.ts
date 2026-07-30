import { GOATCOUNTER_SITE_CODE } from '@/config/analytics';
import { prodRepo } from '@/db/repo';

/**
 * Anonymous usage beacons, sent to GoatCounter as virtual pageviews.
 *
 * GoatCounter's own script counts page loads, but sessions are not devices,
 * and an offline standalone launch never loads the script at all — so on the
 * only two days that matter the instance would suppress its own numbers
 * (Long Beach measured nothing; that is the lesson). The counts the gate
 * memo actually defines are earned here and queued in IndexedDB until the
 * phone is online:
 *
 *   /install            once EVER per device — the device count
 *   /standalone-launch  once per local day, only when running as an installed app
 *   /crew-import        each selections code that lands at least one pick
 *
 * Everything no-ops when GOATCOUNTER_SITE_CODE is empty, and on localhost —
 * dev servers and the e2e harness must never inflate the live counter. A
 * beacon is a bare GET with a path; it carries nothing that identifies a
 * person, and nothing here ever blocks the UI.
 */

export type BeaconState = {
  /** '/install' has been queued once-ever on this device. */
  installQueued: boolean;
  /** Local day ('YYYY-MM-DD') of the last standalone-launch beacon. */
  standaloneLastDay: string | null;
  /** Beacons earned but not yet delivered (offline when they happened). */
  queue: string[];
};

export const EMPTY_BEACON_STATE: BeaconState = {
  installQueued: false,
  standaloneLastDay: null,
  queue: [],
};

/**
 * Which beacons this launch earns, given what the device already sent. Pure —
 * the once-ever and once-per-day rules live here so they can be unit-tested
 * without a browser. The install flag flips when the beacon is QUEUED, not
 * when it is delivered: the queue survives in IndexedDB, so delivery is
 * eventual, and flipping early is what makes "once ever" hold across
 * offline launches.
 */
export function launchBeacons(st: BeaconState, standalone: boolean, today: string): BeaconState {
  let next = st;
  if (!next.installQueued) {
    next = { ...next, installQueued: true, queue: [...next.queue, '/install'] };
  }
  if (standalone && next.standaloneLastDay !== today) {
    next = { ...next, standaloneLastDay: today, queue: [...next.queue, '/standalone-launch'] };
  }
  return next;
}

/** The kill switches: no site code = fully off; localhost is never counted. */
export function analyticsEnabled(siteCode: string, hostname: string): boolean {
  if (!siteCode) return false;
  return !['localhost', '127.0.0.1', '[::1]'].includes(hostname);
}

function enabled(): boolean {
  return (
    typeof window !== 'undefined' &&
    analyticsEnabled(GOATCOUNTER_SITE_CODE, window.location.hostname)
  );
}

const META_KEY = 'beacons';

async function readState(): Promise<BeaconState> {
  const stored = await prodRepo.getMeta<Partial<BeaconState>>(META_KEY);
  return { ...EMPTY_BEACON_STATE, ...stored };
}

// GoatCounter's pixel endpoint: a GET with the path as a query parameter
// counts one pageview. No cookies, no body, no identity; `rnd` busts caches.
function countUrl(path: string): string {
  const q = new URLSearchParams({ p: path, rnd: String(Date.now()) });
  return `https://${GOATCOUNTER_SITE_CODE}.goatcounter.com/count?${q}`;
}

// Every read-modify-write of the beacon state goes through one promise chain
// so a crew-import landing mid-flush can't lose or double-send a beacon.
let chain: Promise<void> = Promise.resolve();
function serialize(fn: () => Promise<void>): void {
  chain = chain.then(fn, fn).catch(() => {});
}

function flush(): void {
  serialize(async () => {
    if (!navigator.onLine) return;
    let st = await readState();
    while (st.queue.length > 0) {
      try {
        // no-cors: resolves when the request reached the network, rejects
        // offline or ad-blocked — a rejected beacon stays queued for the
        // next launch or 'online' event.
        await fetch(countUrl(st.queue[0]), { mode: 'no-cors' });
      } catch {
        return;
      }
      st = { ...st, queue: st.queue.slice(1) };
      await prodRepo.putMeta(META_KEY, st);
    }
  });
}

/** Boot hook (main.tsx). Earns launch beacons, then tries to deliver the queue. */
export function initAnalytics(): void {
  if (!enabled()) return;
  serialize(async () => {
    const st = await readState();
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // "Per day" means the phone's local day; en-CA formats as YYYY-MM-DD.
    const next = launchBeacons(st, standalone, new Date().toLocaleDateString('en-CA'));
    if (next !== st) await prodRepo.putMeta(META_KEY, next);
  });
  flush();
  window.addEventListener('online', flush);
}

/**
 * Fired by the store when a selections import lands at least one pick on the
 * real database ("crews formed" in the gate memo). Schedule, coordinates and
 * backup imports never call this.
 */
export function trackCrewImport(): void {
  if (!enabled()) return;
  serialize(async () => {
    const st = await readState();
    await prodRepo.putMeta(META_KEY, { ...st, queue: [...st.queue, '/crew-import'] });
  });
  flush();
}
