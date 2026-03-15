import { useState, useEffect, useCallback } from 'react';
import {
  CareerState, CareerPlayer, CareerAttributes, Archetype, WeeklyAction, TrainingType,
  BASE_ATTRIBUTES, ARCHETYPE_BONUSES, ATTRIBUTE_MAX, ATTRIBUTE_MIN,
  calculateFictionalRankingScore, scoreToFictionalRanking,
  getXpForLevel, getDPCost, getDefaultObjectives,
  PRIZE_MONEY, CITY_DATA, calculateTravelDistance, getTravelCost, getTravelFatigue,
  TRAINING_OPTIONS, CareerSeasonEntry, FinancialEntry, InjuryEntry, Continent,
} from '@/data/careerData';
import { tournaments, Tournament, Surface } from '@/data/players';

const CAREER_STORAGE_KEY = 'tennis-dice-tour-career';

const getInitialCareerState = (): CareerState => {
  const saved = localStorage.getItem(CAREER_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return {
    player: null,
    currentWeek: 1,
    currentSeason: 1,
    completedTournaments: [],
    isCreated: false,
    weeklyActionTaken: false,
  };
};

export const useCareerState = () => {
  const [state, setState] = useState<CareerState>(getInitialCareerState);

  useEffect(() => {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
      officialRanking: 250,
      livePoints: 0,
      previousYearPoints: new Array(52).fill(0),
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
        bestRanking: 250, bestResult: 'N/A',
        surfaceWins: { Hard: 0, Clay: 0, Grass: 0 },
        surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 },
      },
      seasonHistory: [],
      financialHistory: [{ week: 0, season: 1, type: 'income', category: 'Starting Fund', amount: 15000, description: 'Initial career fund' }],
      injuryHistory: [],
      objectives: getDefaultObjectives(),
    };

    setState({
      player,
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      isCreated: true,
      weeklyActionTaken: false,
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

  const playTournament = useCallback((tournamentId: string, round: string, wins: number, losses: number, pointsEarned: number, surface: Surface) => {
    setState(prev => {
      if (!prev.player) return prev;
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) return prev;

      const p = { ...prev.player };
      const prizeMoney = PRIZE_MONEY[tournament.category];
      let moneyEarned = 0;
      if (prizeMoney) {
        const roundKey = round.toLowerCase().replace(/ /g, '').replace('round', 'r') as keyof typeof prizeMoney;
        moneyEarned = prizeMoney[roundKey] || 0;
      }

      // Update stats
      p.stats = { ...p.stats };
      p.stats.wins += wins;
      p.stats.losses += losses;
      p.stats.matchesPlayed += wins + losses;
      p.stats.tournamentsPlayed++;
      p.stats.surfaceWins = { ...p.stats.surfaceWins, [surface]: (p.stats.surfaceWins[surface] || 0) + wins };
      p.stats.surfaceLosses = { ...p.stats.surfaceLosses, [surface]: (p.stats.surfaceLosses[surface] || 0) + losses };
      if (round === 'Winner') {
        p.stats.titlesWon++;
        p.form = Math.min(20, p.form + 5);
        p.momentum = Math.min(10, p.momentum + 3);
      } else {
        p.form = Math.max(-20, p.form + (wins > 0 ? wins - 1 : -2));
        p.momentum = Math.max(0, p.momentum - 1);
      }

      // Points & money
      p.livePoints += pointsEarned;
      p.money += moneyEarned;

      // Fatigue from matches
      const matchFatigue = (wins + losses) * 8;
      p.fatigue = Math.min(100, p.fatigue + matchFatigue);
      p.energy = Math.max(0, p.energy - matchFatigue * 0.7);
      p.matchLoad += wins + losses;
      p.consecutiveWeeksPlaying++;
      p.weeksSinceRest++;

      // Travel to tournament city
      const distance = calculateTravelDistance(p.currentCity, tournament.city);
      const fromContinent = p.currentContinent;
      const toData = CITY_DATA[tournament.city];
      const toContinent = toData?.continent || 'Europe';
      const travelFat = getTravelFatigue(distance, fromContinent, toContinent);
      const travelCost = getTravelCost(distance);
      p.travelFatigue = Math.min(100, p.travelFatigue + travelFat);
      p.money -= travelCost;
      p.currentCity = tournament.city;
      p.currentCountry = tournament.country;
      p.currentContinent = toContinent;

      // Season history
      const entry: CareerSeasonEntry = {
        tournamentId, tournamentName: tournament.name, week: prev.currentWeek,
        season: prev.currentSeason, round, pointsEarned, moneyEarned, surface,
      };
      p.seasonHistory = [...p.seasonHistory, entry];

      // Financial history
      const finEntries: FinancialEntry[] = [
        { week: prev.currentWeek, season: prev.currentSeason, type: 'income', category: 'Prize Money', amount: moneyEarned, description: `${tournament.name} - ${round}` },
        { week: prev.currentWeek, season: prev.currentSeason, type: 'expense', category: 'Travel', amount: travelCost, description: `Travel to ${tournament.city}` },
      ];
      p.financialHistory = [...p.financialHistory, ...finEntries];

      // XP
      const xpGained = 20 + wins * 15 + pointsEarned * 0.1;

      // Check objectives
      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'first-win' && p.stats.wins > 0) completed = true;
        if (obj.id === 'first-title' && p.stats.titlesWon > 0) completed = true;
        if (obj.id === 'gs-qualify' && tournament.category === 'Grand Slam') completed = true;
        if (obj.id === 'gs-r16' && tournament.category === 'Grand Slam' && ['R16', 'QF', 'SF', 'Finalist', 'Winner'].includes(round)) completed = true;
        if (obj.id === 'gs-final' && tournament.category === 'Grand Slam' && ['Finalist', 'Winner'].includes(round)) completed = true;
        if (completed) {
          p.developmentPoints += obj.reward.dp || 0;
          p.money += obj.reward.money || 0;
          return { ...obj, completed: true };
        }
        return obj;
      });

      const newState = {
        ...prev,
        player: p,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        weeklyActionTaken: true,
      };

      // Add XP after state update
      setTimeout(() => addXP(Math.round(xpGained)), 0);

      return newState;
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

      // Improve attributes
      let attrs = { ...p.attributes };
      option.attributes.forEach(attr => {
        if (trainingType === 'surface' && surfaceTarget) {
          const surfaceAttr = `surface${surfaceTarget}` as keyof CareerAttributes;
          const improvement = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          attrs = { ...attrs, [surfaceAttr]: Math.min(ATTRIBUTE_MAX, (attrs[surfaceAttr] as number) + improvement) };
        } else {
          const improvement = option.improvementRange[0] + Math.floor(Math.random() * (option.improvementRange[1] - option.improvementRange[0] + 1));
          attrs = { ...attrs, [attr]: Math.min(ATTRIBUTE_MAX, (attrs[attr] as number) + improvement) };
        }
      });
      p.attributes = attrs;
      p.fictionalRankingScore = calculateFictionalRankingScore(attrs);

      // Financial
      p.financialHistory = [...p.financialHistory, {
        week: prev.currentWeek, season: prev.currentSeason,
        type: 'expense', category: 'Training', amount: option.moneyCost,
        description: option.label,
      }];

      return { ...prev, player: p, weeklyActionTaken: true };
    });

    addXP(15);
  }, [addXP]);

  const rest = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };
      const recoveryBonus = p.attributes.recovery * 0.3;
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

  const advanceWeek = useCallback(() => {
    setState(prev => {
      if (!prev.player) return prev;
      const p = { ...prev.player };

      // Natural weekly recovery
      p.energy = Math.min(100, p.energy + 5);
      p.fatigue = Math.max(0, p.fatigue - 3);
      p.travelFatigue = Math.max(0, p.travelFatigue - 5);
      p.matchLoad = Math.max(0, p.matchLoad - 1);
      p.momentum = Math.max(0, p.momentum - 0.5);

      // Injury check - higher fatigue = higher chance
      const injuryChance = 0.01 + (p.fatigue / 100) * 0.04 + (p.consecutiveWeeksPlaying * 0.005);
      if (!p.injured && Math.random() < injuryChance) {
        const severity = Math.random();
        let weeks = 1;
        let type = 'Minor strain';
        if (severity > 0.9) { weeks = 4; type = 'Serious injury'; }
        else if (severity > 0.7) { weeks = 3; type = 'Moderate injury'; }
        else if (severity > 0.4) { weeks = 2; type = 'Light injury'; }
        p.injured = true;
        p.injuryType = type;
        p.injuryWeeksRemaining = weeks;
        p.injuryHistory = [...p.injuryHistory, {
          week: prev.currentWeek, season: prev.currentSeason,
          type, duration: weeks, cause: p.fatigue > 70 ? 'Exhaustion' : 'Random',
        }];
      }

      // Heal injury
      if (p.injured) {
        p.injuryWeeksRemaining--;
        if (p.injuryWeeksRemaining <= 0) {
          p.injured = false;
          p.injuryType = undefined;
          p.injuryWeeksRemaining = 0;
        }
      }

      // Ranking objectives check
      p.objectives = p.objectives.map(obj => {
        if (obj.completed) return obj;
        let completed = false;
        if (obj.id === 'top-150' && p.officialRanking <= 150) completed = true;
        if (obj.id === 'top-100' && p.officialRanking <= 100) completed = true;
        if (obj.id === 'top-50' && p.officialRanking <= 50) completed = true;
        if (obj.id === 'top-20' && p.officialRanking <= 20) completed = true;
        if (obj.id === 'top-10' && p.officialRanking <= 10) completed = true;
        if (obj.id === 'number-1' && p.officialRanking === 1) completed = true;
        if (completed) {
          p.developmentPoints += obj.reward.dp || 0;
          p.money += obj.reward.money || 0;
          return { ...obj, completed: true };
        }
        return obj;
      });

      if (p.officialRanking < p.stats.bestRanking) {
        p.stats = { ...p.stats, bestRanking: p.officialRanking };
      }

      // Age progression at end of season
      let newSeason = prev.currentSeason;
      let newWeek = prev.currentWeek + 1;
      if (newWeek > 52) {
        newWeek = 1;
        newSeason++;
        p.age++;
        // Reset season points
        p.previousYearPoints = new Array(52).fill(0);
        // Decay form slightly
        p.form = Math.max(-10, p.form - 3);
      }

      return {
        ...prev,
        player: p,
        currentWeek: newWeek,
        currentSeason: newSeason,
        weeklyActionTaken: false,
      };
    });
  }, []);

  const resetCareer = useCallback(() => {
    localStorage.removeItem(CAREER_STORAGE_KEY);
    setState({
      player: null, currentWeek: 1, currentSeason: 1,
      completedTournaments: [], isCreated: false, weeklyActionTaken: false,
    });
  }, []);

  const saveCareer = useCallback(() => {
    localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return {
    ...state,
    createPlayer,
    addXP,
    spendDP,
    playTournament,
    train,
    rest,
    advanceWeek,
    resetCareer,
    saveCareer,
  };
};
