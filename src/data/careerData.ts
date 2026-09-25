import { Surface, Player, initialPlayers, PlayerStats, SurfaceAffinity } from './players';
import { DavisCupSeasonState } from './davisCupData';

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

export type SponsorCategory = 'Equipment' | 'Apparel' | 'Technology' | 'Beverage' | 'Financial' | 'Travel' | 'Watch' | 'Automotive';

export interface Sponsor {
  id: string;
  name: string;
  category: SponsorCategory;
  weeklyIncome: number;
  winBonus: number;
  titleBonus: number;
  travelDiscount: number;
  minRanking: number;
  duration: number;
  description: string;
  weeklyFatigueIncrease?: number;  // endorsements, interviews, events
  weeklyEnergyDrain?: number;       // galas, media obligations
  trainingEfficiencyPenalty?: number; // 0-1, reduces training output
}

export interface ActiveSponsor {
  sponsor: Sponsor;
  weeksRemaining: number;
  totalEarned: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'coach' | 'fitness' | 'physio' | 'mental';
  quality: 'basic' | 'pro' | 'elite';
  weeklyCost: number;
  description: string;
  effects: {
    trainingEfficiency?: number;
    recoveryBonus?: number;
    injuryPrevention?: number;
    fatigueReduction?: number;
    weeklyServe?: number;
    weeklyReturn?: number;
    weeklyRally?: number;
    weeklyConsistency?: number;
    weeklyPressure?: number;
    weeklyPhysical?: number;
    weeklyMentality?: number;
    weeklyRecovery?: number;
  };
}

export interface ActiveStaff {
  member: StaffMember;
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
  officialPoints: number;
  livePoints: number;
  previousYearPoints: number[];
  currentYearWeeklyPoints: number[];
  money: number;
  energy: number;
  fatigue: number;
  travelFatigue: number;
  matchLoad: number;
  form: number;
  momentum: number;
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
  sponsors: ActiveSponsor[];
  staff: ActiveStaff[];
  matchHistory: CareerMatchRecord[];
  reputation: number; // 0-1000, starts at 50
  rankingHistory: { week: number; season: number; ranking: number }[];
  weeklyPlan: WeeklyPlanEntry[];
}

export interface CareerMatchRecord {
  opponentId: number;
  opponentName: string;
  won: boolean;
  surface: Surface;
  season: number;
  week: number;
  tournamentId: string;
  round: string;
}

export interface WeeklyPlanEntry {
  week: number;
  type: 'tournament' | 'training' | 'rest' | 'unplanned';
  tournamentId?: string;
  trainingType?: string;
  note?: string;
}

export interface CareerStats {
  wins: number;
  losses: number;
  titlesWon: number;
  titlesDetail?: TitleDetail[];
  tournamentsPlayed: number;
  matchesPlayed: number;
  bestRanking: number;
  bestResult: string;
  surfaceWins: Record<Surface, number>;
  surfaceLosses: Record<Surface, number>;
}

