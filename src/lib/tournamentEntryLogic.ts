import { Player, TournamentCategory } from "@/data/players";

// Entry probabilities by ranking tier and tournament category
// Returns probability (0-1) that a player will enter
const getEntryProbability = (
  ranking: number,
  category: TournamentCategory
): number => {
  switch (category) {
    case "Grand Slam":
      if (ranking <= 32) return 0.98;
      if (ranking <= 50) return 0.95;
      if (ranking <= 100) return 0.90;
      return 0.85;

    case "Masters 1000":
      if (ranking <= 10) return 0.95;
      if (ranking <= 20) return 0.90;
      if (ranking <= 50) return 0.85;
      if (ranking <= 100) return 0.80;
      return 0.70;

    case "ATP 500":
      if (ranking <= 10) return 0.50;
      if (ranking <= 20) return 0.65;
      if (ranking <= 50) return 0.80;
      if (ranking <= 100) return 0.90;
      return 0.95;

    case "ATP 250":
      if (ranking <= 10) return 0.15;
      if (ranking <= 20) return 0.30;
      if (ranking <= 50) return 0.50;
      if (ranking <= 100) return 0.85;
      return 0.95;

    case "ATP Finals":
      return ranking <= 8 ? 1.0 : 0;

    case "Laver Cup":
      return ranking <= 12 ? 0.85 : 0;

    default:
      return 0.5;
  }
};

// Get number of wild cards by tournament category
const getWildCardCount = (category: TournamentCategory): number => {
  switch (category) {
    case "Grand Slam": return 8;
    case "Masters 1000": return 4;
    case "ATP 500": return 3;
    case "ATP 250": return 3;
    default: return 0;
  }
};

// Map tournament country name to player countryCode
const getCountryCodeFromCountry = (country: string): string | null => {
  const map: Record<string, string> = {
    "Australia": "AUS",
    "France": "FRA",
    "Spain": "ESP",
    "Italy": "ITA",
    "USA": "USA",
    "Great Britain": "GBR",
    "Germany": "GER",
    "Netherlands": "NED",
    "Canada": "CAN",
    "China": "CHN",
    "Japan": "JPN",
    "Austria": "AUT",
    "Monaco": "MON",
    "Qatar": "QAT",
    "UAE": "ARE",
    "Chile": "CHI",
    "Argentina": "ARG",
    "Brazil": "BRA",
    "Mexico": "MEX",
    "Romania": "ROU",
    "Morocco": "MAR",
    "Switzerland": "SUI",
    "Sweden": "SWE",
    "Croatia": "CRO",
    "Kazakhstan": "KAZ",
    "Belgium": "BEL",
    "Portugal": "POR",
    "New Zealand": "NZL",
  };
  return map[country] || null;
};

export interface TournamentEntryResult {
  entrants: Player[];
  wildCardIds: Set<number>;
}

// Select tournament entrants including wild cards
export const selectTournamentEntrants = (
  players: Player[],
  category: TournamentCategory,
  playerLimit: number,
  tournamentCountry?: string
): TournamentEntryResult => {
  const availablePlayers = players.filter(p => !p.injured);
  const sortedPlayers = [...availablePlayers].sort(
    (a, b) => a.officialRanking - b.officialRanking
  );

  const entrants: Player[] = [];
  const wildCardIds = new Set<number>();
  const wcCount = getWildCardCount(category);
  const countryCode = tournamentCountry ? getCountryCodeFromCountry(tournamentCountry) : null;

  // Reserve spots for wild cards
  const mainDrawLimit = playerLimit - wcCount;

  // Fill main draw by ranking + probability
  for (const player of sortedPlayers) {
    if (entrants.length >= mainDrawLimit) break;
    const probability = getEntryProbability(player.officialRanking, category);
    if (Math.random() < probability) {
      entrants.push(player);
    }
  }

  // Fill remaining main draw spots if needed
  if (entrants.length < mainDrawLimit) {
    const remaining = sortedPlayers.filter(p => !entrants.includes(p));
    entrants.push(...remaining.slice(0, mainDrawLimit - entrants.length));
  }

  // Select wild cards
  const alreadyIn = new Set(entrants.map(p => p.id));
  const wcCandidates: Player[] = [];

  // 1) Country-based wild cards: players from tournament country not already in draw
  if (countryCode) {
    const countryPlayers = sortedPlayers
      .filter(p => p.countryCode === countryCode && !alreadyIn.has(p.id))
      .slice(0, Math.ceil(wcCount * 0.6)); // ~60% of WCs go to host country
    wcCandidates.push(...countryPlayers);
  }

  // 2) Fictional ranking wild cards: players with good fictional ranking but low official ranking
  const fictionalWCs = sortedPlayers
    .filter(p => !alreadyIn.has(p.id) && !wcCandidates.some(wc => wc.id === p.id))
    .filter(p => p.fictionalRanking < p.officialRanking * 0.6) // fictional rank much better than official
    .sort((a, b) => a.fictionalRanking - b.fictionalRanking)
    .slice(0, wcCount - wcCandidates.length);
  wcCandidates.push(...fictionalWCs);

  // 3) Fill remaining WC spots with random lower-ranked players from host country or nearby rankings
  if (wcCandidates.length < wcCount) {
    const remaining = sortedPlayers
      .filter(p => !alreadyIn.has(p.id) && !wcCandidates.some(wc => wc.id === p.id));
    
    // Prefer host country players
    const hostRemaining = countryCode 
      ? remaining.filter(p => p.countryCode === countryCode) 
      : [];
    const otherRemaining = remaining.filter(p => !hostRemaining.includes(p));
    
    const fillPool = [...hostRemaining, ...otherRemaining];
    wcCandidates.push(...fillPool.slice(0, wcCount - wcCandidates.length));
  }

  // Add wild cards to entrants
  const finalWCs = wcCandidates.slice(0, wcCount);
  for (const wc of finalWCs) {
    entrants.push(wc);
    wildCardIds.add(wc.id);
  }

  return { entrants, wildCardIds };
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
    case "Laver Cup":
      return "Team Europe vs Team World - Top 6 per team";
    default:
      return "Various players";
  }
};
