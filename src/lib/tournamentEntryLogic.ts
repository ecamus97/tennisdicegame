import { Player, TournamentCategory } from "@/data/players";

// Entry probabilities by ranking tier and tournament category
// Returns probability (0-1) that a player will enter
const getEntryProbability = (
  ranking: number,
  category: TournamentCategory
): number => {
  switch (category) {
    case "Grand Slam":
      // Almost all top players participate
      if (ranking <= 32) return 0.98;
      if (ranking <= 50) return 0.95;
      if (ranking <= 100) return 0.90;
      return 0.85;

    case "Masters 1000":
      // Most top players participate
      if (ranking <= 10) return 0.95;
      if (ranking <= 20) return 0.90;
      if (ranking <= 50) return 0.85;
      if (ranking <= 100) return 0.80;
      return 0.70;

    case "ATP 500":
      // More top players than 250, but still selective
      if (ranking <= 10) return 0.50;
      if (ranking <= 20) return 0.65;
      if (ranking <= 50) return 0.80;
      if (ranking <= 100) return 0.90;
      return 0.95;

    case "ATP 250":
      // Few top players
      if (ranking <= 10) return 0.15;
      if (ranking <= 20) return 0.30;
      if (ranking <= 50) return 0.50;
      if (ranking <= 100) return 0.85;
      return 0.95;

    case "ATP Finals":
      // Only top 8 qualify
      return ranking <= 8 ? 1.0 : 0;

    default:
      return 0.5;
  }
};

// Select tournament entrants based on category and player rankings
export const selectTournamentEntrants = (
  players: Player[],
  category: TournamentCategory,
  playerLimit: number
): Player[] => {
  // Filter out injured players
  const availablePlayers = players.filter(p => !p.injured);
  
  // Sort by official ranking
  const sortedPlayers = [...availablePlayers].sort(
    (a, b) => a.officialRanking - b.officialRanking
  );

  const entrants: Player[] = [];
  
  // Go through players in ranking order and determine participation
  for (const player of sortedPlayers) {
    if (entrants.length >= playerLimit) break;
    
    const probability = getEntryProbability(player.officialRanking, category);
    
    // Use random check to determine if player enters
    if (Math.random() < probability) {
      entrants.push(player);
    }
  }

  // If we don't have enough players, fill with remaining available players
  if (entrants.length < playerLimit) {
    const remaining = sortedPlayers.filter(p => !entrants.includes(p));
    const needed = playerLimit - entrants.length;
    entrants.push(...remaining.slice(0, needed));
  }

  return entrants;
};

// Get a description of expected field for UI display
export const getFieldDescription = (category: TournamentCategory): string => {
  switch (category) {
    case "Grand Slam":
      return "Almost all top players participate";
    case "Masters 1000":
      return "Most top players participate";
    case "ATP 500":
      return "Several top players participate";
    case "ATP 250":
      return "Few top players, mostly lower-ranked";
    case "ATP Finals":
      return "Top 8 players only";
    default:
      return "Various players";
  }
};
