import { Player } from '@/data/players';
import { playMatch } from '@/lib/matchEngine';
import { selectTeams, generateSchedule, LaverCupMatch } from '@/components/LaverCupView';

const getPlayerById = (players: Player[], id: number): Player | undefined =>
  players.find(p => p.id === id);

// Composite doubles "player" for match simulation — mirrors LaverCupView's own (private)
// createDoublesPlayer so simulated doubles matches resolve identically to the interactive flow.
const createDoublesPlayer = (p1: Player, p2: Player): Player => ({
  ...p1,
  id: -(p1.id * 1000 + p2.id),
  name: `${p1.name.split(' ').pop()}/${p2.name.split(' ').pop()}`,
  fictionalRanking: Math.round((p1.fictionalRanking + p2.fictionalRanking) / 2),
  officialRanking: Math.round((p1.officialRanking + p2.officialRanking) / 2),
});

/**
 * Fully auto-resolves a Laver Cup edition (team selection, 12-match schedule, every match played
 * against the CPU engine) without any UI interaction — used when the player skips the Laver Cup
 * week without opening its bracket. Returns null only in the (practically unreachable, given the
 * ~500-player pool) case where one team can't be filled to size.
 */
export function autoResolveLaverCup(players: Player[]): {
  winnerName: string;
  runnerUpName: string;
  winnerId: number;
  runnerUpId: number;
} | null {
  const { europe, world } = selectTeams(players);
  if (europe.length < 6 || world.length < 6) return null;

  const europeIds = europe.map(p => p.id);
  const worldIds = world.map(p => p.id);
  const matches: LaverCupMatch[] = generateSchedule(europeIds, worldIds);

  let europeScore = 0;
  let worldScore = 0;

  for (const match of matches) {
    let p1: Player | undefined;
    let p2: Player | undefined;
    if (match.isDoubles) {
      const e1 = getPlayerById(players, match.europePlayer1Id);
      const e2 = getPlayerById(players, match.europePlayer2Id!);
      const w1 = getPlayerById(players, match.worldPlayer1Id);
      const w2 = getPlayerById(players, match.worldPlayer2Id!);
      if (!e1 || !e2 || !w1 || !w2) continue;
      p1 = createDoublesPlayer(e1, e2);
      p2 = createDoublesPlayer(w1, w2);
    } else {
      p1 = getPlayerById(players, match.europePlayer1Id);
      p2 = getPlayerById(players, match.worldPlayer1Id);
    }
    if (!p1 || !p2) continue;

    const result = playMatch(p1, p2, 3, 'Hard');
    const europeWon = result.winner.id === p1.id;
    if (europeWon) europeScore += match.pointValue;
    else worldScore += match.pointValue;
  }

  const europeWinsOverall = europeScore > worldScore;
  return {
    winnerName: europeWinsOverall ? 'Team Europe' : 'Team World',
    runnerUpName: europeWinsOverall ? 'Team World' : 'Team Europe',
    winnerId: europeWinsOverall ? europeIds[0] : worldIds[0],
    runnerUpId: europeWinsOverall ? worldIds[0] : europeIds[0],
  };
}
