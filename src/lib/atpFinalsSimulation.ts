import { Player, Surface } from '@/data/players';
import { playMatch } from '@/lib/matchEngine';
import { generateGroupMatches, calculateStandings, GroupMatch } from '@/components/ATPFinalsView';

/** Top 8 by live race points — mirrors CurrentWeekView's ATP Finals entrant selection exactly. */
export function selectATPFinalsEntrants(players: Player[]): Player[] {
  const entrants = players
    .filter(p => !p.injured)
    .sort((a, b) => b.livePoints - a.livePoints)
    .slice(0, 8);
  if (entrants.length < 8) {
    const extras = players
      .filter(p => p.injured && !entrants.some(e => e.id === p.id))
      .sort((a, b) => b.livePoints - a.livePoints)
      .slice(0, 8 - entrants.length);
    entrants.push(...extras);
  }
  return entrants;
}

/**
 * Fully auto-resolves the ATP Finals (group assignment, round-robin group stage, semifinals,
 * final) without any UI interaction — used when the player skips the ATP Finals week without
 * opening its bracket. Mirrors ATPFinalsView's own group-stage generation, standings and
 * point-award logic exactly. Returns null if fewer than 8 eligible players exist.
 */
export function autoResolveATPFinals(players: Player[], surface: Surface = 'Hard'): {
  results: { playerId: number; points: number; round: string }[];
  winnerId: number;
  runnerUpId: number;
  winnerName: string;
  runnerUpName: string;
} | null {
  const entrants = selectATPFinalsEntrants(players);
  if (entrants.length < 8) return null;

  // Sort by live race (or official points fallback), same comparator ATPFinalsView uses.
  const sorted = [...entrants].sort((a, b) => {
    const aRank = a.livePoints > 0 ? a.livePoints : a.points;
    const bRank = b.livePoints > 0 ? b.livePoints : b.points;
    return bRank - aRank;
  });

  const groupA: Player[] = [];
  const groupB: Player[] = [];
  for (let i = 0; i < 8; i += 2) {
    const player1 = sorted[i];
    const player2 = sorted[i + 1];
    if (Math.random() < 0.5) {
      groupA.push(player1);
      groupB.push(player2);
    } else {
      groupA.push(player2);
      groupB.push(player1);
    }
  }

  const playMatchBestOf3 = (p1: Player, p2: Player) => playMatch(p1, p2, 3, surface);

  const playGroup = (groupPlayers: Player[], groupName: string): GroupMatch[] =>
    generateGroupMatches(groupPlayers, groupName).map(m => ({ ...m, result: playMatchBestOf3(m.player1, m.player2) }));

  const groupAMatches = playGroup(groupA, 'A');
  const groupBMatches = playGroup(groupB, 'B');

  const groupAStandings = calculateStandings(groupA, groupAMatches);
  const groupBStandings = calculateStandings(groupB, groupBMatches);

  const a1 = groupAStandings[0].player;
  const a2 = groupAStandings[1].player;
  const b1 = groupBStandings[0].player;
  const b2 = groupBStandings[1].player;

  // Cross semifinals: A1 vs B2, B1 vs A2
  const sf1 = playMatchBestOf3(a1, b2);
  const sf2 = playMatchBestOf3(b1, a2);

  const final = playMatchBestOf3(sf1.winner, sf2.winner);
  const winner = final.winner;
  const finalist = final.loser;

  const results: { playerId: number; points: number; round: string }[] = [];
  [...groupAStandings, ...groupBStandings].forEach(standing => {
    const groupPoints = standing.wins * 200;
    if (groupPoints > 0) {
      results.push({ playerId: standing.player.id, points: groupPoints, round: 'Group Stage' });
    }
  });
  results.push({ playerId: sf1.winner.id, points: 400, round: 'Semifinal' });
  results.push({ playerId: sf2.winner.id, points: 400, round: 'Semifinal' });
  results.push({ playerId: winner.id, points: 500, round: 'Champion' });

  const aggregated = results.reduce((acc, r) => {
    const existing = acc.find(a => a.playerId === r.playerId);
    if (existing) existing.points += r.points;
    else acc.push({ ...r });
    return acc;
  }, [] as { playerId: number; points: number; round: string }[]);

  aggregated.forEach(r => {
    if (r.playerId === winner.id) r.round = 'Champion';
    else if (r.playerId === finalist.id) r.round = 'Finalist';
    else if (r.points >= 400) r.round = 'Semifinalist';
    else r.round = 'Group Stage';
  });

  return {
    results: aggregated,
    winnerId: winner.id,
    runnerUpId: finalist.id,
    winnerName: winner.name,
    runnerUpName: finalist.name,
  };
}
