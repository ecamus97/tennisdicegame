import { Player } from '@/data/players';

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

function generateNewPlayer(ranking: number): Player {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const age = 17 + Math.floor(Math.random() * 4); // 17-20
  const id = nextGeneratedId++;

  return {
    id,
    name: `${first} ${last}`,
    country: country.country,
    countryCode: country.code,
    age,
    officialRanking: ranking,
    previousRanking: ranking,
    fictionalRanking: ranking,
    points: Math.max(0, Math.floor(Math.random() * 50 + 30)),
    livePoints: 0,
    previousYearPoints: new Array(52).fill(0),
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

/**
 * Process end-of-season retirements and generate replacement players.
 * Players age +1 and some retire based on age probability.
 * New young players are generated to replace them.
 */
export function processSeasonTransition(players: Player[]): Player[] {
  const updated: Player[] = [];
  const retiredCount: number[] = [];

  for (const player of players) {
    const aged = { ...player, age: player.age + 1 };
    const retireChance = getRetirementProbability(aged.age);
    if (retireChance > 0 && Math.random() < retireChance) {
      retiredCount.push(aged.officialRanking);
    } else {
      updated.push(aged);
    }
  }

  // Generate replacements
  for (let i = 0; i < retiredCount.length; i++) {
    updated.push(generateNewPlayer(490 + i));
  }

  // Re-rank
  updated.sort((a, b) => b.points - a.points);
  return updated.map((p, idx) => ({ ...p, officialRanking: idx + 1 }));
}
