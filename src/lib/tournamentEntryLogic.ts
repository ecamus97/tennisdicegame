import { Player, TournamentCategory } from "@/data/players";

// Entry probabilities by ranking tier and tournament category
// Returns probability (0-1) that a player will enter
export const getEntryProbability = (
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

    case "ITF M25":
      if (ranking < 420 || ranking > 503) return 0;
      if (ranking <= 450) return 0.75;
      return 0.90;

    case "ITF M15":
      if (ranking < 460 || ranking > 503) return 0;
      return 0.90;

    default:
      return 0.5;
  }
};

// How much a player's accumulated fatigue reduces their odds of entering the next tournament.
// A player coming off a deep run (high fatigue) strongly prefers to rest for a few weeks.
export const getFatigueEntryMultiplier = (fatigue: number): number => {
  if (fatigue >= 85) return 0.1;
  if (fatigue >= 70) return 0.3;
  if (fatigue >= 55) return 0.55;
  if (fatigue >= 40) return 0.8;
  return 1;
};

// Players tend to defend the ranking points they earned at this same tournament/week last
// year, so having scored points in that week last season makes them more likely to enter again.
export const getDefendingPointsBoost = (previousYearPoints: number[] | undefined, week: number): number => {
  const pts = previousYearPoints?.[week - 1] || 0;
  if (pts <= 0) return 1;
  if (pts >= 1000) return 1.5;
  if (pts >= 400) return 1.35;
  if (pts >= 150) return 1.2;
  return 1.1;
};

// Combines base entry probability (ranking + category) with fatigue and points-defense adjustments.
export const getAdjustedEntryProbability = (
  player: Player,
  category: TournamentCategory,
  week: number
): number => {
  const base = getEntryProbability(player.officialRanking, category);
  if (base <= 0) return 0;
  const adjusted = base
    * getFatigueEntryMultiplier(player.fatigue ?? 0)
    * getDefendingPointsBoost(player.previousYearPoints, week);
  return Math.max(0, Math.min(1, adjusted));
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
    case "ITF M25": return 4;
    case "ITF M15": return 2;
    default: return 0;
  }
};

// Map tournament country name to player countryCode
export const getCountryCodeFromCountry = (country: string): string | null => {
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
    case "Challenger 175": return ranking >= 70 && ranking <= 180;
    case "Challenger 125": return ranking >= 130 && ranking <= 260;
    case "Challenger 100": return ranking >= 220 && ranking <= 360;
    case "Challenger 75": return ranking >= 280 && ranking <= 420;
    case "Challenger 50": return ranking >= 340 && ranking <= 503;
    case "ITF M25": return ranking >= 420 && ranking <= 503;
    case "ITF M15": return ranking >= 460 && ranking <= 503;
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
    case 'Challenger 175': return { min: 70, max: 180 };
    case 'Challenger 125': return { min: 130, max: 260 };
    case 'Challenger 100': return { min: 220, max: 360 };
    case 'Challenger 75': return { min: 280, max: 420 };
    case 'Challenger 50': return { min: 340, max: 503 };
    case 'ITF M25': return { min: 420, max: 503 };
    case 'ITF M15': return { min: 460, max: 503 };
    default: return { min: 1, max: 500 };
  }
};

// Career Mode ranking-based eligibility with progression
export const getCareerEligibleCategories = (ranking: number): TournamentCategory[] => {
  const categories: TournamentCategory[] = [];

  // Each bracket gives 3 adjacent levels so there's always something to play
  if (ranking > 460) {
    categories.push("ITF M15", "ITF M25", "Challenger 50");
  } else if (ranking > 400) {
    categories.push("ITF M15", "ITF M25", "Challenger 50", "Challenger 75");
  } else if (ranking > 340) {
    categories.push("ITF M25", "Challenger 50", "Challenger 75");
  } else if (ranking > 280) {
    categories.push("Challenger 50", "Challenger 75", "Challenger 100");
  } else if (ranking > 220) {
    categories.push("Challenger 75", "Challenger 100", "Challenger 125");
  } else if (ranking > 160) {
    categories.push("Challenger 100", "Challenger 125", "Challenger 175");
  } else if (ranking > 100) {
    categories.push("Challenger 125", "Challenger 175", "ATP 250");
  } else if (ranking > 50) {
    categories.push("Challenger 175", "ATP 250", "ATP 500");
  } else if (ranking > 20) {
    categories.push("ATP 250", "ATP 500", "Masters 1000");
  } else {
    categories.push("ATP 250", "ATP 500", "Masters 1000");
  }

  // Grand Slams for Top 130
  if (ranking <= 130) {
    categories.push("Grand Slam");
  }

  // ATP Finals for Top 8
  if (ranking <= 8) {
    categories.push("ATP Finals");
  }

  // Laver Cup for Top 12
  if (ranking <= 12) {
    categories.push("Laver Cup");
  }

  // Davis Cup - available to all players
  categories.push("Davis Cup");

  return categories;
};

// Check if player can enter as wild card (same country + ranking must be in reasonable range)
export const canEnterAsWildCard = (
  playerCountryCode: string,
  tournamentCountry: string,
  category?: TournamentCategory,
  playerRanking?: number
): boolean => {
  const tourneyCode = getCountryCodeFromCountry(tournamentCountry);
  if (!tourneyCode || playerCountryCode !== tourneyCode) return false;
  if (!category || playerRanking === undefined) return true; // legacy calls

  // Max ranking allowed to receive a WC for each category (looser than normal entry cutoff)
  const wcRankingLimit: Partial<Record<TournamentCategory, number>> = {
    'Grand Slam': 160,
    'Masters 1000': 80,
    'ATP 500': 80,
    'ATP 250': 150,
    'Challenger 175': 220,
    'Challenger 125': 310,
    'Challenger 100': 400,
    'Challenger 75': 460,
    'Challenger 50': 503,
  };
  const limit = wcRankingLimit[category];
  return limit === undefined || playerRanking <= limit;
};

// Select tournament entrants including wild cards
export const selectTournamentEntrants = (
  players: Player[],
  category: TournamentCategory,
  playerLimit: number,
  week: number,
  tournamentCountry?: string,
  forceIncludePlayer?: Player // Force include a specific player (Career Mode player)
): TournamentEntryResult => {
  const range = getEligibleRankingRange(category);
  const availablePlayers = players.filter(p => !p.injured && p.officialRanking >= range.min && p.officialRanking <= range.max);
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
    const probability = getAdjustedEntryProbability(player, category, week);
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
    case "ITF M25":
      return "ITF Men's World Tennis Tour, players ranked 200-503";
    case "ITF M15":
      return "ITF Men's World Tennis Tour entry-level, players ranked 300-503";
    default:
      return "Various players";
  }
};
