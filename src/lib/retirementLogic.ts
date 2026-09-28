import { Player } from '@/data/players';
import {
  QUALIFIERS_R1_YEAR1, WORLD_GROUP_I_YEAR1, WORLD_GROUP_II_YEAR1,
  DEFENDING_CHAMPION_YEAR1, RUNNER_UP_YEAR1, COUNTRY_DISPLAY_NAMES,
} from '@/data/davisCupData';

// Retirement probability based on age
function getRetirementProbability(age: number): number {
  if (age < 32) return 0;
  if (age < 34) return 0.05;
  if (age < 36) return 0.15;
  if (age < 38) return 0.30;
  if (age < 40) return 0.50;
  return 0.75;
}

// Random first/last names for generated players
const FIRST_NAMES = [
  'Lucas', 'Mateo', 'Santiago', 'Diego', 'Marco', 'Leo', 'Nico', 'Hugo', 'Alex', 'Daniel',
  'Pablo', 'Adrian', 'Tomás', 'Rafael', 'Victor', 'Ivan', 'Felix', 'Oscar', 'Andre', 'Max',
  'Julian', 'Emil', 'Henrik', 'Lars', 'Erik', 'Anton', 'Liam', 'Noah', 'Kai', 'Finn',
  'Stefan', 'Nikola', 'Petar', 'Andrei', 'Mikhail', 'Yuki', 'Kenji', 'Ravi', 'Omar', 'Carlos',
];
const LAST_NAMES = [
  'Moreno', 'Silva', 'García', 'López', 'Fernández', 'Martínez', 'Rodríguez', 'González',
  'Hernández', 'Pérez', 'Sánchez', 'Torres', 'Ramírez', 'Flores', 'Rivera', 'Gómez',
  'Díaz', 'Cruz', 'Reyes', 'Romero', 'Müller', 'Schmidt', 'Weber', 'Fischer', 'Wagner',
  'Becker', 'Rossi', 'Russo', 'Romano', 'Colombo', 'Ricci', 'Greco', 'Bruno', 'Gallo',
  'Conti', 'De Luca', 'Mancini', 'Costa', 'Martin', 'Dupont', 'Lefebvre', 'Bernard',
  'Petit', 'Morel', 'Laurent', 'Leroy', 'Blanc', 'Bonnet', 'Dubois', 'Girard',
];

const COUNTRIES = [
  { country: 'Spain', code: 'ESP' }, { country: 'Italy', code: 'ITA' },
  { country: 'France', code: 'FRA' }, { country: 'Germany', code: 'GER' },
  { country: 'USA', code: 'USA' }, { country: 'Argentina', code: 'ARG' },
  { country: 'Australia', code: 'AUS' }, { country: 'Brazil', code: 'BRA' },
  { country: 'Great Britain', code: 'GBR' }, { country: 'Czech Republic', code: 'CZE' },
  { country: 'Japan', code: 'JPN' }, { country: 'Canada', code: 'CAN' },
  { country: 'Netherlands', code: 'NED' }, { country: 'Belgium', code: 'BEL' },
  { country: 'Switzerland', code: 'SUI' }, { country: 'Colombia', code: 'COL' },
  { country: 'Chile', code: 'CHI' }, { country: 'Serbia', code: 'SRB' },
  { country: 'Croatia', code: 'CRO' }, { country: 'Poland', code: 'POL' },
];

let nextGeneratedId = 10000;

/**
 * A new player's official ranking always starts near the bottom (they're unproven), but their
 * fictional ranking is their hidden true power level, which is what actually decides match outcomes
 * (see matchEngine.ts). Most rookies are journeymen whose fictional ranking stays close to where
 * they start, but a share of them are hidden gems with real top-level potential: their fictional
 * ranking can land far ahead of their official one, so they climb fast and keep the future rankings
 * varied instead of every new player being a permanent afterthought.
 */
function generateRookieFictionalRanking(entryRanking: number): number {
  const roll = Math.random();
  if (roll < 0.04) return 1 + Math.floor(Math.random() * 30); // future superstar: top 30 potential
  if (roll < 0.14) return 31 + Math.floor(Math.random() * 70); // future top 100
  if (roll < 0.35) return 101 + Math.floor(Math.random() * 200); // future top 300
  // journeyman: potential hovers around their entry ranking, with some spread either way
  const spread = Math.floor(Math.random() * 160) - 80;
  return Math.max(301, entryRanking + spread);
}

