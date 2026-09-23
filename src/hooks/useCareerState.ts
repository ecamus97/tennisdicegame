import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CareerState, CareerPlayer, CareerAttributes, Archetype, TrainingType,
  BASE_ATTRIBUTES, ARCHETYPE_BONUSES, ATTRIBUTE_MAX,
  calculateFictionalRankingScore, powerScoreToFictionalRanking, getEffectiveFictionalRanking,
  getXpForLevel, getDPCost, getDefaultObjectives, careerPlayerToPlayer,
  PRIZE_MONEY, CITY_DATA, calculateTravelDistance, getTravelCost, getTravelFatigue,
  TRAINING_OPTIONS, CAREER_PLAYER_ID, getMoneyForRound, calculateWinsFromRound,
  ActiveSponsor, Sponsor, ActiveStaff, StaffMember,
  AVAILABLE_SPONSORS, AVAILABLE_STAFF, CareerTournamentResult, TitleDetail,
  getContinentFromCountry, CareerSeasonSummaryData, CareerMatchRecord, WeeklyPlanEntry,
  NewsItem,
} from '@/data/careerData';
import { tournaments, Tournament, Surface, Player, initialPlayers } from '@/data/players';
import { extendedPlayers } from '@/data/playersExtended';
import { challengerTournaments, ChallengerTournament, getChallengerMoneyForRound } from '@/data/challengerTournaments';
import { playMatch } from '@/lib/matchEngine';
import { selectTournamentEntrants, getCareerEligibleCategories, canEnterAsWildCard, getEligibleRankingRange, getCountryCodeFromCountry, getEntryProbability } from '@/lib/tournamentEntryLogic';
import { TournamentDraw } from '@/hooks/useGameState';
import { processSeasonTransition } from '@/lib/retirementLogic';

// Processing order for weekly tournament simulation: higher-tier events run first
// so their entrants are locked in before lower-tier draws are generated.
export const TOURNAMENT_TIER_ORDER: Record<string, number> = {
  'Grand Slam': 0, 'Masters 1000': 1, 'ATP 500': 2, 'ATP 250': 3,
  'Challenger 175': 4, 'Challenger 125': 5, 'Challenger 100': 6,
  'Challenger 75': 7, 'Challenger 50': 8, 'ITF M25': 9, 'ITF M15': 10,
};

// Combine all ATP + Challenger tournaments into a unified list for Career Mode
const allCareerTournaments: Tournament[] = [
  ...tournaments,
  ...challengerTournaments.map(ct => ({
    id: ct.id,
    name: ct.name,
    city: ct.city,
    country: ct.country,
    category: ct.category as Tournament['category'],
    surface: ct.surface,
    week: ct.week,
    playerLimit: ct.playerLimit,
    seeds: ct.seeds,
    points: {
      winner: ct.points.winner,
      finalist: ct.points.finalist,
      sf: ct.points.sf,
      qf: ct.points.qf,
      r16: ct.points.r16,
      r32: ct.points.r32,
      r64: 0,
      r128: 0,
    },
  })),
];

// All players: original 150 + extended 151-500
const allInitialPlayers: Player[] = [...initialPlayers, ...extendedPlayers];

const CAREER_STORAGE_KEY = 'tennis-dice-tour-career';
const CAREER_SAVE_SLOTS_KEY = 'tennis-dice-career-saves';

export interface CareerSaveSlot {
  name: string;
  timestamp: number;
  season: number;
  week: number;
  playerName: string;
}

export function listCareerSaveSlots(): CareerSaveSlot[] {
  try {
    const raw = localStorage.getItem(CAREER_SAVE_SLOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCareerSlotsToStorage(slots: CareerSaveSlot[]) {
  localStorage.setItem(CAREER_SAVE_SLOTS_KEY, JSON.stringify(slots));
}

const getInitialCareerState = (): CareerState => {
  const saved = localStorage.getItem(CAREER_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.allPlayers || parsed.allPlayers.length < 200) {
        parsed.allPlayers = allInitialPlayers.map(p => ({ ...p }));
      }
      // Migrate allPlayers to include currentYearWeeklyPoints
      parsed.allPlayers = parsed.allPlayers.map((p: Player) => ({
        ...p,
        currentYearWeeklyPoints: p.currentYearWeeklyPoints || new Array(52).fill(0),
      }));
      if (parsed.activeTournament === undefined) parsed.activeTournament = null;
      if (!parsed.tournamentHistory) parsed.tournamentHistory = [];
      if (!parsed.currentDraw) parsed.currentDraw = null;
      if (!parsed.globalH2H) parsed.globalH2H = {};
      if (!parsed.newsItems) {
        parsed.newsItems = [];
      } else {
        // Filter out old non-ATP250+ tournament news
        const ATP_NEWS_CATS = ['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'];
        parsed.newsItems = parsed.newsItems.filter((n: any) => {
          if (n.type !== 'tournament') return true;
          if (n.tournamentCategory) return ATP_NEWS_CATS.includes(n.tournamentCategory);
          // Old format without tournamentCategory: filter out by headline keywords
          const hl = (n.headline || '').toLowerCase();
          return !hl.includes('challenger') && !hl.includes('itf') && !hl.includes('takes the open ') && !hl.includes('takes the challenger');
        });
      }
      if (parsed.player) {
        if (!parsed.player.sponsors) parsed.player.sponsors = [];
        if (!parsed.player.staff) parsed.player.staff = [];
        // Refresh staff effects from AVAILABLE_STAFF to pick up any code changes (e.g. renamed fields, updated values)
        parsed.player.staff = parsed.player.staff.map((s: ActiveStaff) => {
          const latest = AVAILABLE_STAFF.find(m => m.id === s.member.id);
          return latest ? { ...s, member: latest } : s;
        });
        if (parsed.player.officialPoints === undefined) parsed.player.officialPoints = parsed.player.livePoints || 0;
        if (!parsed.player.currentYearWeeklyPoints) parsed.player.currentYearWeeklyPoints = new Array(52).fill(0);
        if (!parsed.player.stats.titlesDetail) parsed.player.stats.titlesDetail = [];
        parsed.player.fictionalRankingScore = calculateFictionalRankingScore(parsed.player.attributes);
      }
      return parsed;
    } catch { /* ignore */ }
  }
  return {
    player: null,
    allPlayers: [],
    currentWeek: 1,
    currentSeason: 1,
    completedTournaments: [],
    tournamentHistory: [],
    isCreated: false,
    weeklyActionTaken: false,
    activeTournament: null,
    currentDraw: null,
    globalH2H: {},
    newsItems: [],
    weeklyUsedPlayerIds: [],
  };
};

// Helper: get round name from remaining players
function getRoundNameFromCount(playersInRound: number): string {
  if (playersInRound <= 1) return 'Final';
  if (playersInRound === 2) return 'Final';
  if (playersInRound <= 4) return 'Semifinal';
  if (playersInRound <= 8) return 'Quarterfinal';
  if (playersInRound <= 16) return 'R16';
  if (playersInRound <= 32) return 'R32';
  if (playersInRound <= 64) return 'R64';
  return 'R128';
}

// Auto-simulate a tournament for AI players
function autoSimulateTournamentBracket(
  tournament: Tournament,
  availablePlayers: Player[],
): { results: { playerId: number; points: number; round: string }[]; winnerId: number; runnerUpId: number; winnerName: string; runnerUpName: string; matchPairs: { winnerId: number; loserId: number }[] } {
  if (['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(tournament.category)) {
    return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '', matchPairs: [] };
  }

  const range = getEligibleRankingRange(tournament.category);
  const homeCC = getCountryCodeFromCountry(tournament.country);
  // Home players can enter even if slightly outside the normal ranking range
  const homeRangeBonus = 40;

  const drawSort = (a: Player, b: Player) => {
    const aHome = homeCC && a.countryCode === homeCC ? 1 : 0;
    const bHome = homeCC && b.countryCode === homeCC ? 1 : 0;
    if (aHome !== bHome) return bHome - aHome;
    return a.officialRanking - b.officialRanking;
  };

  const eligiblePlayers = availablePlayers
    .filter(p => {
      if (p.injured || p.id === CAREER_PLAYER_ID) return false;
      const isHome = homeCC && p.countryCode === homeCC;
      const effectiveMax = isHome ? range.max + homeRangeBonus : range.max;
      return p.officialRanking >= range.min && p.officialRanking <= effectiveMax;
    })
    .sort(drawSort);

  // Apply probabilistic entry so top players don't always fill lower-tier draws
  const probabilisticEntrants: Player[] = [];
  for (const player of eligiblePlayers) {
    if (probabilisticEntrants.length >= tournament.playerLimit) break;
    const prob = getEntryProbability(player.officialRanking, tournament.category);
    if (Math.random() < prob) {
      probabilisticEntrants.push(player);
    }
  }

  // Fill remaining spots only from players with a natural affinity for this tier (prob >= 0.4)
  // This prevents top-ranked players who "opted out" from being force-added to lower draws
  if (probabilisticEntrants.length < tournament.playerLimit) {
    const usedIds = new Set(probabilisticEntrants.map(p => p.id));
    const fillPool = eligiblePlayers.filter(
      p => !usedIds.has(p.id) && getEntryProbability(p.officialRanking, tournament.category) >= 0.4
    );
    probabilisticEntrants.push(...fillPool.slice(0, tournament.playerLimit - probabilisticEntrants.length));
  }

  // Last resort: fill any remaining spots with any eligible player
  if (probabilisticEntrants.length < tournament.playerLimit) {
    const usedIds = new Set(probabilisticEntrants.map(p => p.id));
    const remaining = eligiblePlayers.filter(p => !usedIds.has(p.id));
    probabilisticEntrants.push(...remaining.slice(0, tournament.playerLimit - probabilisticEntrants.length));
  }

  const entrants = probabilisticEntrants.slice(0, tournament.playerLimit);

  if (entrants.length < 2) return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '', matchPairs: [] };

  // Apply home country advantage: -8 fictional ranking (lower = better)
  const entrantsWithHomeBonus = entrants.map(p =>
    homeCC && p.countryCode === homeCC
      ? { ...p, fictionalRanking: Math.max(1, p.fictionalRanking - 8) }
      : p
  );

  const bestOf = tournament.category === 'Grand Slam' ? 5 : 3;
  let remaining = [...entrantsWithHomeBonus];
  const resultsMap = new Map<number, { points: number; round: string }>();
  let lastLoser: Player | null = null;
  const matchPairs: { winnerId: number; loserId: number }[] = [];

  while (remaining.length > 1) {
    const roundName = getRoundNameFromCount(remaining.length);
    const nextRound: Player[] = [];

    for (let i = 0; i < remaining.length; i += 2) {
      if (i + 1 >= remaining.length) {
        nextRound.push(remaining[i]);
        continue;
      }
      const matchResult = playMatch(remaining[i], remaining[i + 1], bestOf as 3 | 5, tournament.surface);
      nextRound.push(matchResult.winner);
      lastLoser = matchResult.loser;
      matchPairs.push({ winnerId: matchResult.winner.id, loserId: matchResult.loser.id });

      const pts = getPointsForRoundByName(tournament, roundName);
      resultsMap.set(matchResult.loser.id, { points: pts, round: roundName });
    }
    remaining = nextRound;
  }

  const winner = remaining[0];
  resultsMap.set(winner.id, { points: tournament.points.winner, round: 'Winner' });

  return {
    results: Array.from(resultsMap.entries()).map(([playerId, r]) => ({ playerId, ...r })),
    winnerId: winner.id,
    runnerUpId: lastLoser?.id || 0,
    winnerName: winner.name,
    runnerUpName: lastLoser?.name || '',
    matchPairs,
  };
}

function getPointsForRoundByName(tournament: Tournament, round: string): number {
  switch (round) {
    case 'Final': return tournament.points.finalist;
    case 'Semifinal': return tournament.points.sf;
    case 'Quarterfinal': return tournament.points.qf;
    case 'R16': return tournament.points.r16;
    case 'R32': return tournament.points.r32;
    case 'R64': return tournament.points.r64;
    case 'R128': return tournament.points.r128;
    default: return 0;
  }
}

