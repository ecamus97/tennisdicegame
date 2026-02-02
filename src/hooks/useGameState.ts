import { useState, useEffect, useCallback } from 'react';
import { Player, Tournament, initialPlayers, tournaments } from '@/data/players';

export interface GameState {
  players: Player[];
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  tournamentHistory: TournamentResult[];
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

const STORAGE_KEY = 'tennis-dice-tour-state';

const getInitialState = (): GameState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
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
      
      // When advancing week, update official rankings and handle injuries
      const updatedPlayers = prev.players.map(player => {
        // First update injury recovery
        let updatedPlayer = updateInjuryRecovery(player);
        
        // Chance for new injury
        updatedPlayer = generateRandomInjury(updatedPlayer);
        
        // Deduct points from previous year for this week
        const pointsToDeduct = updatedPlayer.previousYearPoints[newWeek - 1] || 0;
        
        // Calculate new official points
        const newOfficialPoints = Math.max(0, updatedPlayer.points - pointsToDeduct);
        
        return {
          ...updatedPlayer,
          points: newOfficialPoints,
          // If we're starting a new season, reset previous year points
          ...(newWeek === 1 && newSeason > prev.currentSeason ? {
            previousYearPoints: distributePointsToWeeks(updatedPlayer.livePoints),
            livePoints: 0,
          } : {}),
        };
      });

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
        // Reset completed tournaments at season start
        completedTournaments: newWeek === 1 ? [] : prev.completedTournaments,
      };
    });
  }, []);

  // Add points for tournament result
  const addTournamentResult = useCallback((
    tournamentId: string,
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number
  ) => {
    setState(prev => {
      // Update player points
      const updatedPlayers = prev.players.map(player => {
        const result = results.find(r => r.playerId === player.id);
        if (!result) return player;

        // Add to both live and official points
        const newLivePoints = player.livePoints + result.points;
        const newOfficialPoints = player.points + result.points;
        
        // Update previous year points array for this week (for next year's deductions)
        const newPrevYearPoints = [...player.previousYearPoints];
        newPrevYearPoints[prev.currentWeek - 1] = (newPrevYearPoints[prev.currentWeek - 1] || 0) + result.points;

        return {
          ...player,
          livePoints: newLivePoints,
          points: newOfficialPoints,
          previousYearPoints: newPrevYearPoints,
        };
      });

      // Re-rank by official points
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
        winnerName: winner?.name || 'Unknown',
        runnerUpId,
        runnerUpName: runnerUp?.name || 'Unknown',
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

  // Reset game state
  const resetGame = useCallback(() => {
    setState({
      players: initialPlayers,
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      tournamentHistory: [],
    });
  }, []);

  // Manual save game
  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    resetGame,
    saveGame,
    getPlayersByLiveRanking,
    getPlayersByOfficialRanking,
    injurePlayer,
    healPlayer,
  };
};

// Helper to distribute total points across 52 weeks (simplified - just puts all in week 1)
// In a real implementation, this would track actual weekly results
function distributePointsToWeeks(totalPoints: number): number[] {
  const weeks = new Array(52).fill(0);
  weeks[0] = totalPoints; // Simplified - in reality, would track per-tournament
  return weeks;
}
