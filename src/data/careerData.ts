import { Surface } from './players';

// ==================== CAREER TYPES ====================

export type Archetype = 'Balanced' | 'Aggressive' | 'Defensive' | 'Server' | 'Clutch' | 'Prospect';

export interface CareerAttributes {
  serve: number;       // 1-100
  return: number;
  rally: number;
  mentality: number;
  physical: number;
  consistency: number;
  pressure: number;
  recovery: number;
  surfaceHard: number;
  surfaceClay: number;
  surfaceGrass: number;
}

export interface CareerPlayer {
  firstName: string;
  lastName: string;
  nationality: string;
  countryCode: string;
  age: number;
  hand: 'Right' | 'Left';
  favoriteSurface?: Surface;
  archetype: Archetype;
  attributes: CareerAttributes;
  level: number;
  xp: number;
  xpToNextLevel: number;
  developmentPoints: number;
  totalDPEarned: number;
  fictionalRankingScore: number;
  officialRanking: number;
  livePoints: number;
  previousYearPoints: number[];
  money: number;
  energy: number;        // 0-100
  fatigue: number;       // 0-100 (high = bad)
  travelFatigue: number; // 0-100
  matchLoad: number;     // matches played recently
  form: number;          // -20 to +20
  momentum: number;      // 0-10
  injured: boolean;
  injuryType?: string;
  injuryWeeksRemaining: number;
  currentCity: string;
  currentCountry: string;
  currentContinent: string;
  consecutiveWeeksPlaying: number;
  weeksSinceRest: number;
  stats: CareerStats;
  seasonHistory: CareerSeasonEntry[];
  financialHistory: FinancialEntry[];
  injuryHistory: InjuryEntry[];
  objectives: CareerObjective[];
}

export interface CareerStats {
  wins: number;
  losses: number;
  titlesWon: number;
  tournamentsPlayed: number;
  matchesPlayed: number;
  bestRanking: number;
  bestResult: string;
  surfaceWins: Record<Surface, number>;
  surfaceLosses: Record<Surface, number>;
}

export interface CareerSeasonEntry {
  tournamentId: string;
  tournamentName: string;
  week: number;
  season: number;
  round: string;
  pointsEarned: number;
  moneyEarned: number;
  surface: Surface;
}

export interface FinancialEntry {
  week: number;
  season: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

export interface InjuryEntry {
  week: number;
  season: number;
  type: string;
  duration: number;
  cause: string;
}

export interface CareerObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  reward: { dp?: number; xp?: number; money?: number };
}

export type WeeklyAction = 'play' | 'train' | 'rest' | 'skip';

export type TrainingType = 'serve' | 'return' | 'physical' | 'mental' | 'surface' | 'recovery';

export interface CareerState {
  player: CareerPlayer | null;
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  isCreated: boolean;
  weeklyActionTaken: boolean;
}

// ==================== CONSTANTS ====================

export const ATTRIBUTE_MAX = 95;
export const ATTRIBUTE_MIN = 10;
export const MAX_LEVEL = 50;
export const BASE_DP_COST = 1; // cost to improve 1 point
export const DP_COST_SCALING = 0.05; // additional cost per current level
export const XP_PER_LEVEL_BASE = 100;
export const XP_PER_LEVEL_SCALING = 1.15;

export const ARCHETYPE_BONUSES: Record<Archetype, Partial<CareerAttributes>> = {
  Balanced: { serve: 5, return: 5, rally: 5, mentality: 5, physical: 5, consistency: 5, pressure: 5, recovery: 5 },
  Aggressive: { serve: 12, return: 2, rally: 3, mentality: 5, physical: 6, consistency: 2, pressure: 8, recovery: 2 },
  Defensive: { serve: 2, return: 12, rally: 10, mentality: 5, physical: 8, consistency: 10, pressure: 2, recovery: 6 },
  Server: { serve: 15, return: 2, rally: 2, mentality: 5, physical: 5, consistency: 4, pressure: 6, recovery: 3 },
  Clutch: { serve: 5, return: 5, rally: 4, mentality: 12, physical: 4, consistency: 5, pressure: 15, recovery: 3 },
  Prospect: { serve: 4, return: 4, rally: 4, mentality: 4, physical: 8, consistency: 4, pressure: 4, recovery: 8 },
};

