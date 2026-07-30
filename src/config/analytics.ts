// Cookieless counting — GoatCounter (goatcounter.com). No cookies, no
// fingerprinting, no personal data; the About screen discloses it the moment
// a site code exists. Two things key off this constant:
//
//   1. The count.js <script> tag — injected into index.html AT BUILD TIME by
//      the goatcounter-snippet plugin in vite.config.ts.
//   2. The launch/import beacons in src/analytics.ts.
//
// PLACEHOLDER — Robbie creates the free GoatCounter account (1 min) and
// pastes the site code; empty string = analytics fully disabled, zero
// requests. The site code is the subdomain on the dashboard URL:
// https://<site-code>.goatcounter.com
//
// Typed `string`, not the literal '', so the gating branches ("is a code
// set?") stay live code to the compiler instead of statically-dead ones.
export const GOATCOUNTER_SITE_CODE: string = '';
