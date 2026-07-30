// Main lineup — day id 'saturday' = FRIDAY Aug 21 (see the day-token warning
// in config/event.ts; ids are storage tokens, labels render).
//
// Empty on purpose. Montréal's official day split is unpublished, and this
// instance refuses to ship another city's bands as if they were the bill —
// the built-bundle string ban in scripts/verify-e2e.mjs enforces it. The
// staged fill lands here the day the split drops; the procedure and the
// normalized 81-act list live in festival-blueprint/montreal/lineup-staging.md.
export const SATURDAY_ARTISTS: string[] = [];
