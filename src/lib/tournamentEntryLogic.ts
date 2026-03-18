import { Player, TournamentCategory } from "@/data/players";

// Entry probabilities by ranking tier and tournament category
// Returns probability (0-1) that a player will enter
const getEntryProbability = (
  ranking: number,
  category: TournamentCategory
): number => {
  switch (category) {
    case "Grand Slam":
      if (ranking > 130) return 0;
      if (ranking <= 32) return 0.98;
      if (ranking <= 50) return 0.95;
      if (ranking <= 100) return 0.90;
      return 0.85;

    case "Masters 1000":
      if (ranking > 60) return 0;
      if (ranking <= 10) return 0.95;
      if (ranking <= 20) return 0.90;
      if (ranking <= 40) return 0.85;
      return 0.75;

    case "ATP 500":
      if (ranking > 60) return 0;
      if (ranking <= 10) return 0.50;
      if (ranking <= 20) return 0.65;
      if (ranking <= 40) return 0.80;
      return 0.90;

    case "ATP 250":
      if (ranking > 100) return 0;
      if (ranking <= 10) return 0.15;
      if (ranking <= 20) return 0.30;
      if (ranking <= 50) return 0.50;
      return 0.85;

    case "ATP Finals":
      return ranking <= 8 ? 1.0 : 0;

    case "Laver Cup":
      return ranking <= 12 ? 0.85 : 0;

    case "Challenger 175":
      if (ranking < 80 || ranking > 150) return 0;
      return 0.85;

    case "Challenger 125":
      if (ranking < 150 || ranking > 250) return 0;
      return 0.85;

    case "Challenger 100":
      if (ranking < 250 || ranking > 350) return 0;
      return 0.85;

    case "Challenger 75":
      if (ranking < 300 || ranking > 400) return 0;
      return 0.85;

    case "Challenger 50":
      if (ranking < 400 || ranking > 500) return 0;
      return 0.85;

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
    case "Challenger 175":
    case "Challenger 125":
    case "Challenger 100":
    case "Challenger 75":
    case "Challenger 50":
      return 4;
    default: return 0;
  }
};

// Map tournament country name to player countryCode
const getCountryCodeFromCountry = (country: string): string | null => {
  const map: Record<string, string> = {
    "Australia": "AUS", "France": "FRA", "Spain": "ESP", "Italy": "ITA",
    "USA": "USA", "Great Britain": "GBR", "Germany": "GER", "Netherlands": "NED",
    "Canada": "CAN", "China": "CHN", "Japan": "JPN", "Austria": "AUT",
    "Monaco": "MON", "Qatar": "QAT", "UAE": "ARE", "Chile": "CHI",
    "Argentina": "ARG", "Brazil": "BRA", "Mexico": "MEX", "Romania": "ROU",
    "Morocco": "MAR", "Switzerland": "SUI", "Sweden": "SWE", "Croatia": "CRO",
    "Kazakhstan": "KAZ", "Belgium": "BEL", "Portugal": "POR", "New Zealand": "NZL",
    "India": "IND", "Thailand": "THA", "South Korea": "KOR", "Czech Republic": "CZE",
    "Colombia": "COL", "Peru": "PER", "Bolivia": "BOL", "Uruguay": "URU",
    "Paraguay": "PAR", "Ecuador": "ECU", "Poland": "POL", "Hungary": "HUN",
    "Slovakia": "SVK", "Serbia": "SRB", "Bulgaria": "BUL", "Finland": "FIN",
    "Rwanda": "RWA", "Tunisia": "TUN", "Georgia": "GEO", "Taiwan": "TPE",
    "Bahrain": "BRN", "Dominican Republic": "DOM", "San Marino": "SMR",
    "North Macedonia": "MKD", "New Caledonia": "NCL",
  };
  return map[country] || null;
};

export interface TournamentEntryResult {
  entrants: Player[];
  wildCardIds: Set<number>;
}

// Check if a player is eligible for a tournament based on REAL ranking (for Career Mode)
export const isEligibleForTournament = (ranking: number, category: TournamentCategory): boolean => {
  switch (category) {
    case "Grand Slam": return ranking <= 130;
    case "Masters 1000": return ranking <= 60;
    case "ATP 500": return ranking <= 60;
    case "ATP 250": return ranking <= 100;
    case "ATP Finals": return ranking <= 8;
    case "Challenger 175": return ranking >= 80 && ranking <= 150;
    case "Challenger 125": return ranking >= 150 && ranking <= 250;
    case "Challenger 100": return ranking >= 250 && ranking <= 350;
    case "Challenger 75": return ranking >= 300 && ranking <= 400;
    case "Challenger 50": return ranking >= 400 && ranking <= 500;
    default: return true;
  }
};

