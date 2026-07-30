// Cookieless counting — GoatCounter (goatcounter.com). No cookies, no
// fingerprinting, no personal data; the About screen discloses it the moment
// a site code exists. Two things key off this constant:
//
//   1. The count.js <script> tag — injected into index.html AT BUILD TIME by
//      the goatcounter-snippet plugin in vite.config.ts.
//   2. The launch/import beacons in src/analytics.ts.
//
// Set 2026-07-30. Dashboard: https://robbied.goatcounter.com
// Empty string would disable analytics entirely — zero requests.
//
// Typed `string`, not the literal '', so the gating branches ("is a code
// set?") stay live code to the compiler instead of statically-dead ones.
export const GOATCOUNTER_SITE_CODE: string = 'robbied';
