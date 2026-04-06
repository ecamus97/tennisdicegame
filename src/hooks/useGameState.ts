import { useState, useEffect, useCallback } from 'react';
import { Player, Tournament, initialPlayers, tournaments, Surface, SurfaceAffinity } from '@/data/players';
import { processSeasonTransition } from '@/lib/retirementLogic';
import { MatchResult } from '@/lib/matchEngine';

// Stored match in a draw
export interface StoredMatch {
  id: string;
  player1Id: number;
  player2Id: number;
  result?: MatchResult;
  round: string;
}

// Tournament draw that can be persisted
export interface TournamentDraw {
  tournamentId: string;
  rounds: StoredMatch[][];
  currentRound: number;
  isGenerated: boolean;
  entrantIds: number[];
}

export interface GameState {
  players: Player[];
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  tournamentHistory: TournamentResult[];
  currentDraw: TournamentDraw | null;
  saveName?: string;
}

// Named save slots
export interface SaveSlot {
  name: string;
  timestamp: number;
  season: number;
  week: number;
}

const STORAGE_KEY = 'tennis-dice-tour-state';
const SAVE_SLOTS_KEY = 'tennis-dice-tour-saves';

export function listSaveSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(SAVE_SLOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSlotsToStorage(slots: SaveSlot[]) {
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
}

export interface TournamentResult {
  tournamentId: string;
  week: number;
  season: number;
  winnerId: number;
  winnerName: string;
  runnerUpId: number;
  runnerUpName: string;
  results: PlayerTournamentResult[];
}

export interface PlayerTournamentResult {
  playerId: number;
  points: number;
  round: string;
}


const getInitialState = (): GameState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.players) {
        parsed.players = parsed.players.map((p: Player) => ({
          ...p,
          age: p.age || 25,
          previousRanking: p.previousRanking || p.officialRanking,
          weeklyDefensePoints: p.weeklyDefensePoints || 0,
          currentYearWeeklyPoints: p.currentYearWeeklyPoints || new Array(52).fill(0),
        }));
      }
      return parsed;
    } catch {
      console.error('Failed to parse saved state');
    }
  }
  return {
    players: initialPlayers,
    currentWeek: 1,
    currentSeason: 1,
    completedTournaments: [],
    tournamentHistory: [],
    currentDraw: null,
  };
};