// Recalculate rankings for all players
function recalculateRankings(allPlayers: Player[], careerPlayer: CareerPlayer | null): { players: Player[]; careerRanking: number } {
  const careerAsPlayer = careerPlayer ? careerPlayerToPlayer(careerPlayer) : null;
  const combined = careerAsPlayer ? [...allPlayers, careerAsPlayer] : [...allPlayers];
  combined.sort((a, b) => b.points - a.points);

  const ranked = combined.map((p, i) => ({ ...p, officialRanking: i + 1 }));
  const careerEntry = ranked.find(p => p.id === CAREER_PLAYER_ID);
  const careerRanking = careerEntry?.officialRanking || 999;

  return {
    players: ranked.filter(p => p.id !== CAREER_PLAYER_ID),
    careerRanking,
  };
}

function updateGlobalH2H(
  currentH2H: Record<string, [number, number]>,
  matchPairs: { winnerId: number; loserId: number }[]
): Record<string, [number, number]> {
  const updated = { ...currentH2H };
  for (const { winnerId, loserId } of matchPairs) {
    if (winnerId === CAREER_PLAYER_ID || loserId === CAREER_PLAYER_ID) continue; // career player H2H is tracked in matchHistory
    const minId = Math.min(winnerId, loserId);
    const maxId = Math.max(winnerId, loserId);
    const key = `${minId}-${maxId}`;
    const current = updated[key] || [0, 0];
    if (winnerId === minId) {
      updated[key] = [current[0] + 1, current[1]];
    } else {
      updated[key] = [current[0], current[1] + 1];
    }
  }
  return updated;
}

const ATP_NEWS_CATEGORIES = ['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'];

function generateWeeklyNews(
  completedSimulations: { winnerId: number; winnerName: string; runnerUpId: number; runnerUpName: string; tournament: Tournament }[],
  careerPlayer: CareerPlayer | null,
  currentWeek: number,
  currentSeason: number,
  allPlayers: Player[],
): NewsItem[] {
  const items: NewsItem[] = [];
  const id = () => `${currentSeason}-${currentWeek}-${Math.random().toString(36).slice(2, 7)}`;
  const playerById = (pid: number) => allPlayers.find(p => p.id === pid);

  // Tournament winners — ATP 250+ only
  const atpSims = completedSimulations.filter(s => ATP_NEWS_CATEGORIES.includes(s.tournament.category));

  // Prioritize: Grand Slam > Masters 1000 > ATP 500 > ATP 250
  const priority = ['Grand Slam', 'Masters 1000', 'ATP 500', 'ATP 250'];
  const sorted = [...atpSims].sort((a, b) =>
    priority.indexOf(a.tournament.category) - priority.indexOf(b.tournament.category)
  );

  for (const sim of sorted.slice(0, 3)) {
    const winnerPlayer = playerById(sim.winnerId);
    const runnerUpPlayer = sim.runnerUpId ? playerById(sim.runnerUpId) : undefined;
    items.push({
      id: id(),
      headline: `${sim.winnerName} wins the ${sim.tournament.name}`,
      detail: sim.runnerUpName ? `Defeated ${sim.runnerUpName} in the final` : undefined,
      body: `${sim.winnerName} claimed the ${sim.tournament.name} title in ${sim.tournament.city}, defeating ${sim.runnerUpName || 'their opponent'} in the final. ${winnerPlayer ? `The victory moves ${sim.winnerName} to World No.${winnerPlayer.officialRanking} in the official ATP Rankings, earning ${sim.tournament.points?.winner?.toLocaleString() || ''} ranking points.` : ''} ${sim.tournament.category === 'Grand Slam' ? 'A Grand Slam title is the most prestigious achievement in tennis.' : sim.tournament.category === 'Masters 1000' ? 'Masters 1000 events are among the most coveted titles on the ATP Tour.' : ''}`.trim(),
      type: 'tournament',
      week: currentWeek,
      season: currentSeason,
      tournamentName: sim.tournament.name,
      tournamentCategory: sim.tournament.category,
      tournamentCity: sim.tournament.city,
      tournamentCountry: sim.tournament.country,
      tournamentSurface: sim.tournament.surface,
      winnerName: sim.winnerName,
      runnerUpName: sim.runnerUpName || undefined,
      winnerNewRanking: winnerPlayer?.officialRanking,
      runnerUpNewRanking: runnerUpPlayer?.officialRanking,
      pointsAwarded: sim.tournament.points?.winner,
    });
  }

  // Ranking news
  // New No.1
  const top1 = allPlayers.find(p => p.officialRanking === 1);
  if (top1 && top1.previousRanking && top1.previousRanking !== 1) {
    items.push({
      id: id(),
      headline: `${top1.name} is the new World No.1`,
      detail: `${top1.countryCode} · ${top1.points.toLocaleString()} pts`,
      body: `${top1.name} has ascended to the pinnacle of men's tennis, claiming the World No.1 ranking. The ${top1.countryCode} player has accumulated ${top1.points.toLocaleString()} ranking points over the past 52 weeks to reach the sport's summit.`,
      type: 'ranking',
      week: currentWeek,
      season: currentSeason,
      playerName: top1.name,
      rankBefore: top1.previousRanking,
      rankAfter: 1,
    });
  }

  // New top-10 entries
  const newTop10 = allPlayers.filter(p =>
    p.officialRanking <= 10 && p.previousRanking && p.previousRanking > 10
  );
  for (const p of newTop10) {
    items.push({
      id: id(),
      headline: `${p.name} enters the Top 10 at No.${p.officialRanking}`,
      detail: `Climbed from No.${p.previousRanking}`,
      body: `${p.name} has broken into the top 10 of the ATP Rankings, climbing from No.${p.previousRanking} to No.${p.officialRanking}. The ${p.countryCode} player's recent form has propelled them into the elite tier of professional tennis.`,
      type: 'ranking',
      week: currentWeek,
      season: currentSeason,
      playerName: p.name,
      rankBefore: p.previousRanking,
      rankAfter: p.officialRanking,
    });
  }

  // Top-10 exits
  const exitTop10 = allPlayers.filter(p =>
    p.officialRanking > 10 && p.previousRanking && p.previousRanking <= 10
  );
  for (const p of exitTop10) {
    items.push({
      id: id(),
      headline: `${p.name} drops out of Top 10 to No.${p.officialRanking}`,
      detail: `Was ranked No.${p.previousRanking}`,
      body: `${p.name} has fallen out of the top 10, dropping from No.${p.previousRanking} to No.${p.officialRanking}. The ${p.countryCode} player will look to regain top-10 status in the coming weeks.`,
      type: 'ranking',
      week: currentWeek,
      season: currentSeason,
      playerName: p.name,
      rankBefore: p.previousRanking,
      rankAfter: p.officialRanking,
    });
  }

  // Big movers in top 50 (±15 places)
  const bigMovers = allPlayers
    .filter(p => p.officialRanking <= 50 && p.previousRanking && Math.abs(p.previousRanking - p.officialRanking) >= 15)
    .sort((a, b) => Math.abs((b.previousRanking || 0) - b.officialRanking) - Math.abs((a.previousRanking || 0) - a.officialRanking));
  for (const p of bigMovers.slice(0, 2)) {
    const change = (p.previousRanking || 0) - p.officialRanking;
    items.push({
      id: id(),
      headline: change > 0
        ? `${p.name} rockets ${change} places to No.${p.officialRanking}`
        : `${p.name} falls ${Math.abs(change)} places to No.${p.officialRanking}`,
      detail: `${p.countryCode} · ${p.points.toLocaleString()} pts`,
      body: change > 0
        ? `${p.name} is the biggest mover of the week, rocketing ${change} places up the rankings to reach World No.${p.officialRanking}. The ${p.countryCode} player now has ${p.points.toLocaleString()} ranking points to their name.`
        : `${p.name} has suffered a significant drop of ${Math.abs(change)} places in the ATP Rankings, falling to No.${p.officialRanking}. The ${p.countryCode} player will be looking to arrest the slide.`,
      type: 'ranking',
      week: currentWeek,
      season: currentSeason,
      playerName: p.name,
      rankBefore: p.previousRanking,
      rankAfter: p.officialRanking,
    });
  }

  // Laver Cup & Davis Cup news
  const teamEventSims = completedSimulations.filter(s =>
    s.tournament.category === 'Laver Cup' || s.tournament.category === 'Davis Cup'
  );
  for (const sim of teamEventSims) {
    if (!sim.winnerName) continue;
    const isLaver = sim.tournament.category === 'Laver Cup';
    items.push({
      id: id(),
      headline: isLaver
        ? `Team ${sim.winnerName} wins the Laver Cup`
        : `${sim.winnerName} wins the Davis Cup Finals`,
      detail: sim.runnerUpName ? `Defeated ${sim.runnerUpName} in the final` : undefined,
      body: isLaver
        ? `Team ${sim.winnerName} claimed victory at the Laver Cup in ${sim.tournament.city}, defeating Team ${sim.runnerUpName || 'their opponents'} in the team competition. The Laver Cup pits Team Europe against Team World in one of tennis's most exciting team events.`
        : `${sim.winnerName} are crowned Davis Cup champions at the Finals in ${sim.tournament.city}${sim.runnerUpName ? `, defeating ${sim.runnerUpName} in the final` : ''}. The Davis Cup is the premier international team event in men's tennis.`,
      type: 'tournament',
      week: currentWeek,
      season: currentSeason,
      tournamentName: sim.tournament.name,
      tournamentCategory: sim.tournament.category,
      tournamentCity: sim.tournament.city,
      tournamentCountry: sim.tournament.country,
      tournamentSurface: sim.tournament.surface,
      winnerName: sim.winnerName,
      runnerUpName: sim.runnerUpName || undefined,
    });
  }

  // ATP Finals qualification race news (weeks 42–45, 4 weeks before week 46)
  const ATP_FINALS_WEEK = 46;
  const weeksToFinals = ATP_FINALS_WEEK - currentWeek;
  if (weeksToFinals >= 1 && weeksToFinals <= 4) {
    const raceStandings = [...allPlayers]
      .sort((a, b) => b.livePoints - a.livePoints)
      .slice(0, 12);
    const qualified = raceStandings.slice(0, 8);
    const bubblePlayers = raceStandings.slice(5, 11); // positions 6–11 are on the bubble

    const qualifiedNames = qualified.map((p, i) => `${i + 1}. ${p.name} (${p.livePoints.toLocaleString()} pts)`).join(', ');
    const bubbleText = bubblePlayers.map(p => p.name).join(', ');

    items.push({
      id: id(),
      headline: `ATP Finals race: ${weeksToFinals} week${weeksToFinals > 1 ? 's' : ''} to go`,
      detail: `${qualified[7].name} holds the final spot`,
      body: `With ${weeksToFinals} week${weeksToFinals > 1 ? 's' : ''} remaining before the ATP Finals in Turin, the race for the 8 qualifying spots is heating up. Current standings: ${qualifiedNames}. On the bubble: ${bubbleText} — any of these players could still claim the final spots with strong results in the coming weeks.`,
      type: 'general',
      week: currentWeek,
      season: currentSeason,
    });

    // Extra item when only 1 week left — call out the last qualifier specifically
    if (weeksToFinals === 1) {
      const lastIn = qualified[7];
      const firstOut = raceStandings[8];
      const gap = lastIn.livePoints - firstOut.livePoints;
      items.push({
        id: id(),
        headline: `Final ATP Finals spot: ${lastIn.name} leads ${firstOut.name} by ${gap.toLocaleString()} pts`,
        detail: 'Last chance to qualify',
        body: `${lastIn.name} holds the 8th and final qualifying spot for the ATP Finals by just ${gap.toLocaleString()} ranking points over ${firstOut.name}. One strong result could flip this standing in the final week of the regular season.`,
        type: 'general',
        week: currentWeek,
        season: currentSeason,
      });
    }
  }

  // Career player rank move
  if (careerPlayer) {
    const rankChange = (careerPlayer.previousRanking || careerPlayer.officialRanking) - careerPlayer.officialRanking;
    if (rankChange >= 5) {
      items.push({
        id: id(),
        headline: `You climbed ${rankChange} places to World No.${careerPlayer.officialRanking}`,
        body: `Your performances have paid off with a ${rankChange}-place climb to World No.${careerPlayer.officialRanking}. Keep building on this momentum to continue your ascent up the rankings.`,
        type: 'career',
        week: currentWeek,
        season: currentSeason,
        rankBefore: careerPlayer.previousRanking,
        rankAfter: careerPlayer.officialRanking,
      });
    } else if (rankChange <= -5) {
      items.push({
        id: id(),
        headline: `You dropped ${Math.abs(rankChange)} places to World No.${careerPlayer.officialRanking}`,
        body: `A difficult week has seen you drop ${Math.abs(rankChange)} places to World No.${careerPlayer.officialRanking}. Focus on recovering your form to halt the slide.`,
        type: 'career',
        week: currentWeek,
        season: currentSeason,
        rankBefore: careerPlayer.previousRanking,
        rankAfter: careerPlayer.officialRanking,
      });
    }
  }

  return items.slice(0, 10);
}