export const BASE_ATTRIBUTES: CareerAttributes = {
  serve: 25, return: 25, rally: 25, mentality: 25, physical: 25,
  consistency: 25, pressure: 25, recovery: 25,
  surfaceHard: 25, surfaceClay: 25, surfaceGrass: 25,
};

// ==================== PRIZE MONEY ====================

export interface PrizeMoney {
  winner: number;
  finalist: number;
  sf: number;
  qf: number;
  r16: number;
  r32: number;
  r64: number;
  r128: number;
}

export const PRIZE_MONEY: Record<string, PrizeMoney> = {
  'Grand Slam': { winner: 3500000, finalist: 1800000, sf: 900000, qf: 530000, r16: 305000, r32: 190000, r64: 120000, r128: 80000 },
  'Masters 1000': { winner: 1100000, finalist: 570000, sf: 300000, qf: 160000, r16: 85000, r32: 45000, r64: 25000, r128: 0 },
  'ATP 500': { winner: 420000, finalist: 215000, sf: 110000, qf: 58000, r16: 30000, r32: 17000, r64: 0, r128: 0 },
  'ATP 250': { winner: 195000, finalist: 110000, sf: 58000, qf: 32000, r16: 18000, r32: 10000, r64: 0, r128: 0 },
};

// ==================== TRAVEL / CONTINENTS ====================

export type Continent = 'North America' | 'South America' | 'Europe' | 'Asia' | 'Oceania' | 'Middle East' | 'Africa';