export const useGameState = () => {
  const [state, setState] = useState<GameState>(getInitialState);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Generate random injury (1-4 weeks)
  const generateRandomInjury = (player: Player): Player => {
    // 2% chance of injury when advancing week
    if (Math.random() < 0.02 && !player.injured) {
      return {
        ...player,
        injured: true,
        injuryWeeksRemaining: Math.floor(Math.random() * 4) + 1, // 1-4 weeks
      };
    }
    return player;
  };

  // Update injury recovery
  const updateInjuryRecovery = (player: Player): Player => {
    if (player.injured && player.injuryWeeksRemaining > 0) {
      const weeksRemaining = player.injuryWeeksRemaining - 1;
      return {
        ...player,
        injured: weeksRemaining > 0,
        injuryWeeksRemaining: weeksRemaining,
      };
    }
    return player;
  };

  // Injure a specific player
  const injurePlayer = useCallback((playerId: number, weeks: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, injured: true, injuryWeeksRemaining: weeks } : p
      ),
    }));
  }, []);

  // Heal a specific player
  const healPlayer = useCallback((playerId: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, injured: false, injuryWeeksRemaining: 0 } : p
      ),
    }));
  }, []);

  // Advance to next week - updates rankings and injuries
  const advanceWeek = useCallback(() => {
    setState(prev => {
      const newWeek = prev.currentWeek >= 52 ? 1 : prev.currentWeek + 1;
      const newSeason = prev.currentWeek >= 52 ? prev.currentSeason + 1 : prev.currentSeason;
      const isNewSeason = newWeek === 1 && newSeason > prev.currentSeason;
      
      let updatedPlayers = prev.players.map(player => {
        let updatedPlayer = updateInjuryRecovery(player);
        updatedPlayer = generateRandomInjury(updatedPlayer);
        
        // Weekly point defense - deduct CURRENT week's defense before advancing
        const weekIndex = prev.currentWeek - 1; // 0-based index for current week
        const pointsToDeduct = updatedPlayer.previousYearPoints[weekIndex] || 0;
        const newOfficialPoints = Math.max(0, updatedPlayer.points - pointsToDeduct);
        
        updatedPlayer = {
          ...updatedPlayer,
          points: newOfficialPoints,
          weeklyDefensePoints: pointsToDeduct,
          previousRanking: updatedPlayer.officialRanking,
        };

        // Season transition
        if (isNewSeason) {
          return {
            ...updatedPlayer,
            age: updatedPlayer.age + 1,
            previousYearPoints: [...updatedPlayer.currentYearWeeklyPoints],
            currentYearWeeklyPoints: new Array(52).fill(0),
            points: updatedPlayer.livePoints, // Reset to only earned points
            livePoints: 0,
            weeklyDefensePoints: 0,
          };
        }
        
        return updatedPlayer;
      });

      // Retirement and new player generation at season end
      if (isNewSeason) {
        updatedPlayers = processSeasonTransition(updatedPlayers);
      }

      // Re-rank players by official points
      const rankedPlayers = [...updatedPlayers]
        .sort((a, b) => b.points - a.points)
        .map((player, index) => ({
          ...player,
          officialRanking: index + 1,
        }));

      return {
        ...prev,
        currentWeek: newWeek,
        currentSeason: newSeason,
        players: rankedPlayers,
        currentDraw: null,
        completedTournaments: newWeek === 1 ? [] : prev.completedTournaments,
      };
    });
  }, []);

  // Helper: get wins count from round name
  const getWinsFromRound = (round: string, playerLimit: number): number => {
    const roundMap: Record<string, number> = {
      "Winner": Math.log2(playerLimit),
      "Final": Math.log2(playerLimit) - 1,
      "Semifinal": Math.log2(playerLimit) - 2,
      "Quarterfinal": Math.log2(playerLimit) - 3,
      "R16": Math.log2(playerLimit) - 4,
      "R32": Math.log2(playerLimit) - 5,
      "R64": Math.log2(playerLimit) - 6,
      "R128": 0,
    };
    return Math.max(0, roundMap[round] ?? 0);
  };

  const addTournamentResult = useCallback((
    tournamentId: string,
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number,
    overrideWinnerName?: string,
    overrideRunnerUpName?: string
  ) => {
    setState(prev => {
      const tournament = tournaments.find(t => t.id === tournamentId);
      const surface: Surface = tournament?.surface || "Hard";
      const playerLimit = tournament?.playerLimit || 32;

      // Update player points and stats
      const updatedPlayers = prev.players.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;

        const newLivePoints = player.livePoints + result.points;
        const newOfficialPoints = player.points + result.points;
        const newCurrentYearPoints = [...player.currentYearWeeklyPoints];
        newCurrentYearPoints[prev.currentWeek - 1] = (newCurrentYearPoints[prev.currentWeek - 1] || 0) + result.points;

        // Calculate stats
        const wins = getWinsFromRound(result.round, playerLimit);
        const lost = result.round !== "Winner" ? 1 : 0;
        const isTitle = result.round === "Winner";
        const stats = player.stats || { wins: 0, losses: 0, surfaceWins: { Hard: 0, Clay: 0, Grass: 0 }, surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 }, currentStreak: 0, bestWinStreak: 0, titles: 0 };
        
        let newStreak = stats.currentStreak;
        if (isTitle) {
          newStreak = newStreak > 0 ? newStreak + wins : wins;
        } else {
          // Won some, then lost 1
          newStreak = -1;
        }

        return {
          ...player,
          livePoints: newLivePoints,
          points: newOfficialPoints,
          previousYearPoints: newPrevYearPoints,
          stats: {
            ...stats,
            wins: stats.wins + wins,
            losses: stats.losses + lost,
            surfaceWins: { ...stats.surfaceWins, [surface]: (stats.surfaceWins[surface] || 0) + wins },
            surfaceLosses: { ...stats.surfaceLosses, [surface]: (stats.surfaceLosses[surface] || 0) + lost },
            currentStreak: newStreak,
            bestWinStreak: Math.max(stats.bestWinStreak, newStreak > 0 ? newStreak : 0),
            titles: stats.titles + (isTitle ? 1 : 0),
          },
        };
      });

      const rankedPlayers = [...updatedPlayers]
        .sort((a, b) => b.points - a.points)
        .map((player, index) => ({
          ...player,
          officialRanking: index + 1,
        }));

      const winner = rankedPlayers.find(p => p.id === winnerId);
      const runnerUp = rankedPlayers.find(p => p.id === runnerUpId);

      const tournamentResult: TournamentResult = {
        tournamentId,
        week: prev.currentWeek,
        season: prev.currentSeason,
        winnerId,
        winnerName: overrideWinnerName || winner?.name || 'Unknown',
        runnerUpId,
        runnerUpName: overrideRunnerUpName || runnerUp?.name || 'Unknown',
        results: results.map(r => ({
          playerId: r.playerId,
          points: r.points,
          round: r.round,
        })),
      };

      return {
        ...prev,
        players: rankedPlayers,
        completedTournaments: [...prev.completedTournaments, tournamentId],
        tournamentHistory: [...prev.tournamentHistory, tournamentResult],
      };
    });
  }, []);

  // Update fictional ranking for a player
  const updateFictionalRanking = useCallback((playerId: number, newRanking: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, fictionalRanking: newRanking } : p
      ),
    }));
  }, []);

  // Update surface affinity for a player
  const updateSurfaceAffinity = useCallback((playerId: number, affinity: SurfaceAffinity) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, surfaceAffinity: affinity } : p
      ),
    }));
  }, []);

  // Record match result in player stats
  const recordMatchResult = useCallback((winnerId: number, loserId: number, surface: Surface, isTitle: boolean = false) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id === winnerId) {
          const newStreak = p.stats.currentStreak > 0 ? p.stats.currentStreak + 1 : 1;
          return {
            ...p,
            stats: {
              ...p.stats,
              wins: p.stats.wins + 1,
              surfaceWins: { ...p.stats.surfaceWins, [surface]: (p.stats.surfaceWins[surface] || 0) + 1 },
              currentStreak: newStreak,
              bestWinStreak: Math.max(p.stats.bestWinStreak, newStreak),
              titles: isTitle ? p.stats.titles + 1 : p.stats.titles,
            },
          };
        }
        if (p.id === loserId) {
          const newStreak = p.stats.currentStreak < 0 ? p.stats.currentStreak - 1 : -1;
          return {
            ...p,
            stats: {
              ...p.stats,
              losses: p.stats.losses + 1,
              surfaceLosses: { ...p.stats.surfaceLosses, [surface]: (p.stats.surfaceLosses[surface] || 0) + 1 },
              currentStreak: newStreak,
            },
          };
        }
        return p;
      }),
    }));
  }, []);

  // Save current draw
  const saveCurrentDraw = useCallback((draw: TournamentDraw) => {
    setState(prev => ({
      ...prev,
      currentDraw: draw,
    }));
  }, []);

  // Clear current draw
  const clearCurrentDraw = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentDraw: null,
    }));
  }, []);

  // Reset game state
  const resetGame = useCallback(() => {
    setState({
      players: initialPlayers,
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      tournamentHistory: [],
      currentDraw: null,
    });
  }, []);

  // Manual save game (with optional name)
  const saveGame = useCallback((name?: string) => {
    const saveName = name || state.saveName || 'Default';
    const stateToSave = { ...state, saveName };
    const key = `${STORAGE_KEY}-${saveName}`;
    localStorage.setItem(key, JSON.stringify(stateToSave));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));

    // Update save slots list
    const slots = listSaveSlots();
    const existing = slots.findIndex(s => s.name === saveName);
    const slot: SaveSlot = { name: saveName, timestamp: Date.now(), season: state.currentSeason, week: state.currentWeek };
    if (existing >= 0) slots[existing] = slot;
    else slots.push(slot);
    saveSlotsToStorage(slots);

    setState(stateToSave);
  }, [state]);

  // Load a named save
  const loadGame = useCallback((name: string) => {
    const key = `${STORAGE_KEY}-${name}`;
    const saved = localStorage.getItem(key);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.players) {
        parsed.players = parsed.players.map((p: Player) => ({ ...p, age: p.age || 25, previousRanking: p.previousRanking || p.officialRanking, weeklyDefensePoints: p.weeklyDefensePoints || 0 }));
      }
      setState(parsed);
      localStorage.setItem(STORAGE_KEY, saved);
      return true;
    } catch { return false; }
  }, []);

  // Delete a save slot
  const deleteSave = useCallback((name: string) => {
    localStorage.removeItem(`${STORAGE_KEY}-${name}`);
    const slots = listSaveSlots().filter(s => s.name !== name);
    saveSlotsToStorage(slots);
  }, []);

  // Get players sorted by live ranking
  const getPlayersByLiveRanking = useCallback(() => {
    return [...state.players].sort((a, b) => b.livePoints - a.livePoints);
  }, [state.players]);

  // Get players sorted by official ranking
  const getPlayersByOfficialRanking = useCallback(() => {
    return [...state.players].sort((a, b) => a.officialRanking - b.officialRanking);
  }, [state.players]);

  return {
    ...state,
    advanceWeek,
    addTournamentResult,
    updateFictionalRanking,
    updateSurfaceAffinity,
    recordMatchResult,
    resetGame,
    saveGame,
    loadGame,
    deleteSave,
    saveCurrentDraw,
    clearCurrentDraw,
    getPlayersByLiveRanking,
    getPlayersByOfficialRanking,
    injurePlayer,
    healPlayer,
  };
};

// Helper to distribute total points across 52 weeks
function distributePointsToWeeks(totalPoints: number): number[] {
  const weeks = new Array(52).fill(0);
  // Distribute evenly with remainder in early weeks
  const perWeek = Math.floor(totalPoints / 52);
  const remainder = totalPoints - perWeek * 52;
  for (let i = 0; i < 52; i++) {
    weeks[i] = perWeek + (i < remainder ? 1 : 0);
  }
  return weeks;
}
