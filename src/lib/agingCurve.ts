/**
 * Season-to-season aging curve for a player's fictional ranking (their hidden true skill level —
 * see matchEngine.ts). Real tennis careers develop toward a peak in the mid-to-late twenties and
 * decline afterward; without this, a generated player's fictional ranking was set once at
 * creation and never moved again no matter how old they got. Applied once per player at each
 * season transition (when `age` increments), in both Tour mode (useGameState.ts) and Career mode
 * (useCareerState.ts).
 *
 * Fictional ranking is lower-is-better, so "improving" means a negative delta and "declining"
 * means a positive one.
 */

/** How much a player's fictional ranking shifts this season, based on the age they're turning. */
export function getAgingFictionalRankingDelta(newAge: number): number {
  if (newAge <= 19) return -8;
  if (newAge <= 21) return -6;
  if (newAge <= 23) return -4;
  if (newAge === 24) return -2;
  if (newAge >= 25 && newAge <= 31) return 0; // peak window: fictional ranking holds steady
  if (newAge === 32) return 2;
  if (newAge === 33) return 4;
  if (newAge === 34) return 6;
  if (newAge === 35) return 9;
  if (newAge === 36) return 13;
  if (newAge === 37) return 17;
  return 22; // 38+: sharp late-career decline
}

/** Applies one season's worth of aging to a fictional ranking, with a little random noise so
 * players of the same age don't all move in perfect lockstep. Clamped to a sane [1, 999] range. */
export function applyAgingToFictionalRanking(fictionalRanking: number, newAge: number): number {
  const delta = getAgingFictionalRankingDelta(newAge);
  const noise = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(1, Math.min(999, Math.round(fictionalRanking + delta + noise)));
}