function buildGeneratedPlayer(ranking: number, country: string, countryCode: string): Player {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const age = 17 + Math.floor(Math.random() * 4); // 17-20
  const id = nextGeneratedId++;

  return {
    id,
    name: `${first} ${last}`,
    country,
    countryCode,
    age,
    officialRanking: ranking,
    previousRanking: ranking,
    fictionalRanking: generateRookieFictionalRanking(ranking),
    points: Math.max(0, Math.floor(Math.random() * 50 + 30)),
    livePoints: 0,
    previousYearPoints: new Array(52).fill(0),
    currentYearWeeklyPoints: new Array(52).fill(0),
    weeklyDefensePoints: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    surfaceAffinity: { Hard: 0, Clay: 0, Grass: 0 },
    stats: {
      wins: 0, losses: 0,
      surfaceWins: { Hard: 0, Clay: 0, Grass: 0 },
      surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 },
      currentStreak: 0, bestWinStreak: 0, titles: 0,
    },
  };
}

function generateNewPlayer(ranking: number): Player {
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  return buildGeneratedPlayer(ranking, country.country, country.code);
}

/** Same as generateNewPlayer, but for a specific Davis Cup country code instead of a random one —
 * used to backfill a country whose roster dropped below 2 eligible players after retirements. */
function generateNewPlayerForCountry(ranking: number, countryCode: string): Player {
  const country = COUNTRY_DISPLAY_NAMES[countryCode] || countryCode;
  return buildGeneratedPlayer(ranking, country, countryCode);
}

/** Every country code the Davis Cup pools can reference — buildCountryEntry (davisCupData.ts)
 * needs at least 2 non-retired players per code or the country shows as "(sin roster)" and its
 * ties are auto-walked over. */
function getAllDavisCupCountryCodes(): Set<string> {
  return new Set<string>([
    ...QUALIFIERS_R1_YEAR1.seeded, ...QUALIFIERS_R1_YEAR1.unseeded,
    ...WORLD_GROUP_I_YEAR1.seeded, ...WORLD_GROUP_I_YEAR1.unseeded,
    ...WORLD_GROUP_II_YEAR1.seeded, ...WORLD_GROUP_II_YEAR1.unseeded,
    DEFENDING_CHAMPION_YEAR1, RUNNER_UP_YEAR1,
  ]);
}

export interface SeasonTransitionResult {
  players: Player[];
  retiredNames: string[];
  newPlayerNames: string[];
}

/**
 * Process end-of-season retirements and generate replacement players.
 * Returns updated players along with retired and new player names.
 */
export function processSeasonTransition(players: Player[]): SeasonTransitionResult {
  const updated: Player[] = [];
  const retiredNames: string[] = [];

  for (const player of players) {
    const retireChance = getRetirementProbability(player.age);
    if (retireChance > 0 && Math.random() < retireChance) {
      retiredNames.push(player.name);
    } else {
      updated.push(player);
    }
  }

  // Generate replacements
  const newPlayerNames: string[] = [];
  for (let i = 0; i < retiredNames.length; i++) {
    const newPlayer = generateNewPlayer(490 + i);
    updated.push(newPlayer);
    newPlayerNames.push(newPlayer.name);
  }

  // Davis Cup backfill: retirements can drop a country below the 2 eligible players a Davis Cup
  // tie needs (see buildCountryEntry in davisCupData.ts). Instead of a random-country replacement,
  // target the specific country that's short so its roster — and its Davis Cup tie — stay intact.
  let backfillRanking = 490 + newPlayerNames.length;
  for (const code of getAllDavisCupCountryCodes()) {
    const count = updated.filter(p => p.countryCode === code && !p.retired).length;
    for (let i = count; i < 2; i++) {
      const newPlayer = generateNewPlayerForCountry(backfillRanking++, code);
      updated.push(newPlayer);
      newPlayerNames.push(newPlayer.name);
    }
  }

  // Re-rank
  updated.sort((a, b) => b.points - a.points);
  return {
    players: updated.map((p, idx) => ({ ...p, officialRanking: idx + 1 })),
    retiredNames,
    newPlayerNames,
  };
}
