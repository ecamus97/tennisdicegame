import { Tournament, Player } from '@/data/players';
import { playMatch } from '@/lib/matchEngine';
import { getEligibleRankingRange, getCountryCodeFromCountry, getAdjustedEntryProbability } from '@/lib/tournamentEntryLogic';

// The career player's id (mirrors CAREER_PLAYER_ID in careerData.ts). Kept as a local literal
// instead of importing careerData.ts here so this module stays usable from Tour mode (which has
// no career player and no ids that collide with it).
const CAREER_PLAYER_ID = -1;

// Helper: get round name from remaining players
export function getRoundNameFromCount(playersInRound: number): string {
  if (playersInRound <= 1) return 'Final';
  if (playersInRound === 2) return 'Final';
  if (playersInRound <= 4) return 'Semifinal';
  if (playersInRound <= 8) return 'Quarterfinal';
  if (playersInRound <= 16) return 'R16';
  if (playersInRound <= 32) return 'R32';
  if (playersInRound <= 64) return 'R64';
  return 'R128';
}

export function getPointsForRoundByName(tournament: Tournament, round: string): number {
  switch (round) {
    case 'Final': return tournament.points.finalist;
    case 'Semifinal': return tournament.points.sf;
    case 'Quarterfinal': return tournament.points.qf;
    case 'R16': return tournament.points.r16;
    case 'R32': return tournament.points.r32;
    case 'R64': return tournament.points.r64;
    case 'R128': return tournament.points.r128;
    default: return 0;
  }
}

// Auto-simulate a tournament for AI players. Shared between Tour mode and Career mode's
// weekly "skip this tournament" auto-simulation. Davis Cup / Laver Cup / ATP Finals are team/
// bespoke formats and are never resolved through this generic bracket simulator.
export function autoSimulateTournamentBracket(
  tournament: Tournament,
  availablePlayers: Player[],
): { results: { playerId: number; points: number; round: string }[]; winnerId: number; runnerUpId: number; winnerName: string; runnerUpName: string; matchPairs: { winnerId: number; loserId: number }[] } {
  if (['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(tournament.category)) {
    return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '', matchPairs: [] };
  }

  const range = getEligibleRankingRange(tournament.category);
  const homeCC = getCountryCodeFromCountry(tournament.country);
  // Home players can enter even if slightly outside the normal ranking range
  const homeRangeBonus = 40;

  const drawSort = (a: Player, b: Player) => {
    const aHome = homeCC && a.countryCode === homeCC ? 1 : 0;
    const bHome = homeCC && b.countryCode === homeCC ? 1 : 0;
    if (aHome !== bHome) return bHome - aHome;
    return a.officialRanking - b.officialRanking;
  };

  const eligiblePlayers = availablePlayers
    .filter(p => {
      if (p.injured || p.id === CAREER_PLAYER_ID) return false;
      const isHome = homeCC && p.countryCode === homeCC;
      const effectiveMax = isHome ? range.max + homeRangeBonus : range.max;
      return p.officialRanking >= range.min && p.officialRanking <= effectiveMax;
    })
    .sort(drawSort);

  // Apply probabilistic entry so top players don't always fill lower-tier draws
  const probabilisticEntrants: Player[] = [];
  for (const player of eligiblePlayers) {
    if (probabilisticEntrants.length >= tournament.playerLimit) break;
    const prob = getAdjustedEntryProbability(player, tournament.category, tournament.week);
    if (Math.random() < prob) {
      probabilisticEntrants.push(player);
    }
  }

  // Fill remaining spots only from players with a natural affinity for this tier (prob >= 0.4)
  // This prevents top-ranked players who "opted out" from being force-added to lower draws
  if (probabilisticEntrants.length < tournament.playerLimit) {
    const usedIds = new Set(probabilisticEntrants.map(p => p.id));
    const fillPool = eligiblePlayers.filter(
      p => !usedIds.has(p.id) && getAdjustedEntryProbability(p, tournament.category, tournament.week) >= 0.4
    );
    probabilisticEntrants.push(...fillPool.slice(0, tournament.playerLimit - probabilisticEntrants.length));
  }

  // Last resort: fill any remaining spots with any eligible player
  if (probabilisticEntrants.length < tournament.playerLimit) {
    const usedIds = new Set(probabilisticEntrants.map(p => p.id));
    const remaining = eligiblePlayers.filter(p => !usedIds.has(p.id));
    probabilisticEntrants.push(...remaining.slice(0, tournament.playerLimit - probabilisticEntrants.length));
  }

  const entrants = probabilisticEntrants.slice(0, tournament.playerLimit);

  if (entrants.length < 2) return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '', matchPairs: [] };

  // Apply home country advantage: -8 fictional ranking (lower = better)
  const entrantsWithHomeBonus = entrants.map(p =>
    homeCC && p.countryCode === homeCC
      ? { ...p, fictionalRanking: Math.max(1, p.fictionalRanking - 8) }
      : p
  );

  const bestOf = tournament.category === 'Grand Slam' ? 5 : 3;
  let remaining = [...entrantsWithHomeBonus];
  const resultsMap = new Map<number, { points: number; round: string }>();
  let lastLoser: Player | null = null;
  const matchPairs: { winnerId: number; loserId: number }[] = [];

  while (remaining.length > 1) {
    const roundName = getRoundNameFromCount(remaining.length);
    const nextRound: Player[] = [];

    for (let i = 0; i < remaining.length; i += 2) {
      if (i + 1 >= remaining.length) {
        nextRound.push(remaining[i]);
        continue;
      }
      const matchResult = playMatch(remaining[i], remaining[i + 1], bestOf as 3 | 5, tournament.surface);
      nextRound.push(matchResult.winner);
      lastLoser = matchResult.loser;
      matchPairs.push({ winnerId: matchResult.winner.id, loserId: matchResult.loser.id });

      const pts = getPointsForRoundByName(tournament, roundName);
      resultsMap.set(matchResult.loser.id, { points: pts, round: roundName });
    }
    remaining = nextRound;
  }

  const winner = remaining[0];
  resultsMap.set(winner.id, { points: tournament.points.winner, round: 'Winner' });

  return {
    results: Array.from(resultsMap.entries()).map(([playerId, r]) => ({ playerId, ...r })),
    winnerId: winner.id,
    runnerUpId: lastLoser?.id || 0,
    winnerName: winner.name,
    runnerUpName: lastLoser?.name || '',
    matchPairs,
  };
}
