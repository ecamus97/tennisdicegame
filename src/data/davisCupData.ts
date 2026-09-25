import { Player } from "./players";
import { MatchResult, playMatch } from "@/lib/matchEngine";

// ==================== TYPES ====================

export interface DavisCupCountryEntry {
  countryCode: string;
  country: string;
  player1Id: number;
  player2Id: number;
  countryRanking: number;
  /** true when the country currently has fewer than 2 eligible players in the game and is auto-walked over by its opponent */
  insufficientPlayers?: boolean;
}

export interface DavisCupSeriesMatch {
  id: string;
  player1Id: number;
  player2Id: number;
  player1PartnerId?: number;
  player2PartnerId?: number;
  isDoubles: boolean;
  result?: MatchResult;
  matchNumber: number;
  country1Won?: boolean;
}

export interface DavisCupSeries {
  id: string;
  country1Code: string;
  country2Code: string;
  matches: DavisCupSeriesMatch[];
  country1Wins: number;
  country2Wins: number;
  winner?: string;
}

export type DavisCupTierId = "qualifiersR1" | "worldGroupI" | "worldGroupII" | "qualifiersR2" | "finalEight";

export interface DavisCupTie {
  id: string;
  tier: DavisCupTierId;
  label: string; // e.g. "Qualifiers R1", "World Group I Playoff - Round 2"
  country1Code: string;
  country2Code: string;
  series: DavisCupSeries;
  winnerCode?: string;
  isBye?: boolean; // one country lacked 2 eligible players; the other auto-advances without playing
}

export interface DavisCupFinalEight {
  quarterFinals: DavisCupTie[];
  semiFinals: DavisCupTie[];
  final?: DavisCupTie;
}

export interface DavisCupSeasonHistory {
  qualifiersR1Winners: string[]; // -> Qualifiers R2
  qualifiersR1Losers: string[]; // -> World Group I (Sept)
  worldGroupIRound1Winners: string[]; // -> World Group I (Sept)
  worldGroupIRound1Losers: string[]; // -> World Group II (Sept)
  qualifiersR2Winners: string[]; // -> Final Eight
  qualifiersR2Losers: string[]; // -> next season Qualifiers R1 (7)
  worldGroupIRound2Winners: string[]; // -> next season Qualifiers R1 (13)
  worldGroupIRound2Losers: string[]; // -> next season World Group I
  worldGroupIIRound2Winners: string[]; // countries promoted from the World Group II pool -> next season World Group I
  worldGroupIIRound2Losers: string[]; // World Group II pool members who stay -> next season World Group II pool
  worldGroupIIRound2ByeCodes: string[]; // World Group I (Feb) losers with no World Group II opponent available -> stay in World Group I next season
  champion?: string;
  runnerUp?: string;
  finalEightParticipants: string[];
}

export interface DavisCupSeasonState {
  season: number;
  countries: Record<string, DavisCupCountryEntry>;
  qualifiersR1: DavisCupTie[]; // Feb, 13 ties
  worldGroupIRound1: DavisCupTie[]; // Feb, 13 ties
  worldGroupIIPool: string[]; // World Group II does not play in Feb; this is the static list of countries (up to 13, only those with 2+ eligible players) it contributes to the September tie
  worldGroupIRound2: DavisCupTie[]; // Sept: World Group I (Feb) winners vs Qualifiers R1 (Feb) losers
  worldGroupIIRound2: DavisCupTie[]; // Sept: World Group I (Feb) losers vs the World Group II pool
  qualifiersR2: DavisCupTie[]; // Sept, 7 ties (13 QR1 winners + runner-up bye)
  finalEight: DavisCupFinalEight;
  championDefending: string; // country code with the automatic Final Eight bye this season
  runnerUpBye: string; // country code with the automatic Qualifiers R2 bye this season
  history: DavisCupSeasonHistory;
}

const EMPTY_HISTORY: DavisCupSeasonHistory = {
  qualifiersR1Winners: [], qualifiersR1Losers: [],
  worldGroupIRound1Winners: [], worldGroupIRound1Losers: [],
  qualifiersR2Winners: [], qualifiersR2Losers: [],
  worldGroupIRound2Winners: [], worldGroupIRound2Losers: [],
  worldGroupIIRound2Winners: [], worldGroupIIRound2Losers: [], worldGroupIIRound2ByeCodes: [],
  finalEightParticipants: [],
};