export const CITY_DATA: Record<string, { continent: Continent; lat: number; lng: number }> = {
  // Oceania
  'Brisbane': { continent: 'Oceania', lat: -27.47, lng: 153.03 },
  'Adelaide': { continent: 'Oceania', lat: -34.93, lng: 138.60 },
  'Melbourne': { continent: 'Oceania', lat: -37.81, lng: 144.96 },
  'Auckland': { continent: 'Oceania', lat: -36.85, lng: 174.76 },
  // Asia
  'Hong Kong': { continent: 'Asia', lat: 22.32, lng: 114.17 },
  'Tokyo': { continent: 'Asia', lat: 35.68, lng: 139.69 },
  'Beijing': { continent: 'Asia', lat: 39.90, lng: 116.40 },
  'Shanghai': { continent: 'Asia', lat: 31.23, lng: 121.47 },
  'Chengdu': { continent: 'Asia', lat: 30.57, lng: 104.07 },
  'Hangzhou': { continent: 'Asia', lat: 30.27, lng: 120.15 },
  'Almaty': { continent: 'Asia', lat: 43.24, lng: 76.95 },
  // Europe
  'Montpellier': { continent: 'Europe', lat: 43.61, lng: 3.88 },
  'Rotterdam': { continent: 'Europe', lat: 51.92, lng: 4.48 },
  'Monaco': { continent: 'Europe', lat: 43.74, lng: 7.42 },
  'Barcelona': { continent: 'Europe', lat: 41.39, lng: 2.17 },
  'Munich': { continent: 'Europe', lat: 48.14, lng: 11.58 },
  'Madrid': { continent: 'Europe', lat: 40.42, lng: -3.70 },
  'Rome': { continent: 'Europe', lat: 41.90, lng: 12.50 },
  'Hamburg': { continent: 'Europe', lat: 53.55, lng: 9.99 },
  'Geneva': { continent: 'Europe', lat: 46.20, lng: 6.14 },
  'Paris': { continent: 'Europe', lat: 48.86, lng: 2.35 },
  "'s-Hertogenbosch": { continent: 'Europe', lat: 51.69, lng: 5.30 },
  'Stuttgart': { continent: 'Europe', lat: 48.78, lng: 9.18 },
  'Halle': { continent: 'Europe', lat: 52.08, lng: 11.97 },
  'London': { continent: 'Europe', lat: 51.51, lng: -0.13 },
  'Mallorca': { continent: 'Europe', lat: 39.57, lng: 2.65 },
  'Eastbourne': { continent: 'Europe', lat: 50.77, lng: 0.29 },
  'Båstad': { continent: 'Europe', lat: 56.43, lng: 12.85 },
  'Gstaad': { continent: 'Europe', lat: 46.47, lng: 7.29 },
  'Umag': { continent: 'Europe', lat: 45.44, lng: 13.52 },
  'Kitzbühel': { continent: 'Europe', lat: 47.45, lng: 12.39 },
  'Estoril': { continent: 'Europe', lat: 38.71, lng: -9.40 },
  'Bucharest': { continent: 'Europe', lat: 44.43, lng: 26.10 },
  'Basel': { continent: 'Europe', lat: 47.56, lng: 7.59 },
  'Vienna': { continent: 'Europe', lat: 48.21, lng: 16.37 },
  'Brussels': { continent: 'Europe', lat: 50.85, lng: 4.35 },
  'Lyon': { continent: 'Europe', lat: 45.76, lng: 4.84 },
  'Stockholm': { continent: 'Europe', lat: 59.33, lng: 18.07 },
  'Turin': { continent: 'Europe', lat: 45.07, lng: 7.69 },
  'Málaga': { continent: 'Europe', lat: 36.72, lng: -4.42 },
  'San Francisco': { continent: 'North America', lat: 37.77, lng: -122.42 },
  // North America
  'Dallas': { continent: 'North America', lat: 32.78, lng: -96.80 },
  'Delray Beach': { continent: 'North America', lat: 26.46, lng: -80.07 },
  'Indian Wells': { continent: 'North America', lat: 33.72, lng: -116.31 },
  'Miami': { continent: 'North America', lat: 25.76, lng: -80.19 },
  'Houston': { continent: 'North America', lat: 29.76, lng: -95.37 },
  'Washington': { continent: 'North America', lat: 38.91, lng: -77.04 },
  'Montreal': { continent: 'North America', lat: 45.50, lng: -73.57 },
  'Cincinnati': { continent: 'North America', lat: 39.10, lng: -84.51 },
  'Winston-Salem': { continent: 'North America', lat: 36.10, lng: -80.24 },
  'New York': { continent: 'North America', lat: 40.71, lng: -74.01 },
  'Los Cabos': { continent: 'North America', lat: 22.89, lng: -109.92 },
  'Acapulco': { continent: 'North America', lat: 16.86, lng: -99.88 },
  // South America
  'Buenos Aires': { continent: 'South America', lat: -34.60, lng: -58.38 },
  'Rio de Janeiro': { continent: 'South America', lat: -22.91, lng: -43.17 },
  'Santiago': { continent: 'South America', lat: -33.45, lng: -70.67 },
  // Middle East
  'Doha': { continent: 'Middle East', lat: 25.29, lng: 51.53 },
  'Dubai': { continent: 'Middle East', lat: 25.20, lng: 55.27 },
  // Africa
  'Marrakech': { continent: 'Africa', lat: 31.63, lng: -8.00 },
};

