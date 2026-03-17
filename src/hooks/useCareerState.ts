import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CareerState, CareerPlayer, CareerAttributes, Archetype, TrainingType,
  BASE_ATTRIBUTES, ARCHETYPE_BONUSES, ATTRIBUTE_MAX,
  calculateFictionalRankingScore, powerScoreToFictionalRanking, getEffectiveFictionalRanking,
  getXpForLevel, getDPCost, getDefaultObjectives, careerPlayerToPlayer,
  PRIZE_MONEY, CITY_DATA, calculateTravelDistance, getTravelCost, getTravelFatigue,
  TRAINING_OPTIONS, CAREER_PLAYER_ID, getMoneyForRound,
  ActiveSponsor, Sponsor, ActiveStaff, StaffMember,
  AVAILABLE_SPONSORS, AVAILABLE_STAFF, CareerTournamentResult,
} from '@/data/careerData';
import { tournaments, Tournament, Surface, Player, initialPlayers } from '@/data/players';
import { extendedPlayers } from '@/data/playersExtended';
import { challengerTournaments, ChallengerTournament, getChallengerMoneyForRound } from '@/data/challengerTournaments';
import { playMatch } from '@/lib/matchEngine';
import { selectTournamentEntrants, getCareerEligibleCategories, canEnterAsWildCard } from '@/lib/tournamentEntryLogic';
import { TournamentDraw } from '@/hooks/useGameState';

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