// ==================== CALENDAR WEEKS ====================
// Chosen to fall on weeks with no other ATP tournament scheduled: week 4 is the week right after
// the Australian Open (weeks 3-4), week 37 is a free week between the US Open swing and the Asian
// swing, and week 48 is free after the ATP Finals (week 46).
export const DAVIS_CUP_FEB_WEEK = 4;
export const DAVIS_CUP_SEPT_WEEK = 37;
export const DAVIS_CUP_FINAL8_WEEK = 48;

// ==================== YEAR 1 SEED DATA ====================
// Country codes match the game's existing countryCode field where the nation already exists.
// Codes marked NEW are nations not yet present in the player pool; until real players are added
// for them, their ties are auto-walked over by the opponent (see buildCountryEntry).

export const DEFENDING_CHAMPION_YEAR1 = "ITA"; // Italy - Final Eight bye
export const RUNNER_UP_YEAR1 = "ESP"; // Spain - Qualifiers R2 bye

interface PoolSeed {
  seeded: string[]; // country codes, strongest first
  unseeded: string[]; // country codes
}

// Qualifiers R1 (Feb) - 26 nations / 13 ties
export const QUALIFIERS_R1_YEAR1: PoolSeed = {
  seeded: ["GER", "AUS", "BEL", "NED", "USA", "FRA", "CAN", "CZE", "ARG", "AUT", "GBR", "CRO", "SRB"],
  unseeded: ["HUN", "BRA", "CHI", "DEN", "SVK", "KOR", "JPN", "SWE", "NOR", "PER", "IND", "BUL", "ECU"],
};

// World Group I Playoff (Feb) - 26 nations / 13 ties
export const WORLD_GROUP_I_YEAR1: PoolSeed = {
  seeded: ["FIN", "SUI", "POR", "TPE", "BIH", "KAZ", "ISR", "TUR", "POL", "COL", "GRE", "ROU", "UKR"],
  unseeded: ["EGY", "LUX", "MON", "LTU", "MAR", "MEX", "NZL", "LIB", "TUN", "HKG", "CHN", "SLO", "PAR"],
};

// World Group II Playoff (Feb) - 26 nations / 13 ties
export const WORLD_GROUP_II_YEAR1: PoolSeed = {
  seeded: ["UZB", "IRL", "URU", "PAK", "BAR", "LAT", "GEO", "RSA", "ESA", "EST", "TOG", "THA", "CYP"],
  unseeded: ["DOM", "BOL", "INA", "NAM", "SYR", "BEN", "NGR", "JAM", "PUR", "MKD", "BER", "SEN", "MNE"],
};

// Full display names for every country code used anywhere in the Davis Cup pools, so a tie always
// shows a proper name even when the country currently has fewer than 2 eligible players (walkover)
// and there is no player record to read the name from.
export const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
  // Qualifiers R1
  GER: "Germany", AUS: "Australia", BEL: "Belgium", NED: "Netherlands", USA: "USA", FRA: "France",
  CAN: "Canada", CZE: "Czech Republic", ARG: "Argentina", AUT: "Austria", GBR: "Great Britain",
  CRO: "Croatia", SRB: "Serbia", HUN: "Hungary", BRA: "Brazil", CHI: "Chile", DEN: "Denmark",
  SVK: "Slovakia", KOR: "South Korea", JPN: "Japan", SWE: "Sweden", NOR: "Norway", PER: "Peru",
  IND: "India", BUL: "Bulgaria", ECU: "Ecuador",
  // World Group I Playoff
  FIN: "Finland", SUI: "Switzerland", POR: "Portugal", TPE: "Taiwan", BIH: "Bosnia", KAZ: "Kazakhstan",
  ISR: "Israel", TUR: "Turkey", POL: "Poland", COL: "Colombia", GRE: "Greece", ROU: "Romania",
  UKR: "Ukraine", EGY: "Egypt", LUX: "Luxembourg", MON: "Monaco", LTU: "Lithuania", MAR: "Morocco",
  MEX: "Mexico", NZL: "New Zealand", LIB: "Lebanon", TUN: "Tunisia", HKG: "Hong Kong", CHN: "China",
  SLO: "Slovenia", PAR: "Paraguay",
  // World Group II Playoff
  UZB: "Uzbekistan", IRL: "Ireland", URU: "Uruguay", PAK: "Pakistan", BAR: "Barbados", LAT: "Latvia",
  GEO: "Georgia", RSA: "South Africa", ESA: "El Salvador", EST: "Estonia", TOG: "Togo", THA: "Thailand",
  CYP: "Cyprus", DOM: "Dominican Republic", BOL: "Bolivia", INA: "Indonesia", NAM: "Namibia",
  SYR: "Syria", BEN: "Benin", NGR: "Nigeria", JAM: "Jamaica", PUR: "Puerto Rico", MKD: "North Macedonia",
  BER: "Bermuda", SEN: "Senegal", MNE: "Montenegro",
  // Champion / runner-up byes
  ITA: "Italy", ESP: "Spain",
};