export interface TitleDetail {
  tournamentName: string;
  category: string;
  season: number;
  week: number;
  surface: Surface;
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

export interface CareerTournamentResult {
  tournamentId: string;
  week: number;
  season: number;
  winnerId: number;
  winnerName: string;
  runnerUpId: number;
  runnerUpName: string;
  results: { playerId: number; points: number; round: string }[];
}

export interface CareerSeasonSummaryData {
  season: number;
  topRanking: { name: string; points: number }[];
  grandSlamWinners: { tournament: string; winner: string }[];
  masters1000Winners: { tournament: string; winner: string }[];
  retiredPlayers: string[];
  newPlayers: string[];
}

export interface NewsItem {
  id: string;
  headline: string;
  detail?: string;
  type: 'tournament' | 'ranking' | 'career' | 'general';
  week: number;
  season: number;
  // Popup detail fields
  tournamentName?: string;
  tournamentCategory?: string;
  tournamentCity?: string;
  tournamentCountry?: string;
  tournamentSurface?: string;
  winnerName?: string;
  runnerUpName?: string;
  winnerNewRanking?: number;
  runnerUpNewRanking?: number;
  pointsAwarded?: number;
  rankBefore?: number;
  rankAfter?: number;
  body?: string;
}

export interface CareerState {
  player: CareerPlayer | null;
  allPlayers: Player[];
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  tournamentHistory: CareerTournamentResult[];
  isCreated: boolean;
  weeklyActionTaken: boolean;
  activeTournament: string | null;
  currentDraw: any | null;
  seasonSummary?: CareerSeasonSummaryData | null;
  globalH2H: Record<string, [number, number]>; // key: "${minId}-${maxId}", value: [wins_by_minId, wins_by_maxId]
  newsItems: NewsItem[];
  weeklyUsedPlayerIds: number[]; // IDs of players committed to a tournament this week (to prevent cross-tournament duplication)
  davisCupSeason: DavisCupSeasonState | null;
}

// ==================== CONSTANTS ====================

export const ATTRIBUTE_MAX = 95;
export const ATTRIBUTE_MIN = 10;
export const MAX_LEVEL = 50;
export const BASE_DP_COST = 1;
export const DP_COST_SCALING = 0.05;
export const XP_PER_LEVEL_BASE = 100;
export const XP_PER_LEVEL_SCALING = 1.15;
export const CAREER_PLAYER_ID = -1;

export const ARCHETYPE_BONUSES: Record<Archetype, Partial<CareerAttributes>> = {
  Balanced: { serve: 5, return: 5, rally: 5, mentality: 5, physical: 5, consistency: 5, pressure: 5, recovery: 5 },
  Aggressive: { serve: 12, return: 2, rally: 3, mentality: 5, physical: 6, consistency: 2, pressure: 8, recovery: 2 },
  Defensive: { serve: 2, return: 12, rally: 10, mentality: 5, physical: 8, consistency: 10, pressure: 2, recovery: 6 },
  Server: { serve: 15, return: 2, rally: 2, mentality: 5, physical: 5, consistency: 4, pressure: 6, recovery: 3 },
  Clutch: { serve: 5, return: 5, rally: 4, mentality: 12, physical: 4, consistency: 5, pressure: 15, recovery: 3 },
  Prospect: { serve: 4, return: 4, rally: 4, mentality: 4, physical: 8, consistency: 4, pressure: 4, recovery: 8 },
};

export const BASE_ATTRIBUTES: CareerAttributes = {
  serve: 20, return: 20, rally: 20, mentality: 20, physical: 20,
  consistency: 20, pressure: 20, recovery: 20,
  surfaceHard: 20, surfaceClay: 20, surfaceGrass: 20,
};

// ==================== SPONSORS ====================

export const AVAILABLE_SPONSORS: Sponsor[] = [
  // ── EQUIPMENT ──────────────────────────────────────────────────────────────
  { id: 'prince', name: 'Prince', category: 'Equipment', weeklyIncome: 600, winBonus: 100, titleBonus: 2000, travelDiscount: 0, minRanking: 503, duration: 26, description: 'Entry equipment deal for emerging players. No media obligations.' },
  { id: 'tecnifibre', name: 'Tecnifibre', category: 'Equipment', weeklyIncome: 700, winBonus: 130, titleBonus: 2500, travelDiscount: 0, minRanking: 450, duration: 26, description: 'Racquet and strings sponsor. Simple deal, occasional social posts.' },
  { id: 'head', name: 'HEAD', category: 'Equipment', weeklyIncome: 900, winBonus: 180, titleBonus: 4000, travelDiscount: 0, minRanking: 400, duration: 26, description: 'Established equipment brand. Low-key contract for developing talent.' },
  { id: 'babolat', name: 'Babolat', category: 'Equipment', weeklyIncome: 1100, winBonus: 220, titleBonus: 5500, travelDiscount: 0, minRanking: 300, duration: 26, description: 'Iconic racquet brand. Occasional promo events required.' },
  { id: 'yonex', name: 'Yonex', category: 'Equipment', weeklyIncome: 1400, winBonus: 280, titleBonus: 7000, travelDiscount: 0, minRanking: 200, duration: 26, description: 'Premium Japanese equipment. Photoshoots and product launches.' },
  { id: 'wilson', name: 'Wilson', category: 'Equipment', weeklyIncome: 2000, winBonus: 400, titleBonus: 12000, travelDiscount: 0, minRanking: 100, duration: 26, description: 'Top equipment brand. Global presence and media duties.', weeklyFatigueIncrease: 1 },
  { id: 'dunlop', name: 'Dunlop', category: 'Equipment', weeklyIncome: 2500, winBonus: 500, titleBonus: 15000, travelDiscount: 0, minRanking: 50, duration: 52, description: 'Historic brand, full tour support. Events and ambassador duties.', weeklyFatigueIncrease: 2 },

  // ── APPAREL ────────────────────────────────────────────────────────────────
  { id: 'lotto', name: 'Lotto', category: 'Apparel', weeklyIncome: 700, winBonus: 120, titleBonus: 3000, travelDiscount: 0, minRanking: 450, duration: 26, description: 'Italian sportswear. Basic deal, minimal obligations.' },
  { id: 'fila', name: 'Fila', category: 'Apparel', weeklyIncome: 900, winBonus: 160, titleBonus: 4000, travelDiscount: 0, minRanking: 350, duration: 26, description: 'Classic tennis brand. Photoshoots and seasonal campaigns.' },
  { id: 'asics', name: 'ASICS', category: 'Apparel', weeklyIncome: 1500, winBonus: 300, titleBonus: 8000, travelDiscount: 0.05, minRanking: 250, duration: 26, description: 'Footwear & apparel. Minor media duties, manageable schedule.' },
  { id: 'new-balance', name: 'New Balance', category: 'Apparel', weeklyIncome: 2000, winBonus: 400, titleBonus: 11000, travelDiscount: 0.05, minRanking: 180, duration: 26, description: 'Athletic apparel. 1 photoshoot per season, light schedule.', weeklyFatigueIncrease: 1 },
  { id: 'under-armour', name: 'Under Armour', category: 'Apparel', weeklyIncome: 2500, winBonus: 500, titleBonus: 14000, travelDiscount: 0.08, minRanking: 120, duration: 26, description: 'Performance apparel. Regular content creation required.', weeklyFatigueIncrease: 2 },
  { id: 'lacoste', name: 'Lacoste', category: 'Apparel', weeklyIncome: 3000, winBonus: 600, titleBonus: 18000, travelDiscount: 0.08, minRanking: 80, duration: 26, description: 'Classic sportswear & fashion. Events and brand appearances.', weeklyFatigueIncrease: 2 },
  { id: 'nike-basic', name: 'Nike (Challenger)', category: 'Apparel', weeklyIncome: 4000, winBonus: 800, titleBonus: 22000, travelDiscount: 0.12, minRanking: 50, duration: 26, description: 'Entry Nike deal. Regular content creation and social media.', weeklyFatigueIncrease: 3 },
  { id: 'adidas', name: 'Adidas', category: 'Apparel', weeklyIncome: 5500, winBonus: 1100, titleBonus: 35000, travelDiscount: 0.15, minRanking: 30, duration: 52, description: 'Premium sportswear. Campaign shoots and global brand events.', weeklyFatigueIncrease: 3, trainingEfficiencyPenalty: 0.05 },
  { id: 'nike-elite', name: 'Nike (Elite)', category: 'Apparel', weeklyIncome: 9000, winBonus: 2200, titleBonus: 80000, travelDiscount: 0.25, minRanking: 10, duration: 52, description: 'Top-tier Nike contract. Relentless global campaigns and media tours.', weeklyFatigueIncrease: 5, weeklyEnergyDrain: 3, trainingEfficiencyPenalty: 0.1 },

  // ── TECHNOLOGY ─────────────────────────────────────────────────────────────
  { id: 'lenovo', name: 'Lenovo', category: 'Technology', weeklyIncome: 1200, winBonus: 200, titleBonus: 6000, travelDiscount: 0, minRanking: 300, duration: 26, description: 'Tech brand. Product launches and digital content.', weeklyFatigueIncrease: 1 },
  { id: 'sony', name: 'Sony', category: 'Technology', weeklyIncome: 1800, winBonus: 350, titleBonus: 9000, travelDiscount: 0, minRanking: 200, duration: 26, description: 'Electronics giant. Campaigns and gaming/sports crossovers.', weeklyFatigueIncrease: 2 },
  { id: 'samsung', name: 'Samsung', category: 'Technology', weeklyIncome: 2500, winBonus: 500, titleBonus: 14000, travelDiscount: 0, minRanking: 120, duration: 26, description: 'Global tech brand. Product launches and digital content creation.', weeklyFatigueIncrease: 3, trainingEfficiencyPenalty: 0.05 },
  { id: 'apple', name: 'Apple', category: 'Technology', weeklyIncome: 5000, winBonus: 1000, titleBonus: 30000, travelDiscount: 0, minRanking: 30, duration: 52, description: 'Premium tech. High-profile launches and global campaigns.', weeklyFatigueIncrease: 4, weeklyEnergyDrain: 3, trainingEfficiencyPenalty: 0.08 },

  // ── BEVERAGE ───────────────────────────────────────────────────────────────
  { id: 'evian', name: 'Evian', category: 'Beverage', weeklyIncome: 800, winBonus: 150, titleBonus: 4000, travelDiscount: 0, minRanking: 400, duration: 26, description: 'Water sponsor. Low-key deal, mostly court-side branding.' },
  { id: 'gatorade', name: 'Gatorade', category: 'Beverage', weeklyIncome: 1200, winBonus: 250, titleBonus: 6000, travelDiscount: 0, minRanking: 250, duration: 26, description: 'Sports drink. Ads and social media content.', weeklyFatigueIncrease: 1 },
  { id: 'pepsi', name: 'Pepsi', category: 'Beverage', weeklyIncome: 2000, winBonus: 400, titleBonus: 10000, travelDiscount: 0, minRanking: 150, duration: 26, description: 'Beverage giant. Regular commercials and public events.', weeklyFatigueIncrease: 2 },
  { id: 'red-bull', name: 'Red Bull', category: 'Beverage', weeklyIncome: 3500, winBonus: 700, titleBonus: 22000, travelDiscount: 0.1, minRanking: 80, duration: 52, description: 'Energy brand. Content creation, stunts and live events.', weeklyFatigueIncrease: 4, weeklyEnergyDrain: 3 },
  { id: 'heineken', name: 'Heineken', category: 'Beverage', weeklyIncome: 4000, winBonus: 0, titleBonus: 18000, travelDiscount: 0.05, minRanking: 50, duration: 52, description: 'Premium beer brand. Hospitality events and global campaigns.', weeklyFatigueIncrease: 3, weeklyEnergyDrain: 2 },

  // ── FINANCIAL ──────────────────────────────────────────────────────────────
  { id: 'bnp-paribas', name: 'BNP Paribas', category: 'Financial', weeklyIncome: 1500, winBonus: 0, titleBonus: 8000, travelDiscount: 0.1, minRanking: 300, duration: 26, description: 'Major tennis sponsor. Low-key hospitality and brand events.' },
  { id: 'barclays', name: 'Barclays', category: 'Financial', weeklyIncome: 2000, winBonus: 0, titleBonus: 10000, travelDiscount: 0.12, minRanking: 200, duration: 26, description: 'UK banking giant. Client hospitality and formal events.', weeklyFatigueIncrease: 1 },
  { id: 'mastercard', name: 'Mastercard', category: 'Financial', weeklyIncome: 3500, winBonus: 0, titleBonus: 18000, travelDiscount: 0.15, minRanking: 80, duration: 52, description: 'Global payment brand. Client hospitality and formal events.', weeklyFatigueIncrease: 2, trainingEfficiencyPenalty: 0.05 },
  { id: 'amex', name: 'American Express', category: 'Financial', weeklyIncome: 4500, winBonus: 0, titleBonus: 25000, travelDiscount: 0.2, minRanking: 40, duration: 52, description: 'Premium financial brand. VIP events, business galas and hospitality.', weeklyFatigueIncrease: 3, trainingEfficiencyPenalty: 0.07 },

  // ── TRAVEL ─────────────────────────────────────────────────────────────────
  { id: 'marriott', name: 'Marriott', category: 'Travel', weeklyIncome: 1000, winBonus: 0, titleBonus: 5000, travelDiscount: 0.2, minRanking: 350, duration: 26, description: 'Hotel chain. Branding at stays, minimal obligations.' },
  { id: 'qatar-airways', name: 'Qatar Airways', category: 'Travel', weeklyIncome: 2000, winBonus: 0, titleBonus: 0, travelDiscount: 0.35, minRanking: 150, duration: 52, description: 'Premium airline. Airport appearances and airline promotions.', weeklyFatigueIncrease: 1 },
  { id: 'emirates', name: 'Emirates', category: 'Travel', weeklyIncome: 3000, winBonus: 0, titleBonus: 0, travelDiscount: 0.45, minRanking: 80, duration: 52, description: 'Flagship airline sponsor. Heavy travel schedule, global appearances.', weeklyFatigueIncrease: 2 },
  { id: 'ritz-carlton', name: 'Ritz-Carlton', category: 'Travel', weeklyIncome: 4000, winBonus: 0, titleBonus: 15000, travelDiscount: 0.3, minRanking: 30, duration: 52, description: 'Ultra-luxury hotel. VIP events, galas and premium branding.', weeklyFatigueIncrease: 2, weeklyEnergyDrain: 2 },

  // ── WATCH ──────────────────────────────────────────────────────────────────
  { id: 'longines', name: 'Longines', category: 'Watch', weeklyIncome: 1500, winBonus: 300, titleBonus: 8000, travelDiscount: 0, minRanking: 250, duration: 26, description: 'Swiss watch brand. Photoshoots and award ceremonies.' },
  { id: 'hublot', name: 'Hublot', category: 'Watch', weeklyIncome: 2500, winBonus: 600, titleBonus: 15000, travelDiscount: 0.05, minRanking: 100, duration: 52, description: 'Luxury watch. VIP events and brand galas.', weeklyFatigueIncrease: 2, weeklyEnergyDrain: 1 },
  { id: 'tag-heuer', name: 'TAG Heuer', category: 'Watch', weeklyIncome: 4000, winBonus: 900, titleBonus: 28000, travelDiscount: 0.1, minRanking: 50, duration: 52, description: 'Iconic luxury watch. Award ceremonies and brand galas.', weeklyFatigueIncrease: 3, weeklyEnergyDrain: 2 },
  { id: 'omega', name: 'Omega', category: 'Watch', weeklyIncome: 5500, winBonus: 1200, titleBonus: 45000, travelDiscount: 0.1, minRanking: 25, duration: 52, description: 'Premium watch. Frequent global events and formal appearances.', weeklyFatigueIncrease: 3, weeklyEnergyDrain: 3 },
  { id: 'rolex', name: 'Rolex', category: 'Watch', weeklyIncome: 9000, winBonus: 2500, titleBonus: 90000, travelDiscount: 0.2, minRanking: 10, duration: 52, description: 'The pinnacle. Relentless global ambassador duties.', weeklyFatigueIncrease: 5, weeklyEnergyDrain: 5, trainingEfficiencyPenalty: 0.12 },

  // ── AUTOMOTIVE ─────────────────────────────────────────────────────────────
  { id: 'kia', name: 'Kia', category: 'Automotive', weeklyIncome: 1200, winBonus: 200, titleBonus: 6000, travelDiscount: 0.1, minRanking: 300, duration: 26, description: 'Official ATP car partner. Light branding and social content.' },
  { id: 'bmw', name: 'BMW', category: 'Automotive', weeklyIncome: 2500, winBonus: 500, titleBonus: 15000, travelDiscount: 0.15, minRanking: 100, duration: 52, description: 'Premium automotive. Events and brand ambassadorship.', weeklyFatigueIncrease: 2 },
  { id: 'audi', name: 'Audi', category: 'Automotive', weeklyIncome: 3000, winBonus: 600, titleBonus: 18000, travelDiscount: 0.15, minRanking: 70, duration: 52, description: 'Luxury automotive. Race events and VIP dinners.', weeklyFatigueIncrease: 2, weeklyEnergyDrain: 1 },
  { id: 'porsche', name: 'Porsche', category: 'Automotive', weeklyIncome: 5000, winBonus: 1200, titleBonus: 40000, travelDiscount: 0.18, minRanking: 25, duration: 52, description: 'Prestige automotive. Race events, VIP dinners and corporate functions.', weeklyFatigueIncrease: 4, weeklyEnergyDrain: 3 },
  { id: 'mercedes', name: 'Mercedes-Benz', category: 'Automotive', weeklyIncome: 6500, winBonus: 1500, titleBonus: 55000, travelDiscount: 0.2, minRanking: 15, duration: 52, description: 'Premium global brand. Intensive ambassador schedule.', weeklyFatigueIncrease: 4, weeklyEnergyDrain: 4, trainingEfficiencyPenalty: 0.1 },
];

// ==================== STAFF ====================

export const AVAILABLE_STAFF: StaffMember[] = [
  // === COACHES ===
  { id: 'coach-basic', name: 'Marco Delgado', role: 'coach', quality: 'basic', weeklyCost: 1500, description: 'Solid foundations, improves training output', effects: { trainingEfficiency: 1.3 } },
  { id: 'coach-pro', name: 'Carlos Vega', role: 'coach', quality: 'pro', weeklyCost: 4500, description: 'Experienced tour coach, sharp tactical mind', effects: { trainingEfficiency: 1.6, weeklyMentality: 1 } },
  { id: 'coach-serve', name: 'Ivan Krasnov', role: 'coach', quality: 'pro', weeklyCost: 5500, description: 'Serve specialist — weekly serve technique sessions', effects: { trainingEfficiency: 1.2, weeklyServe: 1.5 } },
  { id: 'coach-return', name: 'Rodrigo Faria', role: 'coach', quality: 'pro', weeklyCost: 5500, description: 'Return of serve expert — methodical breakdown sessions', effects: { trainingEfficiency: 1.2, weeklyReturn: 1.5 } },
  { id: 'coach-rally', name: 'Thierry Dupont', role: 'coach', quality: 'pro', weeklyCost: 5500, description: 'Baseline specialist — rally and footwork focus', effects: { trainingEfficiency: 1.2, weeklyRally: 1.5 } },
  { id: 'coach-elite', name: 'Patrick Renaud', role: 'coach', quality: 'elite', weeklyCost: 9000, description: 'Former top-10 coach, world-class development', effects: { trainingEfficiency: 2.0, weeklyMentality: 2 } },
  { id: 'coach-elite-all', name: 'Gregor Haas', role: 'coach', quality: 'elite', weeklyCost: 14000, description: 'Grand Slam winning coach, all-around elite development', effects: { trainingEfficiency: 2.2, weeklyMentality: 2, weeklyServe: 1, weeklyReturn: 1 } },
  // === FITNESS ===
  { id: 'fitness-basic', name: 'Tony Marcello', role: 'fitness', quality: 'basic', weeklyCost: 1000, description: 'Basic conditioning, keeps fatigue manageable', effects: { fatigueReduction: 5, weeklyPhysical: 0.5 } },
  { id: 'fitness-pro', name: 'Stefan Kovač', role: 'fitness', quality: 'pro', weeklyCost: 3200, description: 'Pro-level conditioning and recovery protocols', effects: { fatigueReduction: 10, recoveryBonus: 5, weeklyPhysical: 1, weeklyRecovery: 0.5 } },
  { id: 'fitness-endurance', name: 'Dmitri Volkov', role: 'fitness', quality: 'pro', weeklyCost: 4500, description: 'Endurance specialist — builds physical base week by week', effects: { fatigueReduction: 8, weeklyPhysical: 1.5, weeklyRecovery: 0.5 } },
  { id: 'fitness-elite', name: 'Marcus Okafor', role: 'fitness', quality: 'elite', weeklyCost: 6500, description: 'Peak physical conditioning, elite recovery', effects: { fatigueReduction: 15, recoveryBonus: 10, weeklyPhysical: 2, weeklyRecovery: 1 } },
  { id: 'fitness-elite-2', name: 'Luca Ferretti', role: 'fitness', quality: 'elite', weeklyCost: 10000, description: 'Olympic athletics trainer, peak human performance', effects: { fatigueReduction: 18, recoveryBonus: 14, weeklyPhysical: 2.5, weeklyRecovery: 1.5 } },
  // === PHYSIO ===
  { id: 'physio-basic', name: 'Ana Herrera', role: 'physio', quality: 'basic', weeklyCost: 1500, description: 'Injury prevention and basic recovery care', effects: { recoveryBonus: 8, injuryPrevention: 0.3, weeklyRecovery: 0.5 } },
  { id: 'physio-pro', name: 'Dr. James Whitfield', role: 'physio', quality: 'pro', weeklyCost: 4200, description: 'Sports physio with tour experience', effects: { recoveryBonus: 15, injuryPrevention: 0.5, weeklyRecovery: 1 } },
  { id: 'physio-elite', name: 'Dr. Sofia Nakamura', role: 'physio', quality: 'elite', weeklyCost: 7500, description: 'Best-in-class medical team, rapid injury return', effects: { recoveryBonus: 25, injuryPrevention: 0.7, weeklyRecovery: 1.5 } },
  { id: 'physio-specialist', name: 'Dr. Erik Svensson', role: 'physio', quality: 'elite', weeklyCost: 13000, description: 'Elite sports medicine specialist, used by top-5 players', effects: { recoveryBonus: 30, injuryPrevention: 0.85, fatigueReduction: 5, weeklyRecovery: 2 } },
  // === MENTAL ===
  { id: 'mental-basic', name: 'David Park', role: 'mental', quality: 'basic', weeklyCost: 2000, description: 'Focus and pressure training basics', effects: { weeklyMentality: 1, weeklyPressure: 0.5 } },
  { id: 'mental-pro', name: 'Dr. Amelia Chase', role: 'mental', quality: 'pro', weeklyCost: 5500, description: 'Sports psychologist, clutch performance coaching', effects: { weeklyMentality: 2, weeklyPressure: 1.5 } },
  { id: 'mental-elite', name: 'Prof. Yuki Tanaka', role: 'mental', quality: 'elite', weeklyCost: 9500, description: 'World-renowned sports psychologist, elite mental fortitude', effects: { weeklyMentality: 3, weeklyPressure: 2, weeklyConsistency: 1 } },
  { id: 'mental-consistency', name: 'Dr. Marco Rossi', role: 'mental', quality: 'elite', weeklyCost: 12000, description: 'Pressure and consistency master — trains you to hold serves under fire', effects: { weeklyMentality: 2, weeklyPressure: 2.5, weeklyConsistency: 2 } },
];

// ==================== PRIZE MONEY ====================

export interface PrizeMoney {
  winner: number; finalist: number; sf: number; qf: number;
  r16: number; r32: number; r64: number; r128: number;
}

export const PRIZE_MONEY: Record<string, PrizeMoney> = {
  'Grand Slam': { winner: 3500000, finalist: 1800000, sf: 900000, qf: 530000, r16: 305000, r32: 190000, r64: 120000, r128: 80000 },
  'Masters 1000': { winner: 1100000, finalist: 570000, sf: 300000, qf: 160000, r16: 85000, r32: 45000, r64: 25000, r128: 0 },
  'ATP 500': { winner: 420000, finalist: 215000, sf: 110000, qf: 58000, r16: 30000, r32: 17000, r64: 0, r128: 0 },
  'ATP 250': { winner: 195000, finalist: 110000, sf: 58000, qf: 32000, r16: 18000, r32: 10000, r64: 0, r128: 0 },
  'Challenger 175': { winner: 120000, finalist: 65000, sf: 35000, qf: 18000, r16: 10000, r32: 5000, r64: 0, r128: 0 },
  'Challenger 125': { winner: 90000, finalist: 48000, sf: 26000, qf: 14000, r16: 8000, r32: 4000, r64: 0, r128: 0 },
  'Challenger 100': { winner: 65000, finalist: 35000, sf: 18000, qf: 10000, r16: 5500, r32: 2800, r64: 0, r128: 0 },
  'Challenger 75': { winner: 45000, finalist: 24000, sf: 13000, qf: 7000, r16: 3800, r32: 1900, r64: 0, r128: 0 },
  'Challenger 50': { winner: 30000, finalist: 16000, sf: 8500, qf: 4800, r16: 2600, r32: 1300, r64: 0, r128: 0 },
  'ITF M25': { winner: 25000, finalist: 14000, sf: 8000, qf: 4500, r16: 2500, r32: 0, r64: 0, r128: 0 },
  'ITF M15': { winner: 15000, finalist: 8500, sf: 5000, qf: 2800, r16: 1500, r32: 0, r64: 0, r128: 0 },
};

// ==================== TRAVEL / CONTINENTS ====================

export type Continent = 'North America' | 'South America' | 'Europe' | 'Asia' | 'Oceania' | 'Middle East' | 'Africa';

export const CITY_DATA: Record<string, { continent: Continent; lat: number; lng: number }> = {
  // Oceania
  'Brisbane': { continent: 'Oceania', lat: -27.47, lng: 153.03 },
  'Adelaide': { continent: 'Oceania', lat: -34.93, lng: 138.60 },
  'Melbourne': { continent: 'Oceania', lat: -37.81, lng: 144.96 },
  'Auckland': { continent: 'Oceania', lat: -36.85, lng: 174.76 },
  'Canberra': { continent: 'Oceania', lat: -35.28, lng: 149.13 },
  'Burnie': { continent: 'Oceania', lat: -41.05, lng: 145.90 },
  'Playford': { continent: 'Oceania', lat: -34.72, lng: 138.68 },
  'Nouméa': { continent: 'Oceania', lat: -22.28, lng: 166.46 },
  // Asia
  'Hong Kong': { continent: 'Asia', lat: 22.32, lng: 114.17 },
  'Tokyo': { continent: 'Asia', lat: 35.68, lng: 139.69 },
  'Beijing': { continent: 'Asia', lat: 39.90, lng: 116.40 },
  'Shanghai': { continent: 'Asia', lat: 31.23, lng: 121.47 },
  'Chengdu': { continent: 'Asia', lat: 30.57, lng: 104.07 },
  'Hangzhou': { continent: 'Asia', lat: 30.27, lng: 120.15 },
  'Almaty': { continent: 'Asia', lat: 43.24, lng: 76.95 },
  'Nonthaburi': { continent: 'Asia', lat: 13.86, lng: 100.51 },
  'Pune': { continent: 'Asia', lat: 18.52, lng: 73.86 },
  'Bengaluru': { continent: 'Asia', lat: 12.97, lng: 77.59 },
  'New Delhi': { continent: 'Asia', lat: 28.61, lng: 77.21 },
  'Busan': { continent: 'Asia', lat: 35.18, lng: 129.08 },
  'Gwangju': { continent: 'Asia', lat: 35.16, lng: 126.85 },
  'Seoul': { continent: 'Asia', lat: 37.57, lng: 126.98 },
  'Shenzhen': { continent: 'Asia', lat: 22.54, lng: 114.06 },
  'Guangzhou': { continent: 'Asia', lat: 23.13, lng: 113.26 },
  'Wuxi': { continent: 'Asia', lat: 31.49, lng: 120.31 },
  'Taipei': { continent: 'Asia', lat: 25.03, lng: 121.57 },
  'Zhangjiagang': { continent: 'Asia', lat: 31.87, lng: 120.55 },
  'Jinan': { continent: 'Asia', lat: 36.65, lng: 116.99 },
  'Matsuyama': { continent: 'Asia', lat: 33.84, lng: 132.77 },
  'Kobe': { continent: 'Asia', lat: 34.69, lng: 135.20 },
  'Yokohama': { continent: 'Asia', lat: 35.44, lng: 139.64 },
  'Yokkaichi': { continent: 'Asia', lat: 34.97, lng: 136.62 },
  'Astana': { continent: 'Asia', lat: 51.17, lng: 71.45 },
  // Middle East
  'Doha': { continent: 'Middle East', lat: 25.29, lng: 51.53 },
  'Dubai': { continent: 'Middle East', lat: 25.20, lng: 55.27 },
  'Manama': { continent: 'Middle East', lat: 26.23, lng: 50.59 },
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
  'Tenerife': { continent: 'Europe', lat: 28.47, lng: -16.25 },
  'Oeiras': { continent: 'Europe', lat: 38.69, lng: -9.31 },
  'Ottignies': { continent: 'Europe', lat: 50.67, lng: 4.57 },
  'Quimper': { continent: 'Europe', lat: 48.00, lng: -4.10 },
  'Koblenz': { continent: 'Europe', lat: 50.36, lng: 7.59 },
  'Cherbourg': { continent: 'Europe', lat: 49.64, lng: -1.62 },
  'Pau': { continent: 'Europe', lat: 43.30, lng: -0.37 },
  'Lille': { continent: 'Europe', lat: 50.63, lng: 3.06 },
  'Lugano': { continent: 'Europe', lat: 46.00, lng: 8.95 },
  'Székesfehérvár': { continent: 'Europe', lat: 47.19, lng: 18.41 },
  'Murcia': { continent: 'Europe', lat: 37.98, lng: -1.13 },
  'Zadar': { continent: 'Europe', lat: 44.12, lng: 15.23 },
  'Napoli': { continent: 'Europe', lat: 40.85, lng: 14.27 },
  'Girona': { continent: 'Europe', lat: 41.98, lng: 2.82 },
  'Barletta': { continent: 'Europe', lat: 41.31, lng: 16.29 },
  'Split': { continent: 'Europe', lat: 43.51, lng: 16.44 },
  'Ostrava': { continent: 'Europe', lat: 49.82, lng: 18.26 },
  'Cagliari': { continent: 'Europe', lat: 39.22, lng: 9.12 },
  'Aix-en-Provence': { continent: 'Europe', lat: 43.53, lng: 5.45 },
  'Mauthausen': { continent: 'Europe', lat: 48.25, lng: 14.52 },
  'Francavilla al Mare': { continent: 'Europe', lat: 42.42, lng: 14.29 },
  'Prague': { continent: 'Europe', lat: 50.08, lng: 14.44 },
  'Bordeaux': { continent: 'Europe', lat: 44.84, lng: -0.58 },
  'Skopje': { continent: 'Europe', lat: 42.00, lng: 21.43 },
  'Vicenza': { continent: 'Europe', lat: 45.55, lng: 11.55 },
  'Heilbronn': { continent: 'Europe', lat: 49.14, lng: 9.22 },
  'Prostějov': { continent: 'Europe', lat: 49.47, lng: 17.11 },
  'Surbiton': { continent: 'Europe', lat: 51.39, lng: -0.30 },
  'Nottingham': { continent: 'Europe', lat: 52.95, lng: -1.15 },
  'Perugia': { continent: 'Europe', lat: 43.11, lng: 12.39 },
  'Bratislava': { continent: 'Europe', lat: 48.15, lng: 17.11 },
  'Ilkley': { continent: 'Europe', lat: 53.92, lng: -1.82 },
  'Sassuolo': { continent: 'Europe', lat: 44.54, lng: 10.78 },
  'Poznań': { continent: 'Europe', lat: 52.41, lng: 16.93 },
  'Blois': { continent: 'Europe', lat: 47.59, lng: 1.33 },
  'Milan': { continent: 'Europe', lat: 45.46, lng: 9.19 },
  'Modena': { continent: 'Europe', lat: 44.65, lng: 10.92 },
  'Brașov': { continent: 'Europe', lat: 45.66, lng: 25.61 },
  'Karlsruhe': { continent: 'Europe', lat: 49.01, lng: 8.40 },
  'Troyes': { continent: 'Europe', lat: 48.30, lng: 4.07 },
  'Braunschweig': { continent: 'Europe', lat: 52.27, lng: 10.52 },
  'Salzburg': { continent: 'Europe', lat: 47.80, lng: 13.04 },
  'Iași': { continent: 'Europe', lat: 47.16, lng: 27.59 },
  'Trieste': { continent: 'Europe', lat: 45.65, lng: 13.78 },
  'Amersfoort': { continent: 'Europe', lat: 52.16, lng: 5.39 },
  'Verona': { continent: 'Europe', lat: 45.44, lng: 10.99 },
  'Zug': { continent: 'Europe', lat: 47.17, lng: 8.52 },
  'Tampere': { continent: 'Europe', lat: 61.50, lng: 23.79 },
  'Segovia': { continent: 'Europe', lat: 40.95, lng: -4.12 },
  'San Marino': { continent: 'Europe', lat: 43.94, lng: 12.45 },
  'Porto': { continent: 'Europe', lat: 41.15, lng: -8.61 },
  'Lüdenscheid': { continent: 'Europe', lat: 51.22, lng: 7.63 },
  'Meerbusch': { continent: 'Europe', lat: 51.25, lng: 6.69 },
  'Grodzisk Mazowiecki': { continent: 'Europe', lat: 52.11, lng: 20.63 },
  'Todi': { continent: 'Europe', lat: 42.78, lng: 12.41 },
  'Kozerki': { continent: 'Europe', lat: 52.16, lng: 20.38 },
  'Como': { continent: 'Europe', lat: 45.81, lng: 9.08 },
  'Genova': { continent: 'Europe', lat: 44.41, lng: 8.93 },
  'Sevilla': { continent: 'Europe', lat: 37.39, lng: -5.98 },
  'Cassis': { continent: 'Europe', lat: 43.21, lng: 5.54 },
  'Tulln': { continent: 'Europe', lat: 48.33, lng: 15.90 },
  'Szczecin': { continent: 'Europe', lat: 53.43, lng: 14.55 },
  'Rennes': { continent: 'Europe', lat: 48.11, lng: -1.68 },
  'Bad Waltersdorf': { continent: 'Europe', lat: 47.17, lng: 16.02 },
  'Saint-Tropez': { continent: 'Europe', lat: 43.27, lng: 6.64 },
  'Orléans': { continent: 'Europe', lat: 47.90, lng: 1.90 },
  'Lisbon': { continent: 'Europe', lat: 38.72, lng: -9.14 },
  'Mouilleron-le-Captif': { continent: 'Europe', lat: 46.71, lng: -1.47 },
  'Alicante': { continent: 'Europe', lat: 38.35, lng: -0.48 },
  'Valencia': { continent: 'Europe', lat: 39.47, lng: -0.38 },
  'Roanne': { continent: 'Europe', lat: 46.04, lng: 4.07 },
  'Olbia': { continent: 'Europe', lat: 40.92, lng: 9.50 },
  'Saint-Brieuc': { continent: 'Europe', lat: 48.51, lng: -2.76 },
  'Brest': { continent: 'Europe', lat: 48.39, lng: -4.49 },
  'Helsinki': { continent: 'Europe', lat: 60.17, lng: 24.94 },
  'Rovereto': { continent: 'Europe', lat: 45.89, lng: 11.04 },
  'Maia': { continent: 'Europe', lat: 41.24, lng: -8.62 },
  'Maspalomas': { continent: 'Europe', lat: 27.76, lng: -15.59 },
  'Glasgow': { continent: 'Europe', lat: 55.86, lng: -4.25 },
  'Augsburg': { continent: 'Europe', lat: 48.37, lng: 10.89 },
  'Kachreti': { continent: 'Europe', lat: 41.65, lng: 45.80 },
  'Pozoblanco': { continent: 'Europe', lat: 38.38, lng: -4.91 },
  'Bonn': { continent: 'Europe', lat: 50.74, lng: 7.10 },
  'Cordenons': { continent: 'Europe', lat: 45.98, lng: 12.70 },
  'Dobrich': { continent: 'Europe', lat: 43.57, lng: 27.83 },
  // North America
  'San Francisco': { continent: 'North America', lat: 37.77, lng: -122.42 },
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
  'Morelos': { continent: 'North America', lat: 18.68, lng: -99.10 },
  'Mérida': { continent: 'North America', lat: 20.97, lng: -89.62 },
  'San Luis Potosí': { continent: 'North America', lat: 22.15, lng: -100.98 },
  'Mexico City': { continent: 'North America', lat: 19.43, lng: -99.13 },
  'Cleveland': { continent: 'North America', lat: 41.50, lng: -81.69 },
  'Sarasota': { continent: 'North America', lat: 27.34, lng: -82.53 },
  'Tallahassee': { continent: 'North America', lat: 30.44, lng: -84.28 },
  'Savannah': { continent: 'North America', lat: 32.08, lng: -81.09 },
  'Phoenix': { continent: 'North America', lat: 33.45, lng: -112.07 },
  'Little Rock': { continent: 'North America', lat: 34.75, lng: -92.29 },
  'Tyler': { continent: 'North America', lat: 32.35, lng: -95.30 },
  'Cranbrook': { continent: 'North America', lat: 49.51, lng: -115.77 },
  'Winnipeg': { continent: 'North America', lat: 49.90, lng: -97.14 },
  'Granby': { continent: 'North America', lat: 45.40, lng: -72.73 },
  'Chicago': { continent: 'North America', lat: 41.88, lng: -87.63 },
  'Lexington': { continent: 'North America', lat: 37.99, lng: -84.48 },
  'Lincoln': { continent: 'North America', lat: 40.81, lng: -96.70 },
  'Cary': { continent: 'North America', lat: 35.79, lng: -78.78 },
  'Columbus': { continent: 'North America', lat: 39.96, lng: -82.99 },
  'Charleston': { continent: 'North America', lat: 32.78, lng: -79.93 },
  'Tiburon': { continent: 'North America', lat: 37.87, lng: -122.46 },
  'Las Vegas': { continent: 'North America', lat: 36.17, lng: -115.14 },
  'Calgary': { continent: 'North America', lat: 51.05, lng: -114.07 },
  'Drummondville': { continent: 'North America', lat: 45.88, lng: -72.48 },
  'Santo Domingo': { continent: 'North America', lat: 18.49, lng: -69.94 },
  // South America
  'Buenos Aires': { continent: 'South America', lat: -34.60, lng: -58.38 },
  'Rio de Janeiro': { continent: 'South America', lat: -22.91, lng: -43.17 },
  'Santiago': { continent: 'South America', lat: -33.45, lng: -70.67 },
  'Punta del Este': { continent: 'South America', lat: -34.97, lng: -54.95 },
  'Asunción': { continent: 'South America', lat: -25.26, lng: -57.58 },
  'Tigre': { continent: 'South America', lat: -34.43, lng: -58.58 },
  'São Leopoldo': { continent: 'South America', lat: -29.76, lng: -51.15 },
  'Florianópolis': { continent: 'South America', lat: -27.60, lng: -48.55 },
  'Porto Alegre': { continent: 'South America', lat: -30.03, lng: -51.23 },
  'Santos': { continent: 'South America', lat: -23.96, lng: -46.33 },
  'São Paulo': { continent: 'South America', lat: -23.55, lng: -46.63 },
  'Campinas': { continent: 'South America', lat: -22.91, lng: -47.06 },
  'Curitiba': { continent: 'South America', lat: -25.43, lng: -49.27 },
  'San Miguel de Tucumán': { continent: 'South America', lat: -26.82, lng: -65.22 },
  'Concepcion': { continent: 'South America', lat: -36.83, lng: -73.05 },
  'Villa María': { continent: 'South America', lat: -32.41, lng: -63.24 },
  'Antofagasta': { continent: 'South America', lat: -23.65, lng: -70.40 },
  'Temuco': { continent: 'South America', lat: -38.74, lng: -72.60 },
  'Ibagué': { continent: 'South America', lat: 4.44, lng: -75.24 },
  'Bogotá': { continent: 'South America', lat: 4.71, lng: -74.07 },
  'Lima': { continent: 'South America', lat: -12.05, lng: -77.04 },
  'Santa Cruz': { continent: 'South America', lat: -17.78, lng: -63.18 },
  'Guayaquil': { continent: 'South America', lat: -2.17, lng: -79.92 },
  'Montevideo': { continent: 'South America', lat: -34.88, lng: -56.16 },
  // Africa
  'Marrakech': { continent: 'Africa', lat: 31.63, lng: -8.00 },
  'Kigali': { continent: 'Africa', lat: -1.94, lng: 30.06 },
  'Tunis': { continent: 'Africa', lat: 36.81, lng: 10.17 },
  'Fes': { continent: 'Africa', lat: 34.03, lng: -4.99 },
  'Cairo': { continent: 'Africa', lat: 30.04, lng: 31.24 },
  'Casablanca': { continent: 'Africa', lat: 33.59, lng: -7.62 },
  'Nairobi': { continent: 'Africa', lat: -1.29, lng: 36.82 },
  // Caucasus / Central Asia (listed under Asia)
  'Tbilisi': { continent: 'Asia', lat: 41.69, lng: 44.83 },
  'Baku': { continent: 'Asia', lat: 40.41, lng: 49.87 },
  'Yerevan': { continent: 'Asia', lat: 40.18, lng: 44.51 },
  'Tashkent': { continent: 'Asia', lat: 41.30, lng: 69.24 },
  // Mediterranean / Southern Europe (add to Europe section)
  'Heraklion': { continent: 'Europe', lat: 35.34, lng: 25.13 },
  'Athens': { continent: 'Europe', lat: 37.98, lng: 23.73 },
  'Thessaloniki': { continent: 'Europe', lat: 40.64, lng: 22.94 },
  'Antalya': { continent: 'Europe', lat: 36.90, lng: 30.70 },
  'Istanbul': { continent: 'Europe', lat: 41.01, lng: 28.95 },
  'Belgrade': { continent: 'Europe', lat: 44.80, lng: 20.46 },
  'Zagreb': { continent: 'Europe', lat: 45.81, lng: 15.98 },
  'Sofia': { continent: 'Europe', lat: 42.70, lng: 23.32 },
  'Riga': { continent: 'Europe', lat: 56.95, lng: 24.11 },
  'Vilnius': { continent: 'Europe', lat: 54.69, lng: 25.28 },
  'Tallinn': { continent: 'Europe', lat: 59.44, lng: 24.75 },
  'Warsaw': { continent: 'Europe', lat: 52.23, lng: 21.01 },
  'Poznan': { continent: 'Europe', lat: 52.41, lng: 16.93 },
};

export function calculateTravelDistance(fromCity: string, toCity: string): number {
  const from = CITY_DATA[fromCity];
  const to = CITY_DATA[toCity];
  if (!from || !to) {
    // If either city is unknown, estimate based on continent
    return 2000; // generic mid-range distance
  }
  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getTravelCost(distance: number): number {
  if (distance < 500) return 500;
  if (distance < 1500) return 1200;
  if (distance < 3000) return 2500;
  if (distance < 5000) return 3500;
  if (distance < 8000) return 5000;
  if (distance < 12000) return 7000;
  return 9000;
}

export function getTravelFatigue(distance: number, fromContinent: string, toContinent: string): number {
  let fatigue = Math.min(30, Math.floor(distance / 500));
  if (fromContinent !== toContinent) fatigue += 10;
  return fatigue;
}

// Country-to-continent mapping for cities not in CITY_DATA
export const COUNTRY_TO_CONTINENT: Record<string, Continent> = {
  'Australia': 'Oceania', 'New Zealand': 'Oceania', 'New Caledonia': 'Oceania',
  'Japan': 'Asia', 'China': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
  'Thailand': 'Asia', 'Taiwan': 'Asia', 'Kazakhstan': 'Asia', 'Georgia': 'Asia',
  'Bahrain': 'Middle East', 'Qatar': 'Middle East', 'UAE': 'Middle East',
  'USA': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Dominican Republic': 'North America',
  'Argentina': 'South America', 'Brazil': 'South America', 'Chile': 'South America',
  'Colombia': 'South America', 'Peru': 'South America', 'Bolivia': 'South America',
  'Uruguay': 'South America', 'Paraguay': 'South America', 'Ecuador': 'South America',
  'Morocco': 'Africa', 'Tunisia': 'Africa', 'Rwanda': 'Africa',
  'Great Britain': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Spain': 'Europe',
  'Italy': 'Europe', 'Portugal': 'Europe', 'Austria': 'Europe', 'Switzerland': 'Europe',
  'Belgium': 'Europe', 'Netherlands': 'Europe', 'Czech Republic': 'Europe',
  'Croatia': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe', 'Bulgaria': 'Europe',
  'Slovakia': 'Europe', 'Poland': 'Europe', 'Finland': 'Europe', 'Sweden': 'Europe',
  'Serbia': 'Europe', 'San Marino': 'Europe', 'North Macedonia': 'Europe',
};

export function getContinentFromCountry(country: string): Continent {
  return COUNTRY_TO_CONTINENT[country] || 'Europe';
}

// ==================== FICTIONAL RANKING ====================

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

// Minimum score a newly created career player starts with (BASE_ATTRIBUTES all = 20)
const CAREER_BASE_SCORE = 20;

export function powerScoreToFictionalRanking(score: number): number {
  // Normalize relative to base score so a new career player starts at rank 500
  // Improvement is fast at start (concave curve) and slows down at the top
  const adjusted = Math.max(0, score - CAREER_BASE_SCORE);
  const normalized = Math.min(1, adjusted / (100 - CAREER_BASE_SCORE));
  const rank = Math.round(500 * Math.pow(1 - normalized, 1.8));
  return Math.max(1, rank);
}

export function getEffectiveFictionalRanking(player: CareerPlayer): number {
  let effectiveScore = player.fictionalRankingScore;
  if (player.fatigue > 60) effectiveScore -= (player.fatigue - 60) * 0.15;
  if (player.energy < 30) effectiveScore -= (30 - player.energy) * 0.1;
  effectiveScore += player.form * 0.3;

  if (player.injured) effectiveScore -= 10;
  return powerScoreToFictionalRanking(effectiveScore);
}

export function scoreToFictionalRanking(score: number, _totalPlayers: number): number {
  return powerScoreToFictionalRanking(score);
}

/**
 * Calculate the number of wins based on the round reached and the tournament draw size.
 * E.g., in a 32-draw tournament: R32 loss = 0 wins, R16 loss = 1 win, QF loss = 2 wins, etc.
 */
export function calculateWinsFromRound(round: string, drawSize: number): number {
  const roundOrder = ['R128', 'R64', 'R32', 'R16', 'Quarterfinal', 'Semifinal', 'Final', 'Winner'];
  const roundIdx = roundOrder.indexOf(round);
  if (roundIdx < 0) return 0;

  // Determine the first round index based on draw size
  let firstRoundIdx = 0;
  if (drawSize <= 128) firstRoundIdx = roundOrder.indexOf('R128');
  if (drawSize <= 64) firstRoundIdx = roundOrder.indexOf('R64');
  if (drawSize <= 32) firstRoundIdx = roundOrder.indexOf('R32');
  if (drawSize <= 16) firstRoundIdx = roundOrder.indexOf('R16');
  if (drawSize <= 8) firstRoundIdx = roundOrder.indexOf('Quarterfinal');
  if (drawSize <= 4) firstRoundIdx = roundOrder.indexOf('Semifinal');

  // Wins = how many rounds beyond the first round the player reached
  // If they lost in the first round, wins = 0
  // If they are the Winner, they won every round
  const isWinner = round === 'Winner';
  if (isWinner) {
    // Total rounds in tournament
    return roundIdx - firstRoundIdx;
  }
  // They lost in this round, so they won (roundIdx - firstRoundIdx) rounds before losing
  return Math.max(0, roundIdx - firstRoundIdx);
}

/**
 * How physically demanding a tournament category is, relative to a baseline ATP 500 (1.0).
 * Grand Slams (best-of-5, 7 rounds) are the most fatiguing; Challengers/ITFs the least.
 * Used both for CPU entry-fatigue and for the career player's own match fatigue.
 */
export function getCategoryFatigueMultiplier(category: string): number {
  switch (category) {
    case 'Grand Slam': return 1.6;
    case 'ATP Finals': return 1.3;
    case 'Masters 1000': return 1.15;
    case 'ATP 500': return 1.0;
    case 'ATP 250': return 0.85;
    case 'Laver Cup': return 0.8;
    case 'Davis Cup': return 0.8;
    default:
      if (category.startsWith('Challenger')) return 0.75;
      if (category.startsWith('ITF')) return 0.6;
      return 0.9;
  }
}

const BASE_FATIGUE_PER_MATCH = 7;
const MAX_FATIGUE_PER_TOURNAMENT = 55;

/**
 * Fatigue a CPU player accumulates from a single tournament, based on how many matches
 * they played (derived from the round reached) and how demanding the category is.
 * Deep runs in big events (e.g. a Grand Slam final) cost far more than an early exit
 * from a small event, so those players are then less likely to enter the following weeks.
 */
export function calculateTournamentFatigueGain(round: string, category: string, drawSize: number): number {
  const wins = calculateWinsFromRound(round, drawSize);
  const matchesPlayed = wins + (round === 'Winner' ? 0 : 1);
  if (matchesPlayed <= 0) return 0;
  const gain = matchesPlayed * BASE_FATIGUE_PER_MATCH * getCategoryFatigueMultiplier(category);
  return Math.min(MAX_FATIGUE_PER_TOURNAMENT, Math.round(gain));
}

/**
 * Convert a CareerPlayer to a Player object for use in the match engine and rankings.
 */
export function careerPlayerToPlayer(cp: CareerPlayer): Player {
  const fictionalRanking = getEffectiveFictionalRanking(cp);
  return {
    id: CAREER_PLAYER_ID,
    name: `${cp.firstName} ${cp.lastName}`,
    country: cp.nationality,
    countryCode: cp.countryCode,
    age: cp.age,
    officialRanking: cp.officialRanking,
    previousRanking: cp.officialRanking,
    fictionalRanking,
    points: cp.officialPoints,
    livePoints: cp.livePoints,
    previousYearPoints: cp.previousYearPoints,
    currentYearWeeklyPoints: cp.currentYearWeeklyPoints || new Array(52).fill(0),
    weeklyDefensePoints: 0,
    fatigue: cp.fatigue,
    injured: cp.injured,
    injuryWeeksRemaining: cp.injuryWeeksRemaining,
    surfaceAffinity: {
      // Base attribute = 20 → affinity 0 (neutral)
      // Favorite surface start = 28 → affinity 1 (+8 effective ranking)
      // Trained to 36 → affinity 2 (+16), 44 → affinity 3 (+24)
      Hard: Math.max(-2, Math.min(3, Math.round((cp.attributes.surfaceHard - 20) / 8))),
      Clay: Math.max(-2, Math.min(3, Math.round((cp.attributes.surfaceClay - 20) / 8))),
      Grass: Math.max(-2, Math.min(3, Math.round((cp.attributes.surfaceGrass - 20) / 8))),
    },
    stats: {
      wins: cp.stats.wins,
      losses: cp.stats.losses,
      surfaceWins: { ...cp.stats.surfaceWins },
      surfaceLosses: { ...cp.stats.surfaceLosses },
      currentStreak: 0,
      bestWinStreak: 0,
      titles: cp.stats.titlesWon,
    },
  };
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
    // === RANKING MILESTONES ===
    { id: 'top-300', title: 'Top 300', description: 'Reach the Top 300 in the official ranking', completed: false, reward: { dp: 2, xp: 50, money: 5000 } },
    { id: 'top-200', title: 'Top 200', description: 'Reach the Top 200 in the official ranking', completed: false, reward: { dp: 3, xp: 75, money: 8000 } },
    { id: 'top-150', title: 'Top 150', description: 'Reach the Top 150 in the official ranking', completed: false, reward: { dp: 5, xp: 100, money: 12000 } },
    { id: 'top-100', title: 'Top 100', description: 'Enter the Top 100 — full ATP tour access', completed: false, reward: { dp: 8, xp: 200, money: 25000 } },
    { id: 'top-75', title: 'Top 75', description: 'Reach the Top 75 in the official ranking', completed: false, reward: { dp: 10, xp: 250, money: 35000 } },
    { id: 'top-50', title: 'Top 50', description: 'Break into the Top 50', completed: false, reward: { dp: 12, xp: 300, money: 50000 } },
    { id: 'top-30', title: 'Top 30', description: 'Reach the Top 30 in the world', completed: false, reward: { dp: 14, xp: 400, money: 75000 } },
    { id: 'top-20', title: 'Top 20', description: 'Reach the Top 20 in the world', completed: false, reward: { dp: 16, xp: 500, money: 100000 } },
    { id: 'top-10', title: 'Top 10', description: 'Break into the elite Top 10', completed: false, reward: { dp: 20, xp: 700, money: 200000 } },
    { id: 'top-5', title: 'Top 5', description: 'Reach the Top 5 in the world', completed: false, reward: { dp: 25, xp: 850, money: 350000 } },
    { id: 'number-1', title: 'World No.1', description: 'Become the World Number 1', completed: false, reward: { dp: 35, xp: 1000, money: 500000 } },
    // === ITF TITLES ===
    { id: 'first-itf-title', title: 'First ITF Title', description: 'Win your first ITF M15 or M25 tournament', completed: false, reward: { dp: 2, xp: 50, money: 2000 } },
    { id: 'itf-titles-3', title: 'ITF Specialist', description: 'Win 3 ITF titles', completed: false, reward: { dp: 4, xp: 100, money: 5000 } },
    // === MATCH WINS ===
    { id: 'first-win', title: 'First Match Win', description: 'Win your first professional match', completed: false, reward: { dp: 1, xp: 30, money: 1000 } },
    { id: 'wins-10', title: '10 Match Wins', description: 'Win 10 professional matches', completed: false, reward: { dp: 3, xp: 75, money: 3000 } },
    { id: 'wins-50', title: '50 Match Wins', description: 'Win 50 professional matches', completed: false, reward: { dp: 6, xp: 200, money: 15000 } },
    { id: 'wins-100', title: '100 Match Wins', description: 'Win 100 professional matches', completed: false, reward: { dp: 12, xp: 450, money: 40000 } },
    { id: 'wins-200', title: '200 Match Wins', description: 'Win 200 matches — a true professional', completed: false, reward: { dp: 18, xp: 800, money: 100000 } },
    // === CHALLENGER TITLES ===
    { id: 'first-challenger', title: 'First Challenger Title', description: 'Win your first Challenger tournament', completed: false, reward: { dp: 6, xp: 150, money: 15000 } },
    { id: 'challenger-3', title: 'Challenger Specialist', description: 'Win 3 Challenger titles', completed: false, reward: { dp: 10, xp: 300, money: 30000 } },
    { id: 'challenger-5', title: 'Challenger King', description: 'Win 5 Challenger titles', completed: false, reward: { dp: 14, xp: 450, money: 50000 } },
    // === ATP TITLES ===
    { id: 'first-title', title: 'First ATP Title', description: 'Win your first ATP 250 or higher title', completed: false, reward: { dp: 10, xp: 300, money: 50000 } },
    { id: 'titles-3', title: 'Three Titles', description: 'Win 3 ATP main tour titles', completed: false, reward: { dp: 15, xp: 500, money: 100000 } },
    { id: 'titles-5', title: 'Five Titles', description: 'Win 5 ATP main tour titles', completed: false, reward: { dp: 20, xp: 750, money: 200000 } },
    { id: 'titles-10', title: 'Ten Titles', description: 'Win 10 ATP main tour titles — all-time great territory', completed: false, reward: { dp: 30, xp: 1200, money: 500000 } },
    { id: 'first-500', title: 'ATP 500 Title', description: 'Win an ATP 500 event', completed: false, reward: { dp: 12, xp: 350, money: 75000 } },
    { id: 'first-masters', title: 'Masters 1000 Title', description: 'Win a prestigious Masters 1000 title', completed: false, reward: { dp: 18, xp: 600, money: 200000 } },
    { id: 'masters-3', title: 'Masters Specialist', description: 'Win 3 Masters 1000 titles', completed: false, reward: { dp: 25, xp: 900, money: 400000 } },
    // === GRAND SLAM ===
    { id: 'gs-qualify', title: 'Grand Slam Debut', description: 'Compete in a Grand Slam main draw', completed: false, reward: { dp: 5, xp: 150, money: 20000 } },
    { id: 'gs-r16', title: 'Grand Slam R16', description: 'Reach the Round of 16 at a Grand Slam', completed: false, reward: { dp: 12, xp: 400, money: 75000 } },
    { id: 'gs-qf', title: 'Grand Slam Quarter-Final', description: 'Reach a Grand Slam Quarter-Final', completed: false, reward: { dp: 15, xp: 550, money: 120000 } },
    { id: 'gs-sf', title: 'Grand Slam Semi-Final', description: 'Reach a Grand Slam Semi-Final', completed: false, reward: { dp: 18, xp: 700, money: 175000 } },
    { id: 'gs-final', title: 'Grand Slam Final', description: 'Reach a Grand Slam Final', completed: false, reward: { dp: 22, xp: 900, money: 250000 } },
    { id: 'gs-win', title: 'Grand Slam Champion', description: 'Win a Grand Slam title', completed: false, reward: { dp: 30, xp: 1200, money: 500000 } },
    { id: 'gs-2', title: 'Two Grand Slams', description: 'Win 2 Grand Slam titles', completed: false, reward: { dp: 35, xp: 1500, money: 750000 } },
    { id: 'career-slam', title: 'Career Grand Slam', description: 'Win all 4 Grand Slam tournaments', completed: false, reward: { dp: 50, xp: 3000, money: 2000000 } },
    // === SURFACE ===
    { id: 'clay-title', title: 'King of Clay', description: 'Win a Challenger or ATP title on clay', completed: false, reward: { dp: 6, xp: 150, money: 20000 } },
    { id: 'grass-title', title: 'Grass Specialist', description: 'Win a Challenger or ATP title on grass', completed: false, reward: { dp: 6, xp: 150, money: 20000 } },
    { id: 'hard-title', title: 'Hard Court Expert', description: 'Win a Challenger or ATP title on hard court', completed: false, reward: { dp: 6, xp: 150, money: 20000 } },
    // === FINANCIAL ===
    { id: 'money-100k', title: '$100K Earned', description: 'Accumulate $100,000 in prize money', completed: false, reward: { dp: 3, xp: 75, money: 0 } },
    { id: 'money-1m', title: 'Millionaire', description: 'Accumulate $1,000,000 in career earnings', completed: false, reward: { dp: 8, xp: 200, money: 0 } },
    { id: 'money-5m', title: '$5M Career Earnings', description: 'Accumulate $5,000,000 in career earnings', completed: false, reward: { dp: 15, xp: 500, money: 0 } },
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
  improvementRange: [number, number];
}

export const TRAINING_OPTIONS: TrainingOption[] = [
  { type: 'serve', label: 'Serve Training', description: 'Improve serve power and accuracy', icon: '🎾', energyCost: 15, fatigueCost: 10, moneyCost: 2000, attributes: ['serve'], improvementRange: [1, 3] },
  { type: 'return', label: 'Return Training', description: 'Work on return positioning and timing', icon: '🏓', energyCost: 15, fatigueCost: 10, moneyCost: 2000, attributes: ['return', 'rally'], improvementRange: [1, 2] },
  { type: 'physical', label: 'Physical Training', description: 'Build endurance and strength', icon: '💪', energyCost: 20, fatigueCost: 15, moneyCost: 1500, attributes: ['physical', 'recovery'], improvementRange: [1, 3] },
  { type: 'mental', label: 'Mental Training', description: 'Sharpen focus and resilience', icon: '🧠', energyCost: 10, fatigueCost: 5, moneyCost: 3000, attributes: ['mentality', 'pressure', 'consistency'], improvementRange: [1, 2] },
  { type: 'surface', label: 'Surface Adaptation', description: 'Practice on specific surfaces', icon: '🏟️', energyCost: 15, fatigueCost: 10, moneyCost: 2500, attributes: ['surfaceHard', 'surfaceClay', 'surfaceGrass'], improvementRange: [1, 3] },
  { type: 'recovery', label: 'Recovery Week', description: 'Light training with focus on recovery', icon: '🧘', energyCost: -20, fatigueCost: -25, moneyCost: 1000, attributes: ['recovery'], improvementRange: [0, 1] },
];

// ==================== HELPERS ====================

export function getPointsForRound(pointsTable: { winner: number; finalist: number; sf: number; qf: number; r16: number; r32: number; r64: number; r128: number }, round: string): number {
  switch (round) {
    case 'Winner': return pointsTable.winner;
    case 'Final': return pointsTable.finalist;
    case 'Finalist': return pointsTable.finalist;
    case 'Semifinal': return pointsTable.sf;
    case 'SF': return pointsTable.sf;
    case 'Quarterfinal': return pointsTable.qf;
    case 'QF': return pointsTable.qf;
    case 'R16': return pointsTable.r16;
    case 'R32': return pointsTable.r32;
    case 'R64': return pointsTable.r64;
    case 'R128': return pointsTable.r128;
    default: return 0;
  }
}

export function getMoneyForRound(category: string, round: string): number {
  const prize = PRIZE_MONEY[category];
  if (!prize) return 0;
  return getPointsForRound(prize, round);
}

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

// ==================== REPUTATION ====================

export function getReputationTier(reputation: number): { tier: string; color: string; next: number } {
  if (reputation >= 900) return { tier: 'Legend', color: 'text-amber-400', next: 1000 };
  if (reputation >= 700) return { tier: 'Star', color: 'text-purple-400', next: 900 };
  if (reputation >= 500) return { tier: 'Respected', color: 'text-blue-400', next: 700 };
  if (reputation >= 300) return { tier: 'Known', color: 'text-green-400', next: 500 };
  if (reputation >= 100) return { tier: 'Emerging', color: 'text-yellow-400', next: 300 };
  return { tier: 'Amateur', color: 'text-muted-foreground', next: 100 };
}