const getInitialCareerState = (): CareerState => {
  const saved = localStorage.getItem(CAREER_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migration: add allPlayers if missing
      if (!parsed.allPlayers || parsed.allPlayers.length < 200) {
        parsed.allPlayers = allInitialPlayers.map(p => ({ ...p }));
      }
      if (parsed.activeTournament === undefined) parsed.activeTournament = null;
      if (!parsed.tournamentHistory) parsed.tournamentHistory = [];
      if (!parsed.currentDraw) parsed.currentDraw = null;
      // Migration: add new player fields
      if (parsed.player) {
        if (!parsed.player.sponsors) parsed.player.sponsors = [];
        if (!parsed.player.staff) parsed.player.staff = [];
        if (parsed.player.officialPoints === undefined) parsed.player.officialPoints = parsed.player.livePoints || 0;
        if (!parsed.player.currentYearWeeklyPoints) parsed.player.currentYearWeeklyPoints = new Array(52).fill(0);
        // Fix: recalculate fictional ranking with new formula
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

// Auto-simulate a tournament for AI players (works for both ATP and Challenger)
function autoSimulateTournamentBracket(
  tournament: Tournament,
  availablePlayers: Player[],
): { results: { playerId: number; points: number; round: string }[]; winnerId: number; runnerUpId: number; winnerName: string; runnerUpName: string } {
  if (['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(tournament.category)) {
    return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '' };
  }

  const entrants = availablePlayers
    .filter(p => !p.injured && p.id !== CAREER_PLAYER_ID)
    .sort((a, b) => a.officialRanking - b.officialRanking)
    .slice(0, tournament.playerLimit);

  if (entrants.length < 2) return { results: [], winnerId: 0, runnerUpId: 0, winnerName: '', runnerUpName: '' };

  const bestOf = tournament.category === 'Grand Slam' ? 5 : 3;
  let remaining = [...entrants];
  const resultsMap = new Map<number, { points: number; round: string }>();
  let lastLoser: Player | null = null;

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

      // Losers get points for the round they lost in
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

export const useCareerState = () => {
  const [state, setState] = useState<CareerState>(getInitialCareerState);

  useEffect(() => {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Get all players including career player for display
  const allPlayersWithCareer = useMemo(() => {
    if (!state.player) return state.allPlayers;
    const careerAsPlayer = careerPlayerToPlayer(state.player);
    // Set correct official ranking on the career player
    careerAsPlayer.officialRanking = state.player.officialRanking;
    careerAsPlayer.points = state.player.officialPoints;
    careerAsPlayer.livePoints = state.player.livePoints;
    return [...state.allPlayers, careerAsPlayer];
  }, [state.player, state.allPlayers]);

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
    const fictionalRank = powerScoreToFictionalRanking(score);

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
        wins: 0, losses: 0, titlesWon: 0, tournamentsPlayed: 0, matchesPlayed: 0,
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
    };

    setState({
      player,
      allPlayers: allInitialPlayers.map(p => ({ ...p })),
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      tournamentHistory: [],
      isCreated: true,
      weeklyActionTaken: false,
      activeTournament: null,
      currentDraw: null,
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
        const dpReward = Math.max(2, Math.floor(3 + p.level * 0.5));
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

  // Enter a tournament (show bracket view)
  const enterTournament = useCallback((tournamentId: string) => {
    setState(prev => ({ ...prev, activeTournament: tournamentId, currentDraw: null }));
  }, []);

  // Leave tournament view
  const leaveTournament = useCallback(() => {
    setState(prev => ({ ...prev, activeTournament: null, currentDraw: null }));
  }, []);

  // Save current draw for bracket persistence
  const saveCurrentDraw = useCallback((draw: TournamentDraw) => {
    setState(prev => ({ ...prev, currentDraw: draw }));
  }, []);

  // Complete a tournament played through bracket
  const completeTournament = useCallback((
    tournamentId: string,
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number,
  ) => {
    setState(prev => {
      if (!prev.player) return prev;
      const tournament = allCareerTournaments.find(t => t.id === tournamentId);
      if (!tournament) return prev;

      const p = { ...prev.player };

      // Find career player's result
      const careerResult = results.find(r => r.playerId === CAREER_PLAYER_ID);
      const careerRound = careerResult?.round || 'R32';
      const careerPoints = careerResult?.points || 0;
      const isWinner = winnerId === CAREER_PLAYER_ID;

      // Count wins for career player based on round
      const roundOrder = ['R128', 'R64', 'R32', 'R16', 'Quarterfinal', 'Semifinal', 'Final', 'Winner'];
      const careerRoundIdx = roundOrder.indexOf(careerRound);
      const wins = Math.max(0, careerRoundIdx >= 0 ? careerRoundIdx : 0);
      const losses = isWinner ? 0 : 1;

      // Prize money
      const moneyEarned = getMoneyForRound(tournament.category, careerRound);

      // Apply sponsor bonuses
      let sponsorBonus = 0;
      p.sponsors.forEach(s => {
        if (wins > 0) sponsorBonus += s.sponsor.winBonus * wins;
        if (isWinner) sponsorBonus += s.sponsor.titleBonus;
      });

      // Update career player stats
      p.stats = { ...p.stats };
      p.stats.wins += wins;
      p.stats.losses += losses;
      p.stats.matchesPlayed += wins + losses;
      p.stats.tournamentsPlayed++;
      p.stats.surfaceWins = { ...p.stats.surfaceWins, [tournament.surface]: (p.stats.surfaceWins[tournament.surface] || 0) + wins };
      p.stats.surfaceLosses = { ...p.stats.surfaceLosses, [tournament.surface]: (p.stats.surfaceLosses[tournament.surface] || 0) + losses };

      if (isWinner) {
        p.stats.titlesWon++;
        p.form = Math.min(20, p.form + 5);
        p.momentum = Math.min(10, p.momentum + 3);
      } else {
        p.form = Math.max(-20, p.form + (wins > 0 ? wins - 1 : -2));
        p.momentum = Math.max(0, p.momentum - 1);
      }

      // Points
      p.livePoints += careerPoints;
      p.officialPoints += careerPoints;
      p.currentYearWeeklyPoints = [...p.currentYearWeeklyPoints];
      p.currentYearWeeklyPoints[prev.currentWeek - 1] = (p.currentYearWeeklyPoints[prev.currentWeek - 1] || 0) + careerPoints;

      // Money
      p.money += moneyEarned + sponsorBonus;

      // Travel
      const distance = calculateTravelDistance(p.currentCity, tournament.city);
      const toData = CITY_DATA[tournament.city];
      const toContinent = toData?.continent || 'Europe';
      const travelFat = getTravelFatigue(distance, p.currentContinent, toContinent);
      let travelCost = getTravelCost(distance);

      // Apply sponsor travel discount
      const totalTravelDiscount = p.sponsors.reduce((sum, s) => sum + s.sponsor.travelDiscount, 0);
      travelCost = Math.round(travelCost * Math.max(0.1, 1 - totalTravelDiscount));

      p.travelFatigue = Math.min(100, p.travelFatigue + travelFat);
      p.money -= travelCost;
      p.currentCity = tournament.city;
      p.currentCountry = tournament.country;
      p.currentContinent = toContinent;

      // Fatigue from matches
      const staffFatigueReduction = p.staff.reduce((sum, s) => sum + (s.member.effects.fatigueReduction || 0), 0);
      const matchFatigue = Math.max(0, (wins + losses) * 8 - staffFatigueReduction);
      p.fatigue = Math.min(100, p.fatigue + matchFatigue);
      p.energy = Math.max(0, p.energy - matchFatigue * 0.7);
      p.matchLoad += wins + losses;
      p.consecutiveWeeksPlaying++;
      p.weeksSinceRest++;

      // Season history
      p.seasonHistory = [...p.seasonHistory, {
        tournamentId, tournamentName: tournament.name, week: prev.currentWeek,
        season: prev.currentSeason, round: careerRound, pointsEarned: careerPoints,
        moneyEarned: moneyEarned + sponsorBonus, surface: tournament.surface,
      }];

      // Financial history
      p.financialHistory = [...p.financialHistory,
        { week: prev.currentWeek, season: prev.currentSeason, type: 'income', category: 'Prize Money', amount: moneyEarned, description: `${tournament.name} - ${careerRound}` },
        ...(sponsorBonus > 0 ? [{ week: prev.currentWeek, season: prev.currentSeason, type: 'income' as const, category: 'Sponsor Bonus', amount: sponsorBonus, description: `Sponsor bonuses for ${tournament.name}` }] : []),
        { week: prev.currentWeek, season: prev.currentSeason, type: 'expense', category: 'Travel', amount: travelCost, description: `Travel to ${tournament.city}` },
      ];

      // XP
      const xpGained = 20 + wins * 15 + careerPoints * 0.1;

      // Check objectives
      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'first-win' && p.stats.wins > 0) completed = true;
        if (obj.id === 'first-title' && p.stats.titlesWon > 0) completed = true;
        if (obj.id === 'gs-qualify' && tournament.category === 'Grand Slam') completed = true;
        if (obj.id === 'gs-r16' && tournament.category === 'Grand Slam' && ['R16', 'Quarterfinal', 'QF', 'Semifinal', 'SF', 'Final', 'Finalist', 'Winner'].includes(careerRound)) completed = true;
        if (obj.id === 'gs-final' && tournament.category === 'Grand Slam' && ['Final', 'Finalist', 'Winner'].includes(careerRound)) completed = true;
        if (completed) {
          p.developmentPoints += obj.reward.dp || 0;
          p.money += obj.reward.money || 0;
          return { ...obj, completed: true };
        }
        return obj;
      });

      // Update AI players' points from this tournament
      let updatedAllPlayers = prev.allPlayers.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;
        const newPrevYear = [...player.previousYearPoints];
        newPrevYear[prev.currentWeek - 1] = (newPrevYear[prev.currentWeek - 1] || 0) + result.points;
        return {
          ...player,
          livePoints: player.livePoints + result.points,
          points: player.points + result.points,
          previousYearPoints: newPrevYear,
        };
      });

      // Recalculate rankings
      const { players: rankedPlayers, careerRanking } = recalculateRankings(updatedAllPlayers, p);
      p.officialRanking = careerRanking;

      // Tournament history entry
      const winner = winnerId === CAREER_PLAYER_ID
        ? { name: `${p.firstName} ${p.lastName}` }
        : rankedPlayers.find(pl => pl.id === winnerId);
      const runnerUp = runnerUpId === CAREER_PLAYER_ID
        ? { name: `${p.firstName} ${p.lastName}` }
        : rankedPlayers.find(pl => pl.id === runnerUpId);

      const historyEntry: CareerTournamentResult = {
        tournamentId, week: prev.currentWeek, season: prev.currentSeason,
        winnerId, winnerName: winner?.name || 'Unknown',
        runnerUpId, runnerUpName: runnerUp?.name || 'Unknown',
        results,
      };

      setTimeout(() => addXP(Math.round(xpGained)), 0);

      return {
        ...prev,
        player: p,
        allPlayers: rankedPlayers,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        tournamentHistory: [...prev.tournamentHistory, historyEntry],
        weeklyActionTaken: true,
        activeTournament: null,
        currentDraw: null,
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

      // Get available players for this tournament
      const available = prev.allPlayers.filter(pl => !pl.injured);
      const entrants = available
        .sort((a, b) => a.officialRanking - b.officialRanking)
        .slice(0, tournament.playerLimit - 1);

      // Add career player and simulate
      const allEntrants = [...entrants, careerAsPlayer]
        .sort((a, b) => a.officialRanking - b.officialRanking);

      // Quick bracket sim
      const bestOf = tournament.category === 'Grand Slam' ? 5 : 3;
      let remaining = [...allEntrants];
      const resultsMap = new Map<number, { points: number; round: string }>();
      let lastLoser: Player | null = null;

      while (remaining.length > 1) {
        const roundName = getRoundNameFromCount(remaining.length);
        const next: Player[] = [];
        for (let i = 0; i < remaining.length; i += 2) {
          if (i + 1 >= remaining.length) { next.push(remaining[i]); continue; }
          const mr = playMatch(remaining[i], remaining[i + 1], bestOf as 3 | 5, tournament.surface);
          next.push(mr.winner);
          lastLoser = mr.loser;
          resultsMap.set(mr.loser.id, { points: getPointsForRoundByName(tournament, roundName), round: roundName });
        }
        remaining = next;
      }
      const winner = remaining[0];
      resultsMap.set(winner.id, { points: tournament.points.winner, round: 'Winner' });

      const results = Array.from(resultsMap.entries()).map(([playerId, r]) => ({ playerId, ...r }));

      // Now process just like completeTournament - simplified version
      const careerResult = results.find(r => r.playerId === CAREER_PLAYER_ID);
      if (!careerResult) return prev;

      const careerRound = careerResult.round;
      const careerPoints = careerResult.points;
      const isWinner = winner.id === CAREER_PLAYER_ID;
      const roundOrder = ['R128', 'R64', 'R32', 'R16', 'Quarterfinal', 'Semifinal', 'Final', 'Winner'];
      const wins = Math.max(0, roundOrder.indexOf(careerRound));
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

      if (isWinner) { p.stats.titlesWon++; p.form = Math.min(20, p.form + 5); p.momentum = Math.min(10, p.momentum + 3); }
      else { p.form = Math.max(-20, p.form + (wins > 0 ? wins - 1 : -2)); p.momentum = Math.max(0, p.momentum - 1); }

      p.livePoints += careerPoints;
      p.officialPoints += careerPoints;
      p.currentYearWeeklyPoints = [...p.currentYearWeeklyPoints];
      p.currentYearWeeklyPoints[prev.currentWeek - 1] += careerPoints;
      p.money += moneyEarned + sponsorBonus;

      const distance = calculateTravelDistance(p.currentCity, tournament.city);
      const toData = CITY_DATA[tournament.city];
      const toContinent = toData?.continent || 'Europe';
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
        { week: prev.currentWeek, season: prev.currentSeason, type: 'expense', category: 'Travel', amount: travelCost, description: `Travel to ${tournament.city}` },
      ];

      // Check objectives
      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'first-win' && p.stats.wins > 0) completed = true;
        if (obj.id === 'first-title' && p.stats.titlesWon > 0) completed = true;
        if (obj.id === 'gs-qualify' && tournament.category === 'Grand Slam') completed = true;
        if (completed) { p.developmentPoints += obj.reward.dp || 0; p.money += obj.reward.money || 0; return { ...obj, completed: true }; }
        return obj;
      });

      // Update AI players
      let updatedPlayers = prev.allPlayers.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;
        const newPrev = [...player.previousYearPoints];
        newPrev[prev.currentWeek - 1] = (newPrev[prev.currentWeek - 1] || 0) + result.points;
        return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, previousYearPoints: newPrev };
      });

      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;

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
        weeklyActionTaken: true,
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

      // Training efficiency from staff
      const efficiencyMultiplier = p.staff.reduce((mult, s) => mult * (s.member.effects.trainingEfficiency || 1), 1);

      let attrs = { ...p.attributes };
      option.attributes.forEach(attr => {
        if (trainingType === 'surface' && surfaceTarget) {
          const surfaceAttr = `surface${surfaceTarget}` as keyof CareerAttributes;
          const base = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          const improvement = Math.round(base * efficiencyMultiplier);
          attrs = { ...attrs, [surfaceAttr]: Math.min(ATTRIBUTE_MAX, (attrs[surfaceAttr] as number) + improvement) };
        } else {
          const base = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          const improvement = Math.round(base * efficiencyMultiplier);
          attrs = { ...attrs, [attr]: Math.min(ATTRIBUTE_MAX, (attrs[attr] as number) + improvement) };
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

  // Sponsor management
  const signSponsor = useCallback((sponsor: Sponsor) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      if (p.officialRanking > sponsor.minRanking) return prev;
      if (p.sponsors.some(s => s.sponsor.id === sponsor.id)) return prev;
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

  // Staff management
  const hireStaff = useCallback((member: StaffMember) => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      // Only one per role
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

      // Auto-simulate other tournaments for this week (ATP + Challenger)
      const weekTournaments = allCareerTournaments.filter(t =>
        t.week === prev.currentWeek &&
        !prev.completedTournaments.includes(t.id) &&
        !['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(t.category)
      );

      let updatedPlayers = [...prev.allPlayers];
      const newHistory = [...prev.tournamentHistory];
      const newCompleted = [...prev.completedTournaments];
      const usedPlayerIds = new Set<number>();

      for (const t of weekTournaments) {
        const available = updatedPlayers.filter(pl => !pl.injured && !usedPlayerIds.has(pl.id));
        const sim = autoSimulateTournamentBracket(t, available);
        if (sim.results.length === 0) continue;

        // Mark players as used
        sim.results.forEach(r => usedPlayerIds.add(r.playerId));

        // Update AI player points
        updatedPlayers = updatedPlayers.map(player => {
          const result = sim.results.find(r => r.playerId === player.id);
          if (!result) return player;
          const newPrev = [...player.previousYearPoints];
          newPrev[prev.currentWeek - 1] = (newPrev[prev.currentWeek - 1] || 0) + result.points;
          return { ...player, livePoints: player.livePoints + result.points, points: player.points + result.points, previousYearPoints: newPrev };
        });

        newCompleted.push(t.id);
        newHistory.push({
          tournamentId: t.id, week: prev.currentWeek, season: prev.currentSeason,
          winnerId: sim.winnerId, winnerName: sim.winnerName,
          runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName,
          results: sim.results,
        });
      }

      // Natural weekly recovery
      const staffRecovery = p.staff.reduce((sum, s) => sum + (s.member.effects.recoveryBonus || 0), 0);
      const staffFatigueRed = p.staff.reduce((sum, s) => sum + (s.member.effects.fatigueReduction || 0), 0);
      p.energy = Math.min(100, p.energy + 5 + staffRecovery * 0.2);
      p.fatigue = Math.max(0, p.fatigue - 3 - staffFatigueRed * 0.3);
      p.travelFatigue = Math.max(0, p.travelFatigue - 5);
      p.matchLoad = Math.max(0, p.matchLoad - 1);
      p.momentum = Math.max(0, p.momentum - 0.5);

      // Sponsor weekly income and duration
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
        // Heal
        if (up.injured && up.injuryWeeksRemaining > 0) {
          up.injuryWeeksRemaining--;
          if (up.injuryWeeksRemaining <= 0) { up.injured = false; up.injuryWeeksRemaining = 0; }
        }
        // Random injury
        if (!up.injured && Math.random() < 0.02) {
          up.injured = true;
          up.injuryWeeksRemaining = Math.floor(Math.random() * 4) + 1;
        }
        return up;
      });

      // Season transition
      let newSeason = prev.currentSeason;
      let newWeek = prev.currentWeek + 1;

      if (newWeek > 52) {
        newWeek = 1;
        newSeason++;
        p.age++;
        p.previousYearPoints = [...p.currentYearWeeklyPoints];
        p.currentYearWeeklyPoints = new Array(52).fill(0);
        p.livePoints = 0;
        p.form = Math.max(-10, p.form - 3);

        // AI season transition
        updatedPlayers = updatedPlayers.map(player => ({
          ...player,
          previousYearPoints: [...player.previousYearPoints],
          livePoints: 0,
        }));
      }

      // Weekly point defense (deduct defended points for the NEW week)
      const weekToDefend = newWeek - 1; // 0-indexed
      if (newSeason > 1 || prev.currentSeason > 1) {
        // Career player point defense
        const careerDefended = p.previousYearPoints[weekToDefend] || 0;
        p.officialPoints = Math.max(0, p.officialPoints - careerDefended);

        // AI point defense
        updatedPlayers = updatedPlayers.map(player => {
          const defended = player.previousYearPoints[weekToDefend] || 0;
          return { ...player, points: Math.max(0, player.points - defended) };
        });
      }

      // Recalculate rankings
      const { players: ranked, careerRanking } = recalculateRankings(updatedPlayers, p);
      p.officialRanking = careerRanking;

      // Check ranking objectives
      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'top-150' && p.officialRanking <= 150) completed = true;
        if (obj.id === 'top-100' && p.officialRanking <= 100) completed = true;
        if (obj.id === 'top-50' && p.officialRanking <= 50) completed = true;
        if (obj.id === 'top-20' && p.officialRanking <= 20) completed = true;
        if (obj.id === 'top-10' && p.officialRanking <= 10) completed = true;
        if (obj.id === 'number-1' && p.officialRanking === 1) completed = true;
        if (completed) { p.developmentPoints += obj.reward.dp || 0; p.money += obj.reward.money || 0; return { ...obj, completed: true }; }
        return obj;
      });

      if (p.officialRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: p.officialRanking };
      }

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
      };
    });
  }, []);

  const resetCareer = useCallback(() => {
    localStorage.removeItem(CAREER_STORAGE_KEY);
    setState({
      player: null, allPlayers: [], currentWeek: 1, currentSeason: 1,
      completedTournaments: [], tournamentHistory: [], isCreated: false,
      weeklyActionTaken: false, activeTournament: null, currentDraw: null,
    });
  }, []);

  const saveCareer = useCallback(() => {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    ...state,
    allPlayersWithCareer,
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
    signSponsor,
    cancelSponsor,
    hireStaff,
    fireStaff,
  };
};