/** @deprecated use COUNTRY_DISPLAY_NAMES */
export const NEW_COUNTRY_NAMES = COUNTRY_DISPLAY_NAMES;

// ==================== HELPERS ====================

let tieCounter = 0;
const nextTieId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(tieCounter++).toString(36)}`;

export const buildCountryEntry = (code: string, allPlayers: Player[]): DavisCupCountryEntry => {
  const countryPlayers = allPlayers
    .filter(p => p.countryCode === code && !p.retired)
    .sort((a, b) => a.officialRanking - b.officialRanking);

  if (countryPlayers.length >= 2) {
    return {
      countryCode: code,
      country: countryPlayers[0].country,
      player1Id: countryPlayers[0].id,
      player2Id: countryPlayers[1].id,
      countryRanking: countryPlayers[0].officialRanking,
    };
  }

  return {
    countryCode: code,
    country: countryPlayers[0]?.country || COUNTRY_DISPLAY_NAMES[code] || code,
    player1Id: countryPlayers[0]?.id ?? -1,
    player2Id: -1,
    countryRanking: countryPlayers[0]?.officialRanking ?? 9999,
    insufficientPlayers: true,
  };
};

export const createSeriesMatches = (c1: DavisCupCountryEntry, c2: DavisCupCountryEntry, seriesId: string): DavisCupSeriesMatch[] => [
  { id: `${seriesId}-1`, player1Id: c1.player1Id, player2Id: c2.player2Id, isDoubles: false, matchNumber: 1 },
  { id: `${seriesId}-2`, player1Id: c1.player2Id, player2Id: c2.player1Id, isDoubles: false, matchNumber: 2 },
  { id: `${seriesId}-3`, player1Id: c1.player1Id, player2Id: c2.player1Id, player1PartnerId: c1.player2Id, player2PartnerId: c2.player2Id, isDoubles: true, matchNumber: 3 },
  { id: `${seriesId}-4`, player1Id: c1.player2Id, player2Id: c2.player2Id, isDoubles: false, matchNumber: 4 },
  { id: `${seriesId}-5`, player1Id: c1.player1Id, player2Id: c2.player1Id, isDoubles: false, matchNumber: 5 },
];

const createSeries = (c1: DavisCupCountryEntry, c2: DavisCupCountryEntry, seriesId: string): DavisCupSeries => ({
  id: seriesId,
  country1Code: c1.countryCode,
  country2Code: c2.countryCode,
  matches: createSeriesMatches(c1, c2, seriesId),
  country1Wins: 0,
  country2Wins: 0,
});

/** Builds a tie between two countries. If either lacks 2 eligible players, the tie is an automatic walkover for the other side. */
export const createTie = (
  tier: DavisCupTierId,
  label: string,
  c1: DavisCupCountryEntry,
  c2: DavisCupCountryEntry,
): DavisCupTie => {
  const id = nextTieId(tier);
  if (c1.insufficientPlayers || c2.insufficientPlayers) {
    const winner = c1.insufficientPlayers ? c2 : c1;
    return {
      id,
      tier,
      label,
      country1Code: c1.countryCode,
      country2Code: c2.countryCode,
      series: createSeries(c1, c2, id),
      winnerCode: winner.countryCode,
      isBye: true,
    };
  }
  return {
    id,
    tier,
    label,
    country1Code: c1.countryCode,
    country2Code: c2.countryCode,
    series: createSeries(c1, c2, id),
  };
};

const pairPool = (
  countries: Record<string, DavisCupCountryEntry>,
  seed: PoolSeed,
  tier: DavisCupTierId,
  label: string,
): DavisCupTie[] => {
  const ties: DavisCupTie[] = [];
  for (let i = 0; i < seed.seeded.length; i++) {
    const c1 = countries[seed.seeded[i]];
    const c2 = countries[seed.unseeded[i]];
    if (!c1 || !c2) continue;
    ties.push(createTie(tier, label, c1, c2));
  }
  return ties;
};

/** Pairs an arbitrary list of country codes against each other by ranking (best vs weakest of the other list). */
const crossPair = (
  countries: Record<string, DavisCupCountryEntry>,
  groupA: string[],
  groupB: string[],
  tier: DavisCupTierId,
  label: string,
): DavisCupTie[] => {
  const a = [...groupA].sort((x, y) => (countries[x]?.countryRanking ?? 9999) - (countries[y]?.countryRanking ?? 9999));
  const b = [...groupB].sort((x, y) => (countries[x]?.countryRanking ?? 9999) - (countries[y]?.countryRanking ?? 9999));
  const ties: DavisCupTie[] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const c1 = countries[a[i]];
    const c2 = countries[b[i]];
    if (!c1 || !c2) continue;
    ties.push(createTie(tier, label, c1, c2));
  }
  return ties;
};

/**
 * Pairs a (typically larger) group of countries against a smaller pool. The weakest members of the
 * larger group play the pool (one tie each); the strongest members of the larger group, for whom no
 * pool opponent is available, get an automatic bye (they stay where they are).
 */
const pairAgainstPool = (
  countries: Record<string, DavisCupCountryEntry>,
  larger: string[],
  pool: string[],
  tier: DavisCupTierId,
  label: string,
): { ties: DavisCupTie[]; byeCodes: string[] } => {
  const sortedLarger = [...larger].sort((a, b) => (countries[a]?.countryRanking ?? 9999) - (countries[b]?.countryRanking ?? 9999));
  const sortedPool = [...pool].sort((a, b) => (countries[a]?.countryRanking ?? 9999) - (countries[b]?.countryRanking ?? 9999));
  const n = Math.min(sortedLarger.length, sortedPool.length);
  const toPlay = sortedLarger.slice(sortedLarger.length - n); // weakest n of the larger group
  const byeCodes = sortedLarger.slice(0, sortedLarger.length - n); // strongest, no opponent available
  const ties: DavisCupTie[] = [];
  for (let i = 0; i < n; i++) {
    const c1 = countries[toPlay[i]];
    const c2 = countries[sortedPool[i]];
    if (!c1 || !c2) continue;
    ties.push(createTie(tier, label, c1, c2));
  }
  return { ties, byeCodes };
};

// ==================== SEASON GENERATION ====================

export const generateYear1Season = (allPlayers: Player[]): DavisCupSeasonState => {
  const allCodes = [
    ...QUALIFIERS_R1_YEAR1.seeded, ...QUALIFIERS_R1_YEAR1.unseeded,
    ...WORLD_GROUP_I_YEAR1.seeded, ...WORLD_GROUP_I_YEAR1.unseeded,
    ...WORLD_GROUP_II_YEAR1.seeded, ...WORLD_GROUP_II_YEAR1.unseeded,
    DEFENDING_CHAMPION_YEAR1, RUNNER_UP_YEAR1,
  ];
  const countries: Record<string, DavisCupCountryEntry> = {};
  allCodes.forEach(code => { countries[code] = buildCountryEntry(code, allPlayers); });

  const qualifiersR1 = pairPool(countries, QUALIFIERS_R1_YEAR1, "qualifiersR1", "Qualifiers R1");
  const worldGroupIRound1 = pairPool(countries, WORLD_GROUP_I_YEAR1, "worldGroupI", "World Group I Playoff");

  // World Group II does not play in February: only the nations that currently have 2+ eligible
  // players form the pool that will face World Group I's Feb losers in September (up to 13, best ranked first).
  const worldGroupIICandidates = [...WORLD_GROUP_II_YEAR1.seeded, ...WORLD_GROUP_II_YEAR1.unseeded]
    .filter(code => !countries[code]?.insufficientPlayers)
    .sort((a, b) => (countries[a]?.countryRanking ?? 9999) - (countries[b]?.countryRanking ?? 9999))
    .slice(0, 13);

  return {
    season: 1,
    countries,
    qualifiersR1,
    worldGroupIRound1,
    worldGroupIIPool: worldGroupIICandidates,
    worldGroupIRound2: [],
    worldGroupIIRound2: [],
    qualifiersR2: [],
    finalEight: { quarterFinals: [], semiFinals: [] },
    championDefending: DEFENDING_CHAMPION_YEAR1,
    runnerUpBye: RUNNER_UP_YEAR1,
    history: { ...EMPTY_HISTORY },
  };
};

/** Builds next season's Feb pools (Qualifiers R1, World Group I) plus the new World Group II pool, from this season's results. */
export const generateNextSeason = (prevSeason: DavisCupSeasonState, allPlayers: Player[]): DavisCupSeasonState => {
  const h = prevSeason.history;

  // Qualifiers R1 next year = 6 non-champion/runner-up Final Eight nations + 7 Qualifiers R2 losers + 13 World Group I (Sept) winners
  const finalEightOthers = h.finalEightParticipants.filter(code => code !== h.champion && code !== h.runnerUp);
  const nextQR1Codes = [...finalEightOthers, ...h.qualifiersR2Losers, ...h.worldGroupIRound2Winners];

  // World Group I next year = World Group I (Sept) losers + World Group II (Sept) winners + World Group I Feb losers who got a bye (no WG2 opponent)
  const nextWG1Codes = [...h.worldGroupIRound2Losers, ...h.worldGroupIIRound2Winners, ...h.worldGroupIIRound2ByeCodes];

  // World Group II next year's pool = the pool members who lost their September tie (stay in World Group II)
  const nextWG2Pool = [...h.worldGroupIIRound2Losers];

  const balance = (codes: string[]) => codes.length % 2 === 0 ? codes : codes.slice(0, codes.length - 1);
  const seedFromCodes = (codes: string[], countries: Record<string, DavisCupCountryEntry>): PoolSeed => {
    const sorted = [...balance(codes)].sort((a, b) => (countries[a]?.countryRanking ?? 9999) - (countries[b]?.countryRanking ?? 9999));
    const half = Math.floor(sorted.length / 2);
    return { seeded: sorted.slice(0, half), unseeded: sorted.slice(half) };
  };

  const champion = h.champion || prevSeason.championDefending;
  const runnerUp = h.runnerUp || prevSeason.runnerUpBye;
  const allCodes = Array.from(new Set([...nextQR1Codes, ...nextWG1Codes, ...nextWG2Pool, champion, runnerUp]));
  const countries: Record<string, DavisCupCountryEntry> = {};
  allCodes.forEach(code => { countries[code] = buildCountryEntry(code, allPlayers); });

  const qr1Seed = seedFromCodes(nextQR1Codes, countries);
  const wg1Seed = seedFromCodes(nextWG1Codes, countries);

  const qualifiersR1 = pairPool(countries, qr1Seed, "qualifiersR1", "Qualifiers R1");
  const worldGroupIRound1 = pairPool(countries, wg1Seed, "worldGroupI", "World Group I Playoff");
  const worldGroupIIPool = [...nextWG2Pool].sort((a, b) => (countries[a]?.countryRanking ?? 9999) - (countries[b]?.countryRanking ?? 9999));

  return {
    season: prevSeason.season + 1,
    countries,
    qualifiersR1,
    worldGroupIRound1,
    worldGroupIIPool,
    worldGroupIRound2: [],
    worldGroupIIRound2: [],
    qualifiersR2: [],
    finalEight: { quarterFinals: [], semiFinals: [] },
    championDefending: champion,
    runnerUpBye: runnerUp,
    history: { ...EMPTY_HISTORY },
  };
};

// ==================== ROUND TRANSITIONS ====================

export const allTiesComplete = (ties: DavisCupTie[]): boolean => ties.length > 0 && ties.every(t => !!t.winnerCode);

const winnerCodes = (ties: DavisCupTie[]): string[] => ties.map(t => t.winnerCode!).filter(Boolean);
const loserCodes = (ties: DavisCupTie[]): string[] =>
  ties.map(t => (t.winnerCode === t.country1Code ? t.country2Code : t.country1Code)).filter(Boolean);

/** Once Feb (Round 1) is complete for both Qualifiers R1 and World Group I, generate the September ties. */
export const generateSeptemberRounds = (state: DavisCupSeasonState): DavisCupSeasonState => {
  if (!allTiesComplete(state.qualifiersR1) || !allTiesComplete(state.worldGroupIRound1)) return state;
  if (state.worldGroupIRound2.length > 0 || state.qualifiersR2.length > 0) return state; // already generated

  const q1Winners = winnerCodes(state.qualifiersR1);
  const q1Losers = loserCodes(state.qualifiersR1);
  const wg1Winners = winnerCodes(state.worldGroupIRound1);
  const wg1Losers = loserCodes(state.worldGroupIRound1);

  // World Group I (Sept): World Group I (Feb) winners vs Qualifiers R1 (Feb) losers.
  const worldGroupIRound2 = crossPair(state.countries, wg1Winners, q1Losers, "worldGroupI", "World Group I Playoff - 2ª Ronda");

  // World Group II (Sept): World Group I (Feb) losers vs the World Group II pool. If the pool is
  // smaller than 13, the strongest World Group I losers get a bye (no relegation opponent available).
  const { ties: worldGroupIIRound2, byeCodes: worldGroupIIByeCodes } =
    pairAgainstPool(state.countries, wg1Losers, state.worldGroupIIPool, "worldGroupII", "World Group II Playoff");

  // Qualifiers R2: 13 Qualifiers R1 (Feb) winners + runner-up bye.
  const qr2Pool = [...q1Winners, state.runnerUpBye];
  const qr2Seed: PoolSeed = (() => {
    const sorted = [...qr2Pool].sort((a, b) => (state.countries[a]?.countryRanking ?? 9999) - (state.countries[b]?.countryRanking ?? 9999));
    const half = Math.floor(sorted.length / 2);
    return { seeded: sorted.slice(0, half), unseeded: sorted.slice(half) };
  })();
  const qualifiersR2 = pairPool(state.countries, qr2Seed, "qualifiersR2", "Qualifiers R2");

  return {
    ...state,
    worldGroupIRound2,
    worldGroupIIRound2,
    qualifiersR2,
    history: {
      ...state.history,
      qualifiersR1Winners: q1Winners,
      qualifiersR1Losers: q1Losers,
      worldGroupIRound1Winners: wg1Winners,
      worldGroupIRound1Losers: wg1Losers,
      worldGroupIIRound2ByeCodes: worldGroupIIByeCodes,
    },
  };
};

/** Once September ties are complete, generate the Final Eight bracket. */
export const generateFinalEight = (state: DavisCupSeasonState): DavisCupSeasonState => {
  if (!allTiesComplete(state.qualifiersR2)) return state;
  if (state.finalEight.quarterFinals.length > 0) return state; // already generated

  const qr2Winners = winnerCodes(state.qualifiersR2);
  const qr2Losers = loserCodes(state.qualifiersR2);
  const participants = [...qr2Winners, state.championDefending];

  // Seed 1 (champion) vs weakest, etc. Simple bracket: sort by ranking, 1v8, 2v7, 3v6, 4v5.
  const sorted = [...participants].sort((a, b) => (state.countries[a]?.countryRanking ?? 9999) - (state.countries[b]?.countryRanking ?? 9999));
  const get = (code: string) => state.countries[code];
  const quarterFinals: DavisCupTie[] = [
    createTie("finalEight", "Final Eight - QF", get(sorted[0]), get(sorted[7])),
    createTie("finalEight", "Final Eight - QF", get(sorted[3]), get(sorted[4])),
    createTie("finalEight", "Final Eight - QF", get(sorted[2]), get(sorted[5])),
    createTie("finalEight", "Final Eight - QF", get(sorted[1]), get(sorted[6])),
  ].filter(t => t.country1Code && t.country2Code);

  const worldGroupIRound2Winners = winnerCodes(state.worldGroupIRound2);
  const worldGroupIRound2Losers = loserCodes(state.worldGroupIRound2);
  const worldGroupIIRound2Winners = winnerCodes(state.worldGroupIIRound2);
  const worldGroupIIRound2Losers = loserCodes(state.worldGroupIIRound2);

  return {
    ...state,
    finalEight: { ...state.finalEight, quarterFinals },
    history: {
      ...state.history,
      qualifiersR2Winners: qr2Winners,
      qualifiersR2Losers: qr2Losers,
      worldGroupIRound2Winners,
      worldGroupIRound2Losers,
      worldGroupIIRound2Winners,
      worldGroupIIRound2Losers,
      finalEightParticipants: participants,
    },
  };
};

export const advanceFinalEight = (state: DavisCupSeasonState): DavisCupSeasonState => {
  const fe = state.finalEight;
  const get = (code: string) => state.countries[code];

  if (allTiesComplete(fe.quarterFinals) && fe.semiFinals.length === 0) {
    const w = winnerCodes(fe.quarterFinals);
    const semiFinals: DavisCupTie[] = [
      createTie("finalEight", "Final Eight - SF", get(w[0]), get(w[1])),
      createTie("finalEight", "Final Eight - SF", get(w[2]), get(w[3])),
    ].filter(t => t.country1Code && t.country2Code);
    return { ...state, finalEight: { ...fe, semiFinals } };
  }

  if (fe.semiFinals.length > 0 && allTiesComplete(fe.semiFinals) && !fe.final) {
    const w = winnerCodes(fe.semiFinals);
    const final = createTie("finalEight", "Final Eight - Final", get(w[0]), get(w[1]));
    return { ...state, finalEight: { ...fe, final } };
  }

  if (fe.final?.winnerCode && !state.history.champion) {
    const champion = fe.final.winnerCode;
    const runnerUp = fe.final.winnerCode === fe.final.country1Code ? fe.final.country2Code : fe.final.country1Code;
    return { ...state, history: { ...state.history, champion, runnerUp } };
  }

  return state;
};

// ==================== MATCH RESOLUTION ====================

export const updateTieMatchResult = (
  tie: DavisCupTie,
  matchId: string,
  country1Won: boolean,
  result: MatchResult,
): DavisCupTie => {
  const updatedMatches = tie.series.matches.map(m => m.id === matchId ? { ...m, result, country1Won } : m);
  const newC1Wins = tie.series.country1Wins + (country1Won ? 1 : 0);
  const newC2Wins = tie.series.country2Wins + (country1Won ? 0 : 1);
  const winner = newC1Wins >= 3 ? tie.series.country1Code : newC2Wins >= 3 ? tie.series.country2Code : undefined;
  return {
    ...tie,
    series: { ...tie.series, matches: updatedMatches, country1Wins: newC1Wins, country2Wins: newC2Wins, winner },
    winnerCode: winner,
  };
};

const createDoublesPlayer = (p1: Player, p2: Player): Player => ({
  ...p1,
  id: -(p1.id * 1000 + p2.id),
  name: `${p1.name.split(" ").pop()}/${p2.name.split(" ").pop()}`,
  fictionalRanking: Math.round((p1.fictionalRanking + p2.fictionalRanking) / 2),
  officialRanking: Math.round((p1.officialRanking + p2.officialRanking) / 2),
});

/** Simulates every unplayed match of a tie against the CPU engine (used by the "Sim" button and by auto-resolve on week skip). */
export const simulateTie = (tie: DavisCupTie, getPlayer: (id: number) => Player | undefined): DavisCupTie => {
  if (tie.winnerCode || tie.isBye) return tie;
  let current = tie;
  for (const match of current.series.matches) {
    if (match.result) continue;
    if (current.winnerCode) break;
    let p1: Player | undefined, p2: Player | undefined;
    if (match.isDoubles) {
      const p1a = getPlayer(match.player1Id), p1b = getPlayer(match.player1PartnerId!);
      const p2a = getPlayer(match.player2Id), p2b = getPlayer(match.player2PartnerId!);
      if (!p1a || !p1b || !p2a || !p2b) continue;
      p1 = createDoublesPlayer(p1a, p1b);
      p2 = createDoublesPlayer(p2a, p2b);
    } else {
      p1 = getPlayer(match.player1Id);
      p2 = getPlayer(match.player2Id);
    }
    if (!p1 || !p2) continue;
    const result = playMatch(p1, p2, 3);
    const country1Won = result.winner.id === p1.id;
    current = updateTieMatchResult(current, match.id, country1Won, result);
  }
  return current;
};

/** Auto-resolves every unplayed tie in a list (used when the player skips a Davis Cup week without playing it). */
export const autoResolveTies = (ties: DavisCupTie[], getPlayer: (id: number) => Player | undefined): DavisCupTie[] =>
  ties.map(t => t.winnerCode ? t : simulateTie(t, getPlayer));