// Get eligible ranking range for CPU player entry
export const getEligibleRankingRange = (category: TournamentCategory): { min: number; max: number } => {
  switch (category) {
    case 'Grand Slam': return { min: 1, max: 130 };
    case 'Masters 1000': return { min: 1, max: 60 };
    case 'ATP 500': return { min: 1, max: 60 };
    case 'ATP 250': return { min: 1, max: 100 };
    case 'ATP Finals': return { min: 1, max: 8 };
    case 'Laver Cup': return { min: 1, max: 12 };
    case 'Challenger 175': return { min: 80, max: 150 };
    case 'Challenger 125': return { min: 150, max: 250 };
    case 'Challenger 100': return { min: 250, max: 350 };
    case 'Challenger 75': return { min: 300, max: 400 };
    case 'Challenger 50': return { min: 400, max: 500 };
    default: return { min: 1, max: 500 };
  }
};

// Career Mode ranking-based eligibility with progression
export const getCareerEligibleCategories = (ranking: number): TournamentCategory[] => {
  const categories: TournamentCategory[] = [];

  if (ranking > 300) {
    categories.push("Challenger 50", "Challenger 75");
  } else if (ranking > 200) {
    categories.push("Challenger 75", "Challenger 100");
  } else if (ranking > 150) {
    categories.push("Challenger 100", "Challenger 125");
  } else if (ranking > 100) {
    categories.push("Challenger 125", "ATP 250");
  } else if (ranking > 50) {
    categories.push("ATP 250", "ATP 500");
  } else if (ranking > 40) {
    categories.push("ATP 250", "ATP 500", "Masters 1000");
  } else {
    categories.push("ATP 250", "ATP 500", "Masters 1000");
  }

  // Grand Slams for Top 100
  if (ranking <= 100) {
    categories.push("Grand Slam");
  }

  return categories;
};

// Check if player can enter as wild card (same country as tournament)
export const canEnterAsWildCard = (playerCountryCode: string, tournamentCountry: string): boolean => {
  const tourneyCode = getCountryCodeFromCountry(tournamentCountry);
  return tourneyCode !== null && playerCountryCode === tourneyCode;
};

// Select tournament entrants including wild cards
export const selectTournamentEntrants = (
  players: Player[],
  category: TournamentCategory,
  playerLimit: number,
  tournamentCountry?: string,
  forceIncludePlayer?: Player // Force include a specific player (Career Mode player)
): TournamentEntryResult => {
  const availablePlayers = players.filter(p => !p.injured);
  const sortedPlayers = [...availablePlayers].sort(
    (a, b) => a.officialRanking - b.officialRanking
  );

  const entrants: Player[] = [];
  const wildCardIds = new Set<number>();
  const wcCount = getWildCardCount(category);
  const countryCode = tournamentCountry ? getCountryCodeFromCountry(tournamentCountry) : null;

  // If forcing a player, add them first
  if (forceIncludePlayer) {
    entrants.push(forceIncludePlayer);
  }

  // Reserve spots for wild cards
  const mainDrawLimit = playerLimit - wcCount;

  // Fill main draw by ranking + probability
  for (const player of sortedPlayers) {
    if (entrants.length >= mainDrawLimit) break;
    if (forceIncludePlayer && player.id === forceIncludePlayer.id) continue; // Already added
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

  // 1) Country-based wild cards
  if (countryCode) {
    const countryPlayers = sortedPlayers
      .filter(p => p.countryCode === countryCode && !alreadyIn.has(p.id))
      .slice(0, Math.ceil(wcCount * 0.6));
    wcCandidates.push(...countryPlayers);
  }

  // 2) Fictional ranking wild cards
  const fictionalWCs = sortedPlayers
    .filter(p => !alreadyIn.has(p.id) && !wcCandidates.some(wc => wc.id === p.id))
    .filter(p => p.fictionalRanking < p.officialRanking * 0.6)
    .sort((a, b) => a.fictionalRanking - b.fictionalRanking)
    .slice(0, wcCount - wcCandidates.length);
  wcCandidates.push(...fictionalWCs);

  // 3) Fill remaining WC spots
  if (wcCandidates.length < wcCount) {
    const remaining = sortedPlayers
      .filter(p => !alreadyIn.has(p.id) && !wcCandidates.some(wc => wc.id === p.id));
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
    case "Challenger 175":
      return "Strong Challenger field, players ranked 80-300";
    case "Challenger 125":
      return "Mid-level Challenger, players ranked 100-350";
    case "Challenger 100":
      return "Standard Challenger, players ranked 150-400";
    case "Challenger 75":
      return "Lower Challenger, players ranked 200-450";
    case "Challenger 50":
      return "Entry-level Challenger, players ranked 250-500";
    default:
      return "Various players";
  }
};
