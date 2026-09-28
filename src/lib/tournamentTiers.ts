// Processing order for weekly tournament simulation: higher-tier events run first
// so their entrants are locked in before lower-tier draws are generated.
// Shared between Tour mode (useGameState.ts) and Career mode (useCareerState.ts) so both
// auto-simulate skipped weekly tournaments in the same order.
export const TOURNAMENT_TIER_ORDER: Record<string, number> = {
  'Grand Slam': 0, 'Masters 1000': 1, 'ATP 500': 2, 'ATP 250': 3,
  'Challenger 175': 4, 'Challenger 125': 5, 'Challenger 100': 6,
  'Challenger 75': 7, 'Challenger 50': 8, 'ITF M25': 9, 'ITF M15': 10,
};