export function calculateTravelDistance(fromCity: string, toCity: string): number {
  const from = CITY_DATA[fromCity];
  const to = CITY_DATA[toCity];
  if (!from || !to) return 3000; // default medium distance
  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getTravelCost(distance: number): number {
  if (distance < 500) return 500;
  if (distance < 2000) return 1500;
  if (distance < 5000) return 3500;
  if (distance < 10000) return 6000;
  return 9000;
}

export function getTravelFatigue(distance: number, fromContinent: string, toContinent: string): number {
  let fatigue = Math.min(30, Math.floor(distance / 500));
  if (fromContinent !== toContinent) fatigue += 10;
  return fatigue;
}

// ==================== FICTIONAL RANKING SCORE CALC ====================

export function calculateFictionalRankingScore(attrs: CareerAttributes): number {
  return Math.round(
    attrs.serve * 0.12 +
    attrs.return * 0.11 +
    attrs.rally * 0.10 +
    attrs.mentality * 0.10 +
    attrs.physical * 0.09 +
    attrs.consistency * 0.12 +
    attrs.pressure * 0.10 +
    attrs.recovery * 0.06 +
    (attrs.surfaceHard + attrs.surfaceClay + attrs.surfaceGrass) * 0.067
  );
}

// Maps a 0-100 score to a fictional ranking position (lower = better)
export function scoreToFictionalRanking(score: number, totalPlayers: number): number {
  // Score 95+ = rank 1, score 25 = ~totalPlayers
  const maxRank = totalPlayers + 50; // can be outside top players
  const rank = Math.max(1, Math.round(maxRank - (score / 100) * maxRank));
  return rank;
}

// ==================== XP / LEVEL ====================

export function getXpForLevel(level: number): number {
  return Math.round(XP_PER_LEVEL_BASE * Math.pow(XP_PER_LEVEL_SCALING, level - 1));
}

export function getDPCost(currentValue: number): number {
  return Math.max(1, Math.floor(BASE_DP_COST + currentValue * DP_COST_SCALING));
}

// ==================== OBJECTIVES ====================

export function getDefaultObjectives(): CareerObjective[] {
  return [
    { id: 'first-win', title: 'First ATP Win', description: 'Win your first match on the ATP Tour', completed: false, reward: { dp: 3, xp: 50, money: 5000 } },
    { id: 'top-150', title: 'Top 150', description: 'Reach the Top 150 in the official ranking', completed: false, reward: { dp: 5, xp: 100, money: 10000 } },
    { id: 'top-100', title: 'Top 100', description: 'Reach the Top 100 in the official ranking', completed: false, reward: { dp: 8, xp: 200, money: 25000 } },
    { id: 'top-50', title: 'Top 50', description: 'Reach the Top 50 in the official ranking', completed: false, reward: { dp: 10, xp: 300, money: 50000 } },
    { id: 'top-20', title: 'Top 20', description: 'Reach the Top 20 in the official ranking', completed: false, reward: { dp: 15, xp: 500, money: 100000 } },
    { id: 'top-10', title: 'Top 10', description: 'Break into the Top 10', completed: false, reward: { dp: 20, xp: 700, money: 200000 } },
    { id: 'first-title', title: 'First Title', description: 'Win your first ATP tournament', completed: false, reward: { dp: 10, xp: 300, money: 50000 } },
    { id: 'gs-qualify', title: 'Grand Slam Debut', description: 'Compete in a Grand Slam main draw', completed: false, reward: { dp: 5, xp: 150, money: 20000 } },
    { id: 'gs-r16', title: 'Grand Slam R16', description: 'Reach the Round of 16 at a Grand Slam', completed: false, reward: { dp: 12, xp: 400, money: 75000 } },
    { id: 'gs-final', title: 'Grand Slam Final', description: 'Reach a Grand Slam Final', completed: false, reward: { dp: 20, xp: 800, money: 200000 } },
    { id: 'number-1', title: 'World No.1', description: 'Become the World Number 1', completed: false, reward: { dp: 30, xp: 1000, money: 500000 } },
  ];
}

// ==================== TRAINING ====================

export interface TrainingOption {
  type: TrainingType;
  label: string;
  description: string;
  icon: string;
  energyCost: number;
  fatigueCost: number;
  moneyCost: number;
  attributes: (keyof CareerAttributes)[];
  improvementRange: [number, number]; // min-max improvement per attribute
}

export const TRAINING_OPTIONS: TrainingOption[] = [
  { type: 'serve', label: 'Serve Training', description: 'Improve serve power and accuracy', icon: '🎾', energyCost: 15, fatigueCost: 10, moneyCost: 2000, attributes: ['serve'], improvementRange: [1, 3] },
  { type: 'return', label: 'Return Training', description: 'Work on return positioning and timing', icon: '🏓', energyCost: 15, fatigueCost: 10, moneyCost: 2000, attributes: ['return', 'rally'], improvementRange: [1, 2] },
  { type: 'physical', label: 'Physical Training', description: 'Build endurance and strength', icon: '💪', energyCost: 20, fatigueCost: 15, moneyCost: 1500, attributes: ['physical', 'recovery'], improvementRange: [1, 3] },
  { type: 'mental', label: 'Mental Training', description: 'Sharpen focus and resilience', icon: '🧠', energyCost: 10, fatigueCost: 5, moneyCost: 3000, attributes: ['mentality', 'pressure', 'consistency'], improvementRange: [1, 2] },
  { type: 'surface', label: 'Surface Adaptation', description: 'Practice on specific surfaces', icon: '🏟️', energyCost: 15, fatigueCost: 10, moneyCost: 2500, attributes: ['surfaceHard', 'surfaceClay', 'surfaceGrass'], improvementRange: [1, 3] },
  { type: 'recovery', label: 'Recovery Week', description: 'Light training with focus on recovery', icon: '🧘', energyCost: -20, fatigueCost: -25, moneyCost: 1000, attributes: ['recovery'], improvementRange: [0, 1] },
];

// ==================== COUNTRY LIST ====================

export const COUNTRIES = [
  { name: 'Argentina', code: 'ARG' }, { name: 'Australia', code: 'AUS' }, { name: 'Austria', code: 'AUT' },
  { name: 'Belgium', code: 'BEL' }, { name: 'Bosnia', code: 'BIH' }, { name: 'Brazil', code: 'BRA' },
  { name: 'Bulgaria', code: 'BUL' }, { name: 'Canada', code: 'CAN' }, { name: 'Chile', code: 'CHI' },
  { name: 'China', code: 'CHN' }, { name: 'Colombia', code: 'COL' }, { name: 'Croatia', code: 'CRO' },
  { name: 'Czech Republic', code: 'CZE' }, { name: 'Denmark', code: 'DEN' }, { name: 'Ecuador', code: 'ECU' },
  { name: 'Finland', code: 'FIN' }, { name: 'France', code: 'FRA' }, { name: 'Georgia', code: 'GEO' },
  { name: 'Germany', code: 'GER' }, { name: 'Great Britain', code: 'GBR' }, { name: 'Greece', code: 'GRE' },
  { name: 'Hungary', code: 'HUN' }, { name: 'India', code: 'IND' }, { name: 'Italy', code: 'ITA' },
  { name: 'Japan', code: 'JPN' }, { name: 'Kazakhstan', code: 'KAZ' }, { name: 'Mexico', code: 'MEX' },
  { name: 'Monaco', code: 'MON' }, { name: 'Netherlands', code: 'NED' }, { name: 'New Zealand', code: 'NZL' },
  { name: 'Norway', code: 'NOR' }, { name: 'Peru', code: 'PER' }, { name: 'Poland', code: 'POL' },
  { name: 'Portugal', code: 'POR' }, { name: 'Romania', code: 'ROU' }, { name: 'Russia', code: 'RUS' },
  { name: 'Serbia', code: 'SRB' }, { name: 'Slovakia', code: 'SVK' }, { name: 'South Korea', code: 'KOR' },
  { name: 'Spain', code: 'ESP' }, { name: 'Sweden', code: 'SWE' }, { name: 'Switzerland', code: 'SUI' },
  { name: 'USA', code: 'USA' }, { name: 'Uruguay', code: 'URU' },
];