export const useCareerState = () => {
  const [state, setState] = useState<CareerState>(getInitialCareerState);

  useEffect(() => {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const allPlayersWithCareer = useMemo(() => {
    if (!state.player) return state.allPlayers;
    const careerAsPlayer = careerPlayerToPlayer(state.player);
    careerAsPlayer.officialRanking = state.player.officialRanking;
    careerAsPlayer.points = state.player.officialPoints;
    careerAsPlayer.livePoints = state.player.livePoints;

    // Apply home country advantage for the active tournament's interactive bracket
    if (state.activeTournament) {
      const tournamentId = state.activeTournament.replace('spectator-', '');
      const tournament = allCareerTournaments.find(t => t.id === tournamentId);
      if (tournament) {
        const homeCC = getCountryCodeFromCountry(tournament.country);
        if (homeCC) {
          const applyHome = (p: { countryCode?: string; fictionalRanking: number }) =>
            p.countryCode === homeCC ? { ...p, fictionalRanking: Math.max(1, p.fictionalRanking - 8) } : p;
          const playersWithBonus = state.allPlayers.map(applyHome) as typeof state.allPlayers;
          return [...playersWithBonus, applyHome(careerAsPlayer) as typeof careerAsPlayer];
        }
      }
    }

    return [...state.allPlayers, careerAsPlayer];
  }, [state.player, state.allPlayers, state.activeTournament]);

  const createPlayer = useCallback((data: {
    firstName: string; lastName: string; nationality: string; countryCode: string;
    age: number; hand: 'Right' | 'Left'; favoriteSurface?: Surface;
    archetype: Archetype;
  }) => {
    const bonuses = ARCHETYPE_BONUSES[data.archetype];
    const attrs: CareerAttributes = {
      serve: BASE_ATTRIBUTES.serve + (bonuses.serve || 0),
      return: BASE_ATTRIBUTES.return + (bonuses.return || 0),
      rally: BASE_ATTRIBUTES.rally + (bonuses.rally || 0),
      mentality: BASE_ATTRIBUTES.mentality + (bonuses.mentality || 0),
      physical: BASE_ATTRIBUTES.physical + (bonuses.physical || 0),
      consistency: BASE_ATTRIBUTES.consistency + (bonuses.consistency || 0),
      pressure: BASE_ATTRIBUTES.pressure + (bonuses.pressure || 0),
      recovery: BASE_ATTRIBUTES.recovery + (bonuses.recovery || 0),
      surfaceHard: BASE_ATTRIBUTES.surfaceHard + (data.favoriteSurface === 'Hard' ? 8 : 0),
      surfaceClay: BASE_ATTRIBUTES.surfaceClay + (data.favoriteSurface === 'Clay' ? 8 : 0),
      surfaceGrass: BASE_ATTRIBUTES.surfaceGrass + (data.favoriteSurface === 'Grass' ? 8 : 0),
    };

    const score = calculateFictionalRankingScore(attrs);

    const player: CareerPlayer = {
      ...data,
      attributes: attrs,
      level: 1,
      xp: 0,
      xpToNextLevel: getXpForLevel(1),
      developmentPoints: 5,
      totalDPEarned: 5,
      fictionalRankingScore: score,
      officialRanking: 500,
      officialPoints: 0,
      livePoints: 0,
      previousYearPoints: new Array(52).fill(0),
      currentYearWeeklyPoints: new Array(52).fill(0),
      money: 15000,
      energy: 100,
      fatigue: 0,
      travelFatigue: 0,
      matchLoad: 0,
      form: 0,
      momentum: 0,
      injured: false,
      injuryWeeksRemaining: 0,
      currentCity: 'London',
      currentCountry: 'Great Britain',
      currentContinent: 'Europe',
      consecutiveWeeksPlaying: 0,
      weeksSinceRest: 0,
      stats: {
        wins: 0, losses: 0, titlesWon: 0, titlesDetail: [], tournamentsPlayed: 0, matchesPlayed: 0,
        bestRanking: 500, bestResult: 'N/A',
        surfaceWins: { Hard: 0, Clay: 0, Grass: 0 },
        surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 },
      },
      seasonHistory: [],
      financialHistory: [{ week: 0, season: 1, type: 'income', category: 'Starting Fund', amount: 15000, description: 'Initial career fund' }],
      injuryHistory: [],
      objectives: getDefaultObjectives(),
      sponsors: [],
      staff: [],
      matchHistory: [],
      reputation: 50,
      rankingHistory: [],
      weeklyPlan: [],
    };

    setState({
      player,
      allPlayers: allInitialPlayers.map(p => ({
        ...p,
        points: Math.max(0, p.points - (p.previousYearPoints[0] || 0)),
        weeklyDefensePoints: p.previousYearPoints[0] || 0,
        previousRanking: p.officialRanking,
      })),
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      tournamentHistory: [],
      isCreated: true,
      weeklyActionTaken: false,
      activeTournament: null,
      currentDraw: null,
      globalH2H: {},
      newsItems: [],
      weeklyUsedPlayerIds: [],
    });
  }, []);

  const addXP = useCallback((amount: number) => {
    setState(prev => {
      if (!prev.player) return prev;
      let p = { ...prev.player };
      p.xp += amount;
      while (p.xp >= p.xpToNextLevel && p.level < 50) {
        p.xp -= p.xpToNextLevel;
        p.level++;
        p.xpToNextLevel = getXpForLevel(p.level);
        // DP reward: linear from 16 (level 1) down to 6 (level 20), then constant 6
        const dpReward = Math.max(6, Math.round(16 - (p.level - 1) * (10 / 19)));
        p.developmentPoints += dpReward;
        p.totalDPEarned += dpReward;
      }
      return { ...prev, player: p };
    });
  }, []);

  const spendDP = useCallback((attribute: keyof CareerAttributes, points: number) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      const currentVal = p.attributes[attribute];
      const cost = getDPCost(currentVal) * points;
      if (p.developmentPoints < cost || currentVal + points > ATTRIBUTE_MAX) return prev;
      p.attributes = { ...p.attributes, [attribute]: currentVal + points };
      p.developmentPoints -= cost;
      p.fictionalRankingScore = calculateFictionalRankingScore(p.attributes);
      return { ...prev, player: p };
    });
  }, []);

  const enterTournament = useCallback((tournamentId: string) => {
    setState(prev => ({ ...prev, activeTournament: tournamentId, currentDraw: null }));
  }, []);

  const leaveTournament = useCallback(() => {
    setState(prev => ({ ...prev, activeTournament: null, currentDraw: null }));
  }, []);

  const saveCurrentDraw = useCallback((draw: TournamentDraw) => {
    setState(prev => ({ ...prev, currentDraw: draw }));
  }, []);

  // Complete a tournament played through bracket
  const completeTournament = useCallback((
    tournamentId: string,
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number,
    overrideWinnerName?: string,
    overrideRunnerUpName?: string,
  ) => {
    setState(prev => {
      if (!prev.player) return prev;
      const tournament = allCareerTournaments.find(t => t.id === tournamentId);
      if (!tournament) return prev;

      const p = { ...prev.player };

      const careerResult = results.find(r => r.playerId === CAREER_PLAYER_ID);
      const careerParticipated = !!careerResult;
      const careerRound = careerResult?.round || 'R32';
      const careerPoints = careerResult?.points || 0;
      const isWinner = winnerId === CAREER_PLAYER_ID;

      let xpGained = 0;

      if (careerParticipated) {
        // Calculate wins correctly based on draw size
        const wins = calculateWinsFromRound(careerRound, tournament.playerLimit);
        const losses = isWinner ? 0 : 1;

        const moneyEarned = getMoneyForRound(tournament.category, careerRound);

        let sponsorBonus = 0;
        p.sponsors.forEach(s => {
          if (wins > 0) sponsorBonus += s.sponsor.winBonus * wins;
          if (isWinner) sponsorBonus += s.sponsor.titleBonus;
        });

        p.stats = { ...p.stats };
        p.stats.wins += wins;
        p.stats.losses += losses;
        p.stats.matchesPlayed += wins + losses;
        p.stats.tournamentsPlayed++;
        p.stats.surfaceWins = { ...p.stats.surfaceWins, [tournament.surface]: (p.stats.surfaceWins[tournament.surface] || 0) + wins };
        p.stats.surfaceLosses = { ...p.stats.surfaceLosses, [tournament.surface]: (p.stats.surfaceLosses[tournament.surface] || 0) + losses };

        if (isWinner) {
          p.stats.titlesWon++;
          if (!p.stats.titlesDetail) p.stats.titlesDetail = [];
          p.stats.titlesDetail = [...p.stats.titlesDetail, {
            tournamentName: tournament.name,
            category: tournament.category,
            season: prev.currentSeason,
            week: prev.currentWeek,
            surface: tournament.surface,
          }];
          p.form = Math.min(20, p.form + 5);
        } else {
          p.form = Math.max(-20, p.form + (wins > 0 ? wins - 1 : -2));
        }

        p.livePoints += careerPoints;
        p.officialPoints += careerPoints;
        p.currentYearWeeklyPoints = [...p.currentYearWeeklyPoints];
        p.currentYearWeeklyPoints[prev.currentWeek - 1] = (p.currentYearWeeklyPoints[prev.currentWeek - 1] || 0) + careerPoints;

        p.money += moneyEarned + sponsorBonus;

        // Travel
        const distance = calculateTravelDistance(p.currentCity, tournament.city);
        const toData = CITY_DATA[tournament.city];
        const toContinent = toData?.continent || getContinentFromCountry(tournament.country);
        const travelFat = getTravelFatigue(distance, p.currentContinent, toContinent);
        let travelCost = getTravelCost(distance);
        const totalTravelDiscount = p.sponsors.reduce((sum, s) => sum + s.sponsor.travelDiscount, 0);
        travelCost = Math.round(travelCost * Math.max(0.1, 1 - totalTravelDiscount));

        p.travelFatigue = Math.min(100, p.travelFatigue + travelFat);
        p.money -= travelCost;
        p.currentCity = tournament.city;
        p.currentCountry = tournament.country;
        p.currentContinent = toContinent;

        const staffFatigueReduction = p.staff.reduce((sum, s) => sum + (s.member.effects.fatigueReduction || 0), 0);
        const matchFatigue = Math.max(0, (wins + losses) * 8 - staffFatigueReduction);
        p.fatigue = Math.min(100, p.fatigue + matchFatigue);
        p.energy = Math.max(0, p.energy - matchFatigue * 0.7);
        p.matchLoad += wins + losses;
        p.consecutiveWeeksPlaying++;
        p.weeksSinceRest++;

        p.seasonHistory = [...p.seasonHistory, {
          tournamentId, tournamentName: tournament.name, week: prev.currentWeek,
          season: prev.currentSeason, round: careerRound, pointsEarned: careerPoints,
          moneyEarned: moneyEarned + sponsorBonus, surface: tournament.surface,
        }];

        p.financialHistory = [...p.financialHistory,
          { week: prev.currentWeek, season: prev.currentSeason, type: 'income', category: 'Prize Money', amount: moneyEarned, description: `${tournament.name} - ${careerRound}` },
          ...(sponsorBonus > 0 ? [{ week: prev.currentWeek, season: prev.currentSeason, type: 'income' as const, category: 'Sponsor Bonus', amount: sponsorBonus, description: `Sponsor bonuses for ${tournament.name}` }] : []),
          { week: prev.currentWeek, season: prev.currentSeason, type: 'expense' as const, category: 'Travel', amount: travelCost, description: `Travel to ${tournament.city}` },
        ];

        xpGained = 20 + wins * 15 + careerPoints * 0.1;
      } // end careerParticipated block

      if (careerParticipated) {
        const wins = calculateWinsFromRound(careerRound, tournament.playerLimit);
        const ATP_CATEGORIES = ['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'];
        const itfTitles = p.stats.titlesDetail.filter(t => t.category.startsWith('ITF')).length;
        const challengerTitles = p.stats.titlesDetail.filter(t => t.category.startsWith('Challenger')).length;
        const atpTitles = p.stats.titlesDetail.filter(t => ATP_CATEGORIES.includes(t.category)).length;
        const gsTitles = p.stats.titlesDetail.filter(t => t.category === 'Grand Slam');
        const m1000Titles = p.stats.titlesDetail.filter(t => t.category === 'Masters 1000').length;
        const gsIds = ['roland-garros', 'wimbledon', 'us-open', 'australian-open'];
        const uniqueGSWon = new Set(gsTitles.map(t => t.tournamentId));
        const isGSRound = (r: string) => ['Quarterfinal', 'Semifinal', 'Final', 'Winner'].includes(r);
        const isChallengerOrAbove = (cat: string) => cat.startsWith('Challenger') || ATP_CATEGORIES.includes(cat);
        p.objectives = p.objectives.map(obj => {
          if (obj.completed) return obj;
          let completed = false;
          if (obj.id === 'first-itf-title' && itfTitles >= 1) completed = true;
          if (obj.id === 'itf-titles-3' && itfTitles >= 3) completed = true;
          if (obj.id === 'first-win' && p.stats.wins > 0) completed = true;
          if (obj.id === 'wins-10' && p.stats.wins >= 10) completed = true;
          if (obj.id === 'wins-50' && p.stats.wins >= 50) completed = true;
          if (obj.id === 'wins-100' && p.stats.wins >= 100) completed = true;
          if (obj.id === 'wins-200' && p.stats.wins >= 200) completed = true;
          if (obj.id === 'first-challenger' && challengerTitles >= 1) completed = true;
          if (obj.id === 'challenger-3' && challengerTitles >= 3) completed = true;
          if (obj.id === 'challenger-5' && challengerTitles >= 5) completed = true;
          if (obj.id === 'first-title' && atpTitles >= 1) completed = true;
          if (obj.id === 'titles-3' && atpTitles >= 3) completed = true;
          if (obj.id === 'titles-5' && atpTitles >= 5) completed = true;
          if (obj.id === 'titles-10' && atpTitles >= 10) completed = true;
          if (obj.id === 'first-500' && p.stats.titlesDetail.some(t => t.category === 'ATP 500')) completed = true;
          if (obj.id === 'first-masters' && m1000Titles >= 1) completed = true;
          if (obj.id === 'masters-3' && m1000Titles >= 3) completed = true;
          if (obj.id === 'gs-qualify' && tournament.category === 'Grand Slam') completed = true;
          if (obj.id === 'gs-r16' && tournament.category === 'Grand Slam' && ['R16', 'Quarterfinal', 'Semifinal', 'Final', 'Winner'].includes(careerRound)) completed = true;
          if (obj.id === 'gs-qf' && tournament.category === 'Grand Slam' && isGSRound(careerRound)) completed = true;
          if (obj.id === 'gs-sf' && tournament.category === 'Grand Slam' && ['Semifinal', 'Final', 'Winner'].includes(careerRound)) completed = true;
          if (obj.id === 'gs-final' && tournament.category === 'Grand Slam' && ['Final', 'Winner'].includes(careerRound)) completed = true;
          if (obj.id === 'gs-win' && gsTitles.length >= 1) completed = true;
          if (obj.id === 'gs-2' && gsTitles.length >= 2) completed = true;
          if (obj.id === 'career-slam' && gsIds.every(id => uniqueGSWon.has(id))) completed = true;
          if (obj.id === 'clay-title' && careerRound === 'Winner' && isChallengerOrAbove(tournament.category) && tournament.surface === 'Clay') completed = true;
          if (obj.id === 'grass-title' && careerRound === 'Winner' && isChallengerOrAbove(tournament.category) && tournament.surface === 'Grass') completed = true;
          if (obj.id === 'hard-title' && careerRound === 'Winner' && isChallengerOrAbove(tournament.category) && tournament.surface === 'Hard') completed = true;
          if (obj.id === 'money-100k' && p.money >= 100000) completed = true;
          if (obj.id === 'money-1m' && p.money >= 1000000) completed = true;
          if (obj.id === 'money-5m' && p.money >= 5000000) completed = true;
          if (completed) {
            const reward = obj.reward;
            p.developmentPoints += reward.dp || 0;
            if (reward.money) {
              p.money += reward.money;
              p.financialHistory = [...p.financialHistory, { week: prev.currentWeek, season: prev.currentSeason, type: 'income' as const, category: 'Goal Reward', amount: reward.money, description: `Goal: ${obj.title}` }];
            }
            return { ...obj, completed: true };
          }
          return obj;
        });

        // Reputation update (only when participated)
        const repGain = isWinner
          ? (tournament.category === 'Grand Slam' ? 100 : tournament.category === 'Masters 1000' ? 60 : tournament.category === 'ATP 500' ? 35 : tournament.category === 'ATP 250' ? 20 : tournament.category.startsWith('Challenger') ? 10 : 5)
          : wins > 0 ? Math.min(8, wins * 3) : -2;
        p.reputation = Math.max(0, Math.min(1000, (p.reputation || 50) + repGain));
      } // end objectives + reputation block

      // Build H2H records and matchHistory from the saved draw
      const updatedMatchHistory = [...(p.matchHistory || [])];
      let updatedGlobalH2H = { ...(prev.globalH2H || {}) };
      if (prev.currentDraw) {
        for (const round of prev.currentDraw.rounds) {
          for (const match of round) {
            if (!match.result) continue;
            const wId = match.result.winner.id;
            const lId = match.result.loser.id;
            // Update global H2H for all matches
            const minId = Math.min(wId, lId);
            const maxId = Math.max(wId, lId);
            const key = `${minId}-${maxId}`;
            const cur = updatedGlobalH2H[key] || [0, 0];
            updatedGlobalH2H[key] = wId === minId ? [cur[0] + 1, cur[1]] : [cur[0], cur[1] + 1];
            // Track career player matches for matchHistory
            if (wId === CAREER_PLAYER_ID || lId === CAREER_PLAYER_ID) {
              const opponentId = wId === CAREER_PLAYER_ID ? lId : wId;
              const opponent = prev.allPlayers.find(pl => pl.id === opponentId);
              updatedMatchHistory.push({
                opponentId,
                opponentName: opponent?.name || 'Unknown',
                won: wId === CAREER_PLAYER_ID,
                surface: tournament.surface,
                season: prev.currentSeason,
                week: prev.currentWeek,
                tournamentId,
                round: match.round,
              });
            }
          }
        }
      }
      p.matchHistory = updatedMatchHistory;

      // Update AI players' points and stats
      let updatedAllPlayers = prev.allPlayers.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;
        const newCurrentYear = [...player.currentYearWeeklyPoints];
        newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
        const aiWins = calculateWinsFromRound(result.round, tournament.playerLimit);
        const aiLosses = result.round !== 'Winner' ? 1 : 0;
        const aiStats = player.stats || { wins: 0, losses: 0, surfaceWins: { Hard: 0, Clay: 0, Grass: 0 }, surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 }, currentStreak: 0, bestWinStreak: 0, titles: 0 };
        return {
          ...player,
          livePoints: player.livePoints + result.points,
          points: player.points + result.points,
          currentYearWeeklyPoints: newCurrentYear,
          weeklyEarnedPoints: (player.weeklyEarnedPoints || 0) + result.points,
          stats: {
            ...aiStats,
            wins: aiStats.wins + aiWins,
            losses: aiStats.losses + aiLosses,
            surfaceWins: { ...aiStats.surfaceWins, [tournament.surface]: (aiStats.surfaceWins[tournament.surface] || 0) + aiWins },
            surfaceLosses: { ...aiStats.surfaceLosses, [tournament.surface]: (aiStats.surfaceLosses[tournament.surface] || 0) + aiLosses },
          },
        };
      });

      const { players: rankedPlayers, careerRanking } = recalculateRankings(updatedAllPlayers, p);
      p.officialRanking = careerRanking;

      // Tournament history entry
      const winnerObj = winnerId === CAREER_PLAYER_ID
        ? { name: `${p.firstName} ${p.lastName}` }
        : rankedPlayers.find(pl => pl.id === winnerId);
      const runnerUpObj = runnerUpId === CAREER_PLAYER_ID
        ? { name: `${p.firstName} ${p.lastName}` }
        : rankedPlayers.find(pl => pl.id === runnerUpId);

      const historyEntry: CareerTournamentResult = {
        tournamentId, week: prev.currentWeek, season: prev.currentSeason,
        winnerId, winnerName: overrideWinnerName || winnerObj?.name || 'Unknown',
        runnerUpId, runnerUpName: overrideRunnerUpName || runnerUpObj?.name || 'Unknown',
        results,
      };

      if (p.officialRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: p.officialRanking };
      }

      if (xpGained > 0) setTimeout(() => addXP(Math.round(xpGained)), 0);

      const newNewsItems = [...(prev.newsItems || [])];
      if (['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'].includes(tournament.category)) {
        const winnerPlayer = winnerId === CAREER_PLAYER_ID ? null : rankedPlayers.find(pl => pl.id === winnerId);
        const runnerUpPlayer = runnerUpId && runnerUpId !== CAREER_PLAYER_ID ? rankedPlayers.find(pl => pl.id === runnerUpId) : null;
        const winnerName = historyEntry.winnerName;
        const runnerUpName = historyEntry.runnerUpName;
        const newsId = `${prev.currentSeason}-${prev.currentWeek}-${Math.random().toString(36).slice(2, 7)}`;
        const bodyText = `${winnerName} claimed the ${tournament.name} title in ${tournament.city}, ${runnerUpName ? `defeating ${runnerUpName} in the final. ` : 'emerging victorious. '}${winnerPlayer ? `The victory moves ${winnerName} to World No.${winnerPlayer.officialRanking} in the official ATP Rankings, earning ${tournament.points?.winner?.toLocaleString() || ''} ranking points. ` : ''}${tournament.category === 'Grand Slam' ? 'A Grand Slam title is the most prestigious achievement in tennis.' : tournament.category === 'Masters 1000' ? 'Masters 1000 events are among the most coveted titles on the ATP Tour.' : tournament.category === 'ATP Finals' ? 'The ATP Finals crowns the season-end champion among the top 8 players.' : ''}`.trim();
        newNewsItems.unshift({
          id: newsId,
          headline: `${winnerName} wins the ${tournament.name}`,
          detail: runnerUpName ? `Defeated ${runnerUpName} in the final` : undefined,
          body: bodyText,
          type: 'tournament' as const,
          week: prev.currentWeek,
          season: prev.currentSeason,
          tournamentName: tournament.name,
          tournamentCategory: tournament.category,
          tournamentCity: tournament.city,
          tournamentCountry: tournament.country,
          tournamentSurface: tournament.surface,
          winnerName,
          runnerUpName: runnerUpName || undefined,
          winnerNewRanking: winnerId === CAREER_PLAYER_ID ? p.officialRanking : winnerPlayer?.officialRanking,
          runnerUpNewRanking: runnerUpPlayer?.officialRanking,
          pointsAwarded: tournament.points?.winner,
        });
      }

      return {
        ...prev,
        player: p,
        allPlayers: rankedPlayers,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        tournamentHistory: [...prev.tournamentHistory, historyEntry],
        newsItems: newNewsItems.slice(0, 30),
        activeTournament: null,
        currentDraw: null,
        globalH2H: updatedGlobalH2H,
        weeklyUsedPlayerIds: [...(prev.weeklyUsedPlayerIds || []), ...results.map(r => r.playerId).filter(id => id !== CAREER_PLAYER_ID)],
      };
    });
  }, [addXP]);

  // Quick simulate a tournament for the career player
  const quickSimTournament = useCallback((tournamentId: string) => {
    setState(prev => {
      if (!prev.player) return prev;
      const tournament = allCareerTournaments.find(t => t.id === tournamentId);
      if (!tournament) return prev;

      const p = { ...prev.player };
      const careerAsPlayer = careerPlayerToPlayer(p);

      // Apply home country advantage
      const homeCC = getCountryCodeFromCountry(tournament.country);
      if (homeCC && p.countryCode === homeCC) {
        careerAsPlayer.fictionalRanking = Math.max(1, careerAsPlayer.fictionalRanking - 8);
      }

      const range = getEligibleRankingRange(tournament.category);
      const homeRangeBonus = 40;
      const available = prev.allPlayers.filter(pl => {
        if (pl.injured) return false;
        const isHome = homeCC && pl.countryCode === homeCC;
        return pl.officialRanking >= range.min && pl.officialRanking <= (isHome ? range.max + homeRangeBonus : range.max);
      });
      const entrants = available
        .sort((a, b) => {
          const aHome = homeCC && a.countryCode === homeCC ? 1 : 0;
          const bHome = homeCC && b.countryCode === homeCC ? 1 : 0;
          if (aHome !== bHome) return bHome - aHome;
          return a.officialRanking - b.officialRanking;
        })
        .slice(0, tournament.playerLimit - 1)
        .map(pl => homeCC && pl.countryCode === homeCC ? { ...pl, fictionalRanking: Math.max(1, pl.fictionalRanking - 8) } : pl);

      const allEntrants = [...entrants, careerAsPlayer]
        .sort((a, b) => a.officialRanking - b.officialRanking);

      const bestOf = tournament.category === 'Grand Slam' ? 5 : 3;
      let remaining = [...allEntrants];
      const resultsMap = new Map<number, { points: number; round: string }>();
      let lastLoser: Player | null = null;
      const careerMatchRecords: CareerMatchRecord[] = [];

      while (remaining.length > 1) {
        const roundName = getRoundNameFromCount(remaining.length);
        const next: Player[] = [];
        for (let i = 0; i < remaining.length; i += 2) {
          if (i + 1 >= remaining.length) { next.push(remaining[i]); continue; }
          const mr = playMatch(remaining[i], remaining[i + 1], bestOf as 3 | 5, tournament.surface);
          next.push(mr.winner);
          lastLoser = mr.loser;
          resultsMap.set(mr.loser.id, { points: getPointsForRoundByName(tournament, roundName), round: roundName });
          // Track career player's match for H2H
          if (remaining[i].id === CAREER_PLAYER_ID) {
            const opponent = remaining[i + 1];
            careerMatchRecords.push({
              opponentId: opponent.id,
              opponentName: opponent.name,
              won: mr.winner.id === CAREER_PLAYER_ID,
              surface: tournament.surface,
              season: prev.currentSeason,
              week: prev.currentWeek,
              tournamentId: tournament.id,
              round: roundName,
            });
          } else if (remaining[i + 1].id === CAREER_PLAYER_ID) {
            const opponent = remaining[i];
            careerMatchRecords.push({
              opponentId: opponent.id,
              opponentName: opponent.name,
              won: mr.winner.id === CAREER_PLAYER_ID,
              surface: tournament.surface,
              season: prev.currentSeason,
              week: prev.currentWeek,
              tournamentId: tournament.id,
              round: roundName,
            });
          }
        }
        remaining = next;
      }
      const winner = remaining[0];
      resultsMap.set(winner.id, { points: tournament.points.winner, round: 'Winner' });

      const results = Array.from(resultsMap.entries()).map(([playerId, r]) => ({ playerId, ...r }));

      const careerResult = results.find(r => r.playerId === CAREER_PLAYER_ID);
      if (!careerResult) return prev;

      const careerRound = careerResult.round;
      const careerPoints = careerResult.points;
      const isWinner = winner.id === CAREER_PLAYER_ID;
      
      // Use correct win calculation
      const wins = calculateWinsFromRound(careerRound, tournament.playerLimit);
      const losses = isWinner ? 0 : 1;
      const moneyEarned = getMoneyForRound(tournament.category, careerRound);

      let sponsorBonus = 0;
      p.sponsors.forEach(s => {
        if (wins > 0) sponsorBonus += s.sponsor.winBonus * wins;
        if (isWinner) sponsorBonus += s.sponsor.titleBonus;
      });

      p.stats = { ...p.stats };
      p.stats.wins += wins;
      p.stats.losses += losses;
      p.stats.matchesPlayed += wins + losses;
      p.stats.tournamentsPlayed++;
      p.stats.surfaceWins = { ...p.stats.surfaceWins, [tournament.surface]: (p.stats.surfaceWins[tournament.surface] || 0) + wins };
      p.stats.surfaceLosses = { ...p.stats.surfaceLosses, [tournament.surface]: (p.stats.surfaceLosses[tournament.surface] || 0) + losses };

      if (isWinner) {
        p.stats.titlesWon++;
        if (!p.stats.titlesDetail) p.stats.titlesDetail = [];
        p.stats.titlesDetail = [...p.stats.titlesDetail, {
          tournamentName: tournament.name,
          category: tournament.category,
          season: prev.currentSeason,
          week: prev.currentWeek,
          surface: tournament.surface,
        }];
        p.form = Math.min(20, p.form + 5);
      } else {
        p.form = Math.max(-20, p.form + (wins > 0 ? wins - 1 : -2));
      }

      p.livePoints += careerPoints;
      p.officialPoints += careerPoints;
      p.currentYearWeeklyPoints = [...p.currentYearWeeklyPoints];
      p.currentYearWeeklyPoints[prev.currentWeek - 1] += careerPoints;
      p.money += moneyEarned + sponsorBonus;

      const distance = calculateTravelDistance(p.currentCity, tournament.city);
      const toData = CITY_DATA[tournament.city];
      const toContinent = toData?.continent || getContinentFromCountry(tournament.country);
      let travelCost = getTravelCost(distance);
      const totalDiscount = p.sponsors.reduce((sum, s) => sum + s.sponsor.travelDiscount, 0);
      travelCost = Math.round(travelCost * Math.max(0.1, 1 - totalDiscount));
      p.travelFatigue = Math.min(100, p.travelFatigue + getTravelFatigue(distance, p.currentContinent, toContinent));
      p.money -= travelCost;
      p.currentCity = tournament.city;
      p.currentCountry = tournament.country;
      p.currentContinent = toContinent;

      const staffFatigueReduction = p.staff.reduce((sum, s) => sum + (s.member.effects.fatigueReduction || 0), 0);
      const matchFatigue = Math.max(0, (wins + losses) * 8 - staffFatigueReduction);
      p.fatigue = Math.min(100, p.fatigue + matchFatigue);
      p.energy = Math.max(0, p.energy - matchFatigue * 0.7);
      p.matchLoad += wins + losses;
      p.consecutiveWeeksPlaying++;
      p.weeksSinceRest++;

      p.seasonHistory = [...p.seasonHistory, {
        tournamentId, tournamentName: tournament.name, week: prev.currentWeek,
        season: prev.currentSeason, round: careerRound, pointsEarned: careerPoints,
        moneyEarned: moneyEarned + sponsorBonus, surface: tournament.surface,
      }];
      p.financialHistory = [...p.financialHistory,
        { week: prev.currentWeek, season: prev.currentSeason, type: 'income', category: 'Prize Money', amount: moneyEarned, description: `${tournament.name} - ${careerRound}` },
        ...(sponsorBonus > 0 ? [{ week: prev.currentWeek, season: prev.currentSeason, type: 'income' as const, category: 'Sponsor Bonus', amount: sponsorBonus, description: `Sponsor bonuses` }] : []),
        { week: prev.currentWeek, season: prev.currentSeason, type: 'expense' as const, category: 'Travel', amount: travelCost, description: `Travel to ${tournament.city}` },
      ];

      {
        const ATP_CATEGORIES_QS = ['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'];
        const itfTitles2 = p.stats.titlesDetail.filter(t => t.category.startsWith('ITF')).length;
        const challengerTitles2 = p.stats.titlesDetail.filter(t => t.category.startsWith('Challenger')).length;
        const atpTitles2 = p.stats.titlesDetail.filter(t => ATP_CATEGORIES_QS.includes(t.category)).length;
        const m1000Titles2 = p.stats.titlesDetail.filter(t => t.category === 'Masters 1000').length;
        const gsTitles2 = p.stats.titlesDetail.filter(t => t.category === 'Grand Slam');
        const gsIds2 = ['roland-garros', 'wimbledon', 'us-open', 'australian-open'];
        const uniqueGSWon2 = new Set(gsTitles2.map(t => t.tournamentId));
        const isChallengerOrAbove2 = (cat: string) => cat.startsWith('Challenger') || ATP_CATEGORIES_QS.includes(cat);
        p.objectives = p.objectives.map(obj => {
          if (obj.completed) return obj;
          let completed = false;
          if (obj.id === 'first-itf-title' && itfTitles2 >= 1) completed = true;
          if (obj.id === 'itf-titles-3' && itfTitles2 >= 3) completed = true;
          if (obj.id === 'first-win' && p.stats.wins > 0) completed = true;
          if (obj.id === 'wins-10' && p.stats.wins >= 10) completed = true;
          if (obj.id === 'wins-50' && p.stats.wins >= 50) completed = true;
          if (obj.id === 'wins-100' && p.stats.wins >= 100) completed = true;
          if (obj.id === 'wins-200' && p.stats.wins >= 200) completed = true;
          if (obj.id === 'first-challenger' && challengerTitles2 >= 1) completed = true;
          if (obj.id === 'challenger-3' && challengerTitles2 >= 3) completed = true;
          if (obj.id === 'challenger-5' && challengerTitles2 >= 5) completed = true;
          if (obj.id === 'first-title' && atpTitles2 >= 1) completed = true;
          if (obj.id === 'titles-3' && atpTitles2 >= 3) completed = true;
          if (obj.id === 'titles-5' && atpTitles2 >= 5) completed = true;
          if (obj.id === 'titles-10' && atpTitles2 >= 10) completed = true;
          if (obj.id === 'first-500' && p.stats.titlesDetail.some(t => t.category === 'ATP 500')) completed = true;
          if (obj.id === 'first-masters' && m1000Titles2 >= 1) completed = true;
          if (obj.id === 'masters-3' && m1000Titles2 >= 3) completed = true;
          if (obj.id === 'gs-qualify' && tournament.category === 'Grand Slam') completed = true;
          if (obj.id === 'gs-win' && gsTitles2.length >= 1) completed = true;
          if (obj.id === 'gs-2' && gsTitles2.length >= 2) completed = true;
          if (obj.id === 'career-slam' && gsIds2.every(id => uniqueGSWon2.has(id))) completed = true;
          if (obj.id === 'clay-title' && careerRound === 'Winner' && isChallengerOrAbove2(tournament.category) && tournament.surface === 'Clay') completed = true;
          if (obj.id === 'grass-title' && careerRound === 'Winner' && isChallengerOrAbove2(tournament.category) && tournament.surface === 'Grass') completed = true;
          if (obj.id === 'hard-title' && careerRound === 'Winner' && isChallengerOrAbove2(tournament.category) && tournament.surface === 'Hard') completed = true;
          if (obj.id === 'money-100k' && p.money >= 100000) completed = true;
          if (obj.id === 'money-1m' && p.money >= 1000000) completed = true;
          if (obj.id === 'money-5m' && p.money >= 5000000) completed = true;
          if (completed) {
            const reward = obj.reward;
            p.developmentPoints += reward.dp || 0;
            if (reward.money) {
              p.money += reward.money;
              p.financialHistory = [...p.financialHistory, { week: prev.currentWeek, season: prev.currentSeason, type: 'income' as const, category: 'Goal Reward', amount: reward.money, description: `Goal: ${obj.title}` }];
            }
            return { ...obj, completed: true };
          }
          return obj;
        });
      }

      let updatedPlayers = prev.allPlayers.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;
        const newCurrentYear = [...player.currentYearWeeklyPoints];
        newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
        return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, currentYearWeeklyPoints: newCurrentYear, weeklyEarnedPoints: (player.weeklyEarnedPoints || 0) + result.points };
      });

      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;

      if (p.officialRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: p.officialRanking };
      }

      // Reputation update
      const repGainQS = isWinner
        ? (tournament.category === 'Grand Slam' ? 100 : tournament.category === 'Masters 1000' ? 60 : tournament.category === 'ATP 500' ? 35 : tournament.category === 'ATP 250' ? 20 : tournament.category.startsWith('Challenger') ? 10 : 5)
        : wins > 0 ? Math.min(8, wins * 3) : -2;
      p.reputation = Math.max(0, Math.min(1000, (p.reputation || 50) + repGainQS));

      // H2H match history
      p.matchHistory = [...(p.matchHistory || []), ...careerMatchRecords];

      const historyEntry: CareerTournamentResult = {
        tournamentId, week: prev.currentWeek, season: prev.currentSeason,
        winnerId: winner.id, winnerName: winner.id === CAREER_PLAYER_ID ? `${p.firstName} ${p.lastName}` : winner.name,
        runnerUpId: lastLoser?.id || 0, runnerUpName: lastLoser?.id === CAREER_PLAYER_ID ? `${p.firstName} ${p.lastName}` : lastLoser?.name || '',
        results,
      };

      setTimeout(() => addXP(Math.round(20 + wins * 15 + careerPoints * 0.1)), 0);

      return {
        ...prev, player: p, allPlayers: ranked,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        tournamentHistory: [...prev.tournamentHistory, historyEntry],
        weeklyUsedPlayerIds: [...(prev.weeklyUsedPlayerIds || []), ...results.map(r => r.playerId).filter(id => id !== CAREER_PLAYER_ID)],
      };
    });
  }, [addXP]);

  const train = useCallback((trainingType: TrainingType, surfaceTarget?: Surface) => {
    setState(prev => {
      if (!prev.player) return prev;
      const option = TRAINING_OPTIONS.find(t => t.type === trainingType);
      if (!option) return prev;

      const p = { ...prev.player };
      if (p.money < option.moneyCost) return prev;

      p.money -= option.moneyCost;
      p.energy = Math.max(0, Math.min(100, p.energy - option.energyCost));
      p.fatigue = Math.max(0, Math.min(100, p.fatigue + option.fatigueCost));
      p.weeksSinceRest++;

      const staffEfficiency = p.staff.reduce((mult, s) => mult * (s.member.effects.trainingEfficiency || 1), 1);
      const sponsorPenalty = p.sponsors.reduce((pen, s) => pen + (s.sponsor.trainingEfficiencyPenalty || 0), 0);
      const efficiencyMultiplier = staffEfficiency * Math.max(0.5, 1 - sponsorPenalty);

      let attrs = { ...p.attributes };
      option.attributes.forEach(attr => {
        if (trainingType === 'surface' && surfaceTarget) {
          const surfaceAttr = `surface${surfaceTarget}` as keyof CareerAttributes;
          const currentVal = attrs[surfaceAttr] as number;
          // Diminishing returns: easier to improve when attribute is low, harder when high
          const dimReturns = Math.max(0.35, 1.6 - currentVal / 55);
          const base = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          const improvement = Math.max(1, Math.round(base * efficiencyMultiplier * dimReturns));
          attrs = { ...attrs, [surfaceAttr]: Math.min(ATTRIBUTE_MAX, currentVal + improvement) };
        } else {
          const currentVal = attrs[attr as keyof CareerAttributes] as number;
          // Diminishing returns: easier to improve when attribute is low, harder when high
          const dimReturns = Math.max(0.35, 1.6 - currentVal / 55);
          const base = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          const improvement = Math.max(1, Math.round(base * efficiencyMultiplier * dimReturns));
          attrs = { ...attrs, [attr]: Math.min(ATTRIBUTE_MAX, currentVal + improvement) };
        }
      });
      p.attributes = attrs;
      p.fictionalRankingScore = calculateFictionalRankingScore(attrs);

      p.financialHistory = [...p.financialHistory, {
        week: prev.currentWeek, season: prev.currentSeason,
        type: 'expense', category: 'Training', amount: option.moneyCost, description: option.label,
      }];

      return { ...prev, player: p, weeklyActionTaken: true };
    });
    addXP(15);
  }, [addXP]);

  const rest = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      const staffRecovery = p.staff.reduce((sum, s) => sum + (s.member.effects.recoveryBonus || 0), 0);
      const recoveryBonus = p.attributes.recovery * 0.3 + staffRecovery;
      p.energy = Math.min(100, p.energy + 25 + recoveryBonus);
      p.fatigue = Math.max(0, p.fatigue - 20 - recoveryBonus);
      p.travelFatigue = Math.max(0, p.travelFatigue - 15);
      p.matchLoad = Math.max(0, p.matchLoad - 3);
      p.consecutiveWeeksPlaying = 0;
      p.weeksSinceRest = 0;
      return { ...prev, player: p, weeklyActionTaken: true };
    });
    addXP(5);
  }, [addXP]);

  const signSponsor = useCallback((sponsor: Sponsor) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      if (p.officialRanking > sponsor.minRanking) return prev;
      if (p.sponsors.some(s => s.sponsor.id === sponsor.id)) return prev;
      // Max 1 sponsor per category
      if (p.sponsors.some(s => s.sponsor.category === sponsor.category)) return prev;
      p.sponsors = [...p.sponsors, { sponsor, weeksRemaining: sponsor.duration, totalEarned: 0 }];
      return { ...prev, player: p };
    });
  }, []);

  const cancelSponsor = useCallback((sponsorId: string) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      p.sponsors = p.sponsors.filter(s => s.sponsor.id !== sponsorId);
      return { ...prev, player: p };
    });
  }, []);

  const hireStaff = useCallback((member: StaffMember) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      if (p.staff.some(s => s.member.role === member.role)) return prev;
      p.staff = [...p.staff, { member }];
      return { ...prev, player: p };
    });
  }, []);

  const fireStaff = useCallback((memberId: string) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      p.staff = p.staff.filter(s => s.member.id !== memberId);
      return { ...prev, player: p };
    });
  }, []);

  const advanceWeek = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };

      // Auto-simulate other tournaments for this week (higher-tier first so top players commit there)
      const weekTournaments = allCareerTournaments
        .filter(t =>
          t.week === prev.currentWeek &&
          !prev.completedTournaments.includes(t.id) &&
          !['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(t.category)
        )
        .sort((a, b) => (TOURNAMENT_TIER_ORDER[a.category] ?? 99) - (TOURNAMENT_TIER_ORDER[b.category] ?? 99));

      let updatedPlayers = [...prev.allPlayers];
      const newHistory = [...prev.tournamentHistory];
      const newCompleted = [...prev.completedTournaments];
      const usedPlayerIds = new Set<number>();
      let updatedGlobalH2H = { ...(prev.globalH2H || {}) };
      const weekSimulations: { winnerId: number; winnerName: string; runnerUpId: number; runnerUpName: string; tournament: Tournament }[] = [];

      for (const t of weekTournaments) {
        const available = updatedPlayers.filter(pl => !pl.injured && !usedPlayerIds.has(pl.id));
        const sim = autoSimulateTournamentBracket(t, available);
        if (sim.results.length === 0) continue;

        sim.results.forEach(r => usedPlayerIds.add(r.playerId));
        updatedGlobalH2H = updateGlobalH2H(updatedGlobalH2H, sim.matchPairs);

        updatedPlayers = updatedPlayers.map(player => {
          const result = sim.results.find(r => r.playerId === player.id);
          if (!result) return player;
          const newCurrentYear = [...player.currentYearWeeklyPoints];
          newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
          return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, currentYearWeeklyPoints: newCurrentYear, weeklyEarnedPoints: (player.weeklyEarnedPoints || 0) + result.points };
        });

        newCompleted.push(t.id);
        newHistory.push({
          tournamentId: t.id, week: prev.currentWeek, season: prev.currentSeason,
          winnerId: sim.winnerId, winnerName: sim.winnerName,
          runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName,
          results: sim.results,
        });
        if (sim.winnerId !== 0) {
          weekSimulations.push({ winnerId: sim.winnerId, winnerName: sim.winnerName, runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName, tournament: t });
        }
      }

      // Natural weekly recovery
      const staffRecovery = p.staff.reduce((sum, s) => sum + (s.member.effects.recoveryBonus || 0), 0);
      const staffFatigueRed = p.staff.reduce((sum, s) => sum + (s.member.effects.fatigueReduction || 0), 0);
      p.energy = Math.min(100, p.energy + 5 + staffRecovery * 0.2);
      p.fatigue = Math.max(0, p.fatigue - 3 - staffFatigueRed * 0.3);
      p.travelFatigue = Math.max(0, p.travelFatigue - 5);
      p.matchLoad = Math.max(0, p.matchLoad - 1);
      // Apply weekly staff attribute bonuses (spread first to avoid mutating original reference)
      const weeklyServe = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyServe || 0), 0);
      const weeklyReturn = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyReturn || 0), 0);
      const weeklyRally = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyRally || 0), 0);
      const weeklyConsistency = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyConsistency || 0), 0);
      const weeklyPressure = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyPressure || 0), 0);
      const weeklyPhysical = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyPhysical || 0), 0);
      const weeklyMentality = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyMentality || 0), 0);
      const weeklyRecovery = p.staff.reduce((sum, s) => sum + (s.member.effects.weeklyRecovery || 0), 0);
      if (weeklyServe || weeklyReturn || weeklyRally || weeklyConsistency || weeklyPressure || weeklyPhysical || weeklyMentality || weeklyRecovery) {
        p.attributes = { ...p.attributes };
        if (weeklyServe) p.attributes.serve = Math.min(100, p.attributes.serve + weeklyServe);
        if (weeklyReturn) p.attributes.return = Math.min(100, p.attributes.return + weeklyReturn);
        if (weeklyRally) p.attributes.rally = Math.min(100, p.attributes.rally + weeklyRally);
        if (weeklyConsistency) p.attributes.consistency = Math.min(100, p.attributes.consistency + weeklyConsistency);
        if (weeklyPressure) p.attributes.pressure = Math.min(100, p.attributes.pressure + weeklyPressure);
        if (weeklyPhysical) p.attributes.physical = Math.min(100, p.attributes.physical + weeklyPhysical);
        if (weeklyMentality) p.attributes.mentality = Math.min(100, p.attributes.mentality + weeklyMentality);
        if (weeklyRecovery) p.attributes.recovery = Math.min(100, p.attributes.recovery + weeklyRecovery);
      }
      if (weeklyServe || weeklyReturn || weeklyRally || weeklyConsistency || weeklyPressure || weeklyPhysical || weeklyMentality || weeklyRecovery) {
        p.fictionalRankingScore = calculateFictionalRankingScore(p.attributes);
      }

      // Sponsor weekly income
      let sponsorIncome = 0;
      p.sponsors = p.sponsors.map(s => {
        sponsorIncome += s.sponsor.weeklyIncome;
        return { ...s, weeksRemaining: s.weeksRemaining - 1, totalEarned: s.totalEarned + s.sponsor.weeklyIncome };
      }).filter(s => s.weeksRemaining > 0);

      if (sponsorIncome > 0) {
        p.money += sponsorIncome;
        p.financialHistory = [...p.financialHistory, {
          week: prev.currentWeek, season: prev.currentSeason, type: 'income',
          category: 'Sponsor Income', amount: sponsorIncome, description: 'Weekly sponsor payments',
        }];
      }

      // Sponsor negative effects (media duties, exhibitions, interviews)
      const sponsorFatigue = p.sponsors.reduce((sum, s) => sum + (s.sponsor.weeklyFatigueIncrease || 0), 0);
      const sponsorEnergyDrain = p.sponsors.reduce((sum, s) => sum + (s.sponsor.weeklyEnergyDrain || 0), 0);
      if (sponsorFatigue) p.fatigue = Math.min(100, p.fatigue + sponsorFatigue);
      if (sponsorEnergyDrain) p.energy = Math.max(0, p.energy - sponsorEnergyDrain);

      // Staff weekly cost
      const staffCost = p.staff.reduce((sum, s) => sum + s.member.weeklyCost, 0);
      if (staffCost > 0) {
        p.money -= staffCost;
        p.financialHistory = [...p.financialHistory, {
          week: prev.currentWeek, season: prev.currentSeason, type: 'expense',
          category: 'Staff', amount: staffCost, description: 'Staff weekly salaries',
        }];
      }

      // Injury check
      const staffInjuryPrevention = p.staff.reduce((sum, s) => sum + (s.member.effects.injuryPrevention || 0), 0);
      const baseInjuryChance = 0.01 + (p.fatigue / 100) * 0.04 + (p.consecutiveWeeksPlaying * 0.005);
      const injuryChance = baseInjuryChance * Math.max(0.1, 1 - staffInjuryPrevention);

      if (!p.injured && Math.random() < injuryChance) {
        const severity = Math.random();
        let weeks = 1, type = 'Minor strain';
        if (severity > 0.9) { weeks = 4; type = 'Serious injury'; }
        else if (severity > 0.7) { weeks = 3; type = 'Moderate injury'; }
        else if (severity > 0.4) { weeks = 2; type = 'Light injury'; }
        p.injured = true;
        p.injuryType = type;
        p.injuryWeeksRemaining = weeks;
        p.injuryHistory = [...p.injuryHistory, {
          week: prev.currentWeek, season: prev.currentSeason, type, duration: weeks,
          cause: p.fatigue > 70 ? 'Exhaustion' : 'Random',
        }];
      }

      if (p.injured) {
        p.injuryWeeksRemaining--;
        if (p.injuryWeeksRemaining <= 0) {
          p.injured = false; p.injuryType = undefined; p.injuryWeeksRemaining = 0;
        }
      }

      // AI injury management
      updatedPlayers = updatedPlayers.map(player => {
        let up = { ...player };
        if (up.injured && up.injuryWeeksRemaining > 0) {
          up.injuryWeeksRemaining--;
          if (up.injuryWeeksRemaining <= 0) { up.injured = false; up.injuryWeeksRemaining = 0; }
        }
        if (!up.injured && Math.random() < 0.02) {
          up.injured = true;
          up.injuryWeeksRemaining = Math.floor(Math.random() * 4) + 1;
        }
        return up;
      });

      // Season transition
      let newSeason = prev.currentSeason;
      let newWeek = prev.currentWeek + 1;
      let transitionResult: { retiredNames: string[]; newPlayerNames: string[] } | null = null;

      if (newWeek > 52) {
        newWeek = 1;
        newSeason++;
        p.age++;
        p.previousYearPoints = [...p.currentYearWeeklyPoints];
        p.currentYearWeeklyPoints = new Array(52).fill(0);
        p.livePoints = 0;
        p.form = Math.max(-10, p.form - 3);

        updatedPlayers = updatedPlayers.map(player => ({
          ...player,
          age: player.age + 1,
          previousYearPoints: [...player.currentYearWeeklyPoints],
          currentYearWeeklyPoints: new Array(52).fill(0),
          points: player.livePoints,
          livePoints: 0,
        }));

        // Capture end-of-season top 10 BEFORE retirement processing (to include retiring players)
        const endOfSeasonTop10 = [...updatedPlayers]
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map(pl => ({ name: pl.name, points: pl.points }));

        const result = processSeasonTransition(updatedPlayers);
        updatedPlayers = result.players;
        transitionResult = { ...result, endOfSeasonTop10 };
      }

      // Weekly point defense - deduct defense for the INCOMING week
      const weekToDefend = newWeek - 1; // 0-based index: defend the week we're now entering
      const careerDefended = p.previousYearPoints[weekToDefend] || 0;
      p.officialPoints = Math.max(0, p.officialPoints - careerDefended);

      updatedPlayers = updatedPlayers.map(player => {
        const defended = player.previousYearPoints[weekToDefend] || 0;
        return { ...player, points: Math.max(0, player.points - defended), weeklyDefensePoints: defended, weeklyEarnedPoints: 0, previousRanking: player.officialRanking };
      });

      // Recalculate rankings
      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;

      // Track ranking history
      p.rankingHistory = [...(p.rankingHistory || []), { week: prev.currentWeek, season: prev.currentSeason, ranking: p.officialRanking }];
      if (p.rankingHistory.length > 104) p.rankingHistory = p.rankingHistory.slice(-104);

      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'top-300' && p.officialRanking <= 300) completed = true;
        if (obj.id === 'top-200' && p.officialRanking <= 200) completed = true;
        if (obj.id === 'top-150' && p.officialRanking <= 150) completed = true;
        if (obj.id === 'top-100' && p.officialRanking <= 100) completed = true;
        if (obj.id === 'top-75' && p.officialRanking <= 75) completed = true;
        if (obj.id === 'top-50' && p.officialRanking <= 50) completed = true;
        if (obj.id === 'top-30' && p.officialRanking <= 30) completed = true;
        if (obj.id === 'top-20' && p.officialRanking <= 20) completed = true;
        if (obj.id === 'top-10' && p.officialRanking <= 10) completed = true;
        if (obj.id === 'top-5' && p.officialRanking <= 5) completed = true;
        if (obj.id === 'number-1' && p.officialRanking === 1) completed = true;
        if (obj.id === 'money-100k' && p.money >= 100000) completed = true;
        if (obj.id === 'money-1m' && p.money >= 1000000) completed = true;
        if (obj.id === 'money-5m' && p.money >= 5000000) completed = true;
        if (completed) { p.developmentPoints += obj.reward.dp || 0; p.money += obj.reward.money || 0; return { ...obj, completed: true }; }
        return obj;
      });

      if (p.officialRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: p.officialRanking };
      }

      // Build season summary if transitioning
      let seasonSummary: CareerSeasonSummaryData | null = null;
      if (newWeek === 1) {
        const prevSeason = prev.currentSeason;
        const gs = allCareerTournaments.filter(t => t.category === 'Grand Slam');
        const m1000 = allCareerTournaments.filter(t => t.category === 'Masters 1000');
        const getWinners = (tList: typeof allCareerTournaments) => tList.map(t => {
          const hist = newHistory.find(h => h.tournamentId === t.id && h.season === prevSeason);
          return { tournament: t.name, winner: hist?.winnerName || 'N/A' };
        });
        seasonSummary = {
          season: prevSeason,
          topRanking: (transitionResult as any)?.endOfSeasonTop10 || ranked.slice(0, 10).map(pl => ({ name: pl.name, points: pl.points })),
          grandSlamWinners: getWinners(gs),
          masters1000Winners: getWinners(m1000),
          retiredPlayers: transitionResult?.retiredNames || [],
          newPlayers: transitionResult?.newPlayerNames || [],
        };
      }

      const generatedNews = generateWeeklyNews(weekSimulations, p, prev.currentWeek, prev.currentSeason, ranked);
      const updatedNewsItems = [...generatedNews, ...(prev.newsItems || [])].slice(0, 30);

      return {
        ...prev,
        player: p,
        allPlayers: ranked,
        currentWeek: newWeek,
        currentSeason: newSeason,
        completedTournaments: newWeek === 1 ? [] : newCompleted,
        tournamentHistory: newHistory,
        weeklyActionTaken: false,
        activeTournament: null,
        currentDraw: null,
        seasonSummary,
        globalH2H: updatedGlobalH2H,
        newsItems: updatedNewsItems,
        weeklyUsedPlayerIds: [], // Reset at the start of each new week
      };
    });
  }, []);

  // Simulate a single other tournament (without career player)
  const simulateOtherTournament = useCallback((tournamentId: string) => {
    setState(prev => {
      if (!prev.player) return prev;
      const tournament = allCareerTournaments.find(t => t.id === tournamentId);
      if (!tournament || prev.completedTournaments.includes(tournamentId)) return prev;

      // Exclude players who already played in another tournament this week
      const alreadyPlayedThisWeek = new Set<number>();
      prev.tournamentHistory
        .filter(h => h.week === prev.currentWeek && h.season === prev.currentSeason)
        .forEach(h => h.results.forEach(r => alreadyPlayedThisWeek.add(r.playerId)));
      // Also exclude players currently committed to an active interactive draw
      if (prev.currentDraw) {
        prev.currentDraw.entrantIds?.forEach(id => alreadyPlayedThisWeek.add(id));
      }
      const availableForSim = prev.allPlayers.filter(p => !alreadyPlayedThisWeek.has(p.id));

      const sim = autoSimulateTournamentBracket(tournament, availableForSim);
      if (sim.results.length === 0) return prev;

      let updatedPlayers = prev.allPlayers.map(player => {
        const result = sim.results.find(r => r.playerId === player.id);
        if (!result) return player;
        const newCurrentYear = [...player.currentYearWeeklyPoints];
        newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
        return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, currentYearWeeklyPoints: newCurrentYear, weeklyEarnedPoints: (player.weeklyEarnedPoints || 0) + result.points };
      });

      const p = { ...prev.player };
      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;
      if (careerRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: careerRanking };
      }

      return {
        ...prev,
        player: p,
        allPlayers: ranked,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        tournamentHistory: [...prev.tournamentHistory, {
          tournamentId, week: prev.currentWeek, season: prev.currentSeason,
          winnerId: sim.winnerId, winnerName: sim.winnerName,
          runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName,
          results: sim.results,
        }],
        globalH2H: updateGlobalH2H(prev.globalH2H || {}, sim.matchPairs),
        weeklyUsedPlayerIds: [...(prev.weeklyUsedPlayerIds || []), ...sim.results.map(r => r.playerId).filter(id => id !== CAREER_PLAYER_ID)],
        newsItems: (() => {
          if (!ATP_NEWS_CATEGORIES.includes(tournament.category) || sim.winnerId === 0) return prev.newsItems || [];
          const body = [
            `${sim.winnerName} claimed the ${tournament.name} title in ${tournament.city}${sim.runnerUpName ? `, defeating ${sim.runnerUpName} in the final` : ''}.`,
            tournament.points?.winner ? `The victory earns ${tournament.points.winner.toLocaleString()} ranking points.` : '',
            tournament.category === 'Grand Slam' ? 'A Grand Slam title is the most prestigious achievement in tennis.' :
            tournament.category === 'Masters 1000' ? 'Masters 1000 events are among the most coveted titles on the ATP Tour.' : ''
          ].filter(Boolean).join(' ');
          const item = {
            id: `${prev.currentSeason}-${prev.currentWeek}-${Math.random().toString(36).slice(2, 7)}`,
            headline: `${sim.winnerName} wins the ${tournament.name}`,
            detail: sim.runnerUpName ? `Defeated ${sim.runnerUpName} in the final` : undefined,
            body,
            type: 'tournament' as const,
            week: prev.currentWeek, season: prev.currentSeason,
            tournamentName: tournament.name, tournamentCategory: tournament.category,
            tournamentCity: tournament.city, tournamentCountry: tournament.country,
            tournamentSurface: tournament.surface,
            winnerName: sim.winnerName, runnerUpName: sim.runnerUpName || undefined,
            pointsAwarded: tournament.points?.winner,
          };
          return [item, ...(prev.newsItems || [])].slice(0, 30);
        })(),
      };
    });
  }, []);

  // Simulate all uncompleted tournaments this week
  const simulateAllOtherTournaments = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;
      const weekTournaments = allCareerTournaments
        .filter(t =>
          t.week === prev.currentWeek &&
          !prev.completedTournaments.includes(t.id) &&
          !['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(t.category)
        )
        .sort((a, b) => (TOURNAMENT_TIER_ORDER[a.category] ?? 99) - (TOURNAMENT_TIER_ORDER[b.category] ?? 99));
      if (weekTournaments.length === 0) return prev;

      let updatedPlayers = [...prev.allPlayers];
      const newHistory = [...prev.tournamentHistory];
      const newCompleted = [...prev.completedTournaments];
      const newNewsItems: typeof prev.newsItems = [...(prev.newsItems || [])];
      const usedPlayerIds = new Set<number>();
      let updatedGlobalH2H2 = { ...(prev.globalH2H || {}) };

      for (const t of weekTournaments) {
        const available = updatedPlayers.filter(pl => !pl.injured && !usedPlayerIds.has(pl.id));
        const sim = autoSimulateTournamentBracket(t, available);
        if (sim.results.length === 0) continue;

        sim.results.forEach(r => usedPlayerIds.add(r.playerId));
        updatedGlobalH2H2 = updateGlobalH2H(updatedGlobalH2H2, sim.matchPairs);
        updatedPlayers = updatedPlayers.map(player => {
          const result = sim.results.find(r => r.playerId === player.id);
          if (!result) return player;
          const newCurrentYear = [...player.currentYearWeeklyPoints];
          newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
          return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, currentYearWeeklyPoints: newCurrentYear, weeklyEarnedPoints: (player.weeklyEarnedPoints || 0) + result.points };
        });

        newCompleted.push(t.id);
        newHistory.push({
          tournamentId: t.id, week: prev.currentWeek, season: prev.currentSeason,
          winnerId: sim.winnerId, winnerName: sim.winnerName,
          runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName,
          results: sim.results,
        });

        if (ATP_NEWS_CATEGORIES.includes(t.category) && sim.winnerId !== 0) {
          const body = [
            `${sim.winnerName} claimed the ${t.name} title in ${t.city}${sim.runnerUpName ? `, defeating ${sim.runnerUpName} in the final` : ''}.`,
            t.points?.winner ? `The victory earns ${t.points.winner.toLocaleString()} ranking points.` : '',
            t.category === 'Grand Slam' ? 'A Grand Slam title is the most prestigious achievement in tennis.' :
            t.category === 'Masters 1000' ? 'Masters 1000 events are among the most coveted titles on the ATP Tour.' : '',
          ].filter(Boolean).join(' ');
          newNewsItems.unshift({
            id: `${prev.currentSeason}-${prev.currentWeek}-${Math.random().toString(36).slice(2, 7)}`,
            headline: `${sim.winnerName} wins the ${t.name}`,
            detail: sim.runnerUpName ? `Defeated ${sim.runnerUpName} in the final` : undefined,
            body,
            type: 'tournament' as const,
            week: prev.currentWeek,
            season: prev.currentSeason,
            tournamentName: t.name,
            tournamentCategory: t.category,
            tournamentCity: t.city,
            tournamentCountry: t.country,
            tournamentSurface: t.surface,
            winnerName: sim.winnerName,
            runnerUpName: sim.runnerUpName || undefined,
            pointsAwarded: t.points?.winner,
          });
        }
      }

      const p = { ...prev.player };
      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;
      if (careerRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: careerRanking };
      }

      return {
        ...prev,
        player: p,
        allPlayers: ranked,
        completedTournaments: newCompleted,
        tournamentHistory: newHistory,
        globalH2H: updatedGlobalH2H2,
        newsItems: newNewsItems.slice(0, 30),
      };
    });
  }, []);

  const dismissSeasonSummary = useCallback(() => {
    setState(prev => ({ ...prev, seasonSummary: null }));
  }, []);

  const setWeeklyPlan = useCallback((plan: WeeklyPlanEntry[]) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player, weeklyPlan: plan };
      return { ...prev, player: p };
    });
  }, []);

  const getH2HRecord = useCallback((opponentId: number): { wins: number; losses: number } => {
    const records = state.player?.matchHistory?.filter(m => m.opponentId === opponentId) || [];
    return { wins: records.filter(m => m.won).length, losses: records.filter(m => !m.won).length };
  }, [state.player]);

  const getH2HPair = useCallback((id1: number, id2: number): { p1Wins: number; p2Wins: number } => {
    if (id1 === CAREER_PLAYER_ID || id2 === CAREER_PLAYER_ID) {
      const opponentId = id1 === CAREER_PLAYER_ID ? id2 : id1;
      const records = state.player?.matchHistory?.filter(m => m.opponentId === opponentId) || [];
      const careerWins = records.filter(m => m.won).length;
      const careerLosses = records.filter(m => !m.won).length;
      return id1 === CAREER_PLAYER_ID
        ? { p1Wins: careerWins, p2Wins: careerLosses }
        : { p1Wins: careerLosses, p2Wins: careerWins };
    }
    const minId = Math.min(id1, id2);
    const maxId = Math.max(id1, id2);
    const key = `${minId}-${maxId}`;
    const pair = state.globalH2H?.[key] || [0, 0];
    return id1 === minId
      ? { p1Wins: pair[0], p2Wins: pair[1] }
      : { p1Wins: pair[1], p2Wins: pair[0] };
  }, [state.player, state.globalH2H]);

  // Enter a non-career tournament for playing with dice (spectator mode)
  const enterOtherTournament = useCallback((tournamentId: string) => {
    setState(prev => ({ ...prev, activeTournament: `spectator-${tournamentId}`, currentDraw: null }));
  }, []);

  const resetCareer = useCallback(() => {
    localStorage.removeItem(CAREER_STORAGE_KEY);
    setState({
      player: null, allPlayers: [], currentWeek: 1, currentSeason: 1,
      completedTournaments: [], tournamentHistory: [], isCreated: false,
      weeklyActionTaken: false, activeTournament: null, currentDraw: null,
      globalH2H: {}, newsItems: [], weeklyUsedPlayerIds: [],
    });
  }, []);

  const saveCareer = useCallback((name?: string) => {
    const saveName = name || 'Default';
    const stateToSave = { ...state, saveName };
    const key = `${CAREER_STORAGE_KEY}-${saveName}`;
    localStorage.setItem(key, JSON.stringify(stateToSave));
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(stateToSave));

    const slots = listCareerSaveSlots();
    const existing = slots.findIndex(s => s.name === saveName);
    const playerName = state.player ? `${state.player.firstName} ${state.player.lastName}` : 'Unknown';
    const slot: CareerSaveSlot = { name: saveName, timestamp: Date.now(), season: state.currentSeason, week: state.currentWeek, playerName };
    if (existing >= 0) slots[existing] = slot;
    else slots.push(slot);
    saveCareerSlotsToStorage(slots);
  }, [state]);

  const loadCareer = useCallback((name: string) => {
    const key = `${CAREER_STORAGE_KEY}-${name}`;
    const saved = localStorage.getItem(key);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.allPlayers || parsed.allPlayers.length < 200) {
        parsed.allPlayers = allInitialPlayers.map(p => ({ ...p }));
      }
      parsed.allPlayers = parsed.allPlayers.map((p: Player) => ({ ...p, age: p.age || 25, previousRanking: p.previousRanking || p.officialRanking, weeklyDefensePoints: p.weeklyDefensePoints || 0, weeklyEarnedPoints: p.weeklyEarnedPoints || 0 }));
      if (parsed.player) {
        if (!parsed.player.sponsors) parsed.player.sponsors = [];
        if (!parsed.player.staff) parsed.player.staff = [];
        // Refresh staff effects from AVAILABLE_STAFF to pick up any code changes (e.g. renamed fields, updated values)
        parsed.player.staff = parsed.player.staff.map((s: ActiveStaff) => {
          const latest = AVAILABLE_STAFF.find(m => m.id === s.member.id);
          return latest ? { ...s, member: latest } : s;
        });
        if (parsed.player.officialPoints === undefined) parsed.player.officialPoints = parsed.player.livePoints || 0;
        if (!parsed.player.currentYearWeeklyPoints) parsed.player.currentYearWeeklyPoints = new Array(52).fill(0);
        if (!parsed.player.stats.titlesDetail) parsed.player.stats.titlesDetail = [];
        parsed.player.fictionalRankingScore = calculateFictionalRankingScore(parsed.player.attributes);
      }
      if (!parsed.globalH2H) parsed.globalH2H = {};
      if (!parsed.weeklyUsedPlayerIds) parsed.weeklyUsedPlayerIds = [];
      if (!parsed.newsItems) {
        parsed.newsItems = [];
      } else {
        // Filter out old non-ATP250+ tournament news
        const ATP_NEWS_CATS = ['ATP 250', 'ATP 500', 'Masters 1000', 'Grand Slam', 'ATP Finals'];
        parsed.newsItems = parsed.newsItems.filter((n: any) => {
          if (n.type !== 'tournament') return true;
          if (n.tournamentCategory) return ATP_NEWS_CATS.includes(n.tournamentCategory);
          // Old format without tournamentCategory: filter out by headline keywords
          const hl = (n.headline || '').toLowerCase();
          return !hl.includes('challenger') && !hl.includes('itf') && !hl.includes('takes the open ') && !hl.includes('takes the challenger');
        });
      }
      setState(parsed);
      localStorage.setItem(CAREER_STORAGE_KEY, saved);
      return true;
    } catch { return false; }
  }, []);

  const deleteCareerSave = useCallback((name: string) => {
    localStorage.removeItem(`${CAREER_STORAGE_KEY}-${name}`);
    const slots = listCareerSaveSlots().filter(s => s.name !== name);
    saveCareerSlotsToStorage(slots);
  }, []);

  const addWeeklyExcludedPlayers = useCallback((playerIds: number[]) => {
    setState(prev => ({
      ...prev,
      weeklyUsedPlayerIds: [...new Set([...(prev.weeklyUsedPlayerIds || []), ...playerIds])],
    }));
  }, []);

  return {
    ...state,
    allPlayersWithCareer,
    allCareerTournaments,
    createPlayer,
    addXP,
    spendDP,
    enterTournament,
    leaveTournament,
    completeTournament,
    quickSimTournament,
    saveCurrentDraw,
    train,
    rest,
    advanceWeek,
    resetCareer,
    saveCareer,
    loadCareer,
    deleteCareerSave,
    signSponsor,
    cancelSponsor,
    hireStaff,
    fireStaff,
    simulateOtherTournament,
    simulateAllOtherTournaments,
    enterOtherTournament,
    dismissSeasonSummary,
    setWeeklyPlan,
    getH2HRecord,
    getH2HPair,
    weeklyUsedPlayerIds: state.weeklyUsedPlayerIds || [],
    addWeeklyExcludedPlayers,
  };
};
