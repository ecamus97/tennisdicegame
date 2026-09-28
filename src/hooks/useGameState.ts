import { useState, useEffect, useCallback } from 'react';
import { Player, Tournament, initialPlayers, tournaments, Surface, SurfaceAffinity } from '@/data/players';
import { extendedPlayers } from '@/data/playersExtended';
import { processSeasonTransition, SeasonTransitionResult } from '@/lib/retirementLogic';
import { TOURNAMENT_TIER_ORDER } from '@/lib/tournamentTiers';
import { autoSimulateTournamentBracket } from '@/lib/tournamentSimulation';
import { autoResolveLaverCup } from '@/lib/laverCupSimulation';
import { autoResolveATPFinals } from '@/lib/atpFinalsSimulation';
import { calculateTournamentFatigueGain } from '@/data/careerData';
import {
  DavisCupSeasonState, generateYear1Season, generateNextSeason,
  generateSeptemberRounds, generateFinalEight, advanceFinalEight, autoResolveTies, refreshFebRosters,
  DAVIS_CUP_FEB_WEEK, DAVIS_CUP_SEPT_WEEK, DAVIS_CUP_FINAL8_WEEK,
} from '@/data/davisCupData';

// Full player pool: the base 150 plus the extended bench (150-500+), same as career mode.
const allInitialPlayers: Player[] = [...initialPlayers, ...extendedPlayers];
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

export interface SeasonSummaryData {
  season: number;
  topRanking: { name: string; points: number }[];
  grandSlamWinners: { tournament: string; winner: string }[];
  masters1000Winners: { tournament: string; winner: string }[];
  retiredPlayers: string[];
  newPlayers: string[];
}

export interface GameState {
  players: Player[];
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  tournamentHistory: TournamentResult[];
  currentDraw: TournamentDraw | null;
  saveName?: string;
  seasonSummary?: SeasonSummaryData | null;
  davisCupSeason: DavisCupSeasonState | null;
  /** Players committed to a tournament this week (via auto-sim, manual completion, or a locked-in
   * Laver Cup team) — excluded from other same-week tournaments' entrant pools. Reset each week. */
  weeklyUsedPlayerIds: number[];
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
      if (!parsed.players || parsed.players.length < 200) {
        parsed.players = allInitialPlayers.map(p => ({ ...p }));
      }
      if (parsed.players) {
        parsed.players = parsed.players.map((p: Player) => ({
          ...p,
          age: p.age || 25,
          previousRanking: p.previousRanking || p.officialRanking,
          weeklyDefensePoints: p.weeklyDefensePoints || 0,
          currentYearWeeklyPoints: p.currentYearWeeklyPoints || new Array(52).fill(0),
        }));
      }
      if (parsed.davisCupSeason === undefined) parsed.davisCupSeason = null;
      if (!parsed.weeklyUsedPlayerIds) parsed.weeklyUsedPlayerIds = [];
      return parsed;
    } catch {
      console.error('Failed to parse saved state');
    }
  }
  return {
    players: allInitialPlayers.map(p => ({ ...p })),
    currentWeek: 1,
    currentSeason: 1,
    completedTournaments: [],
    tournamentHistory: [],
    currentDraw: null,
    davisCupSeason: null,
    weeklyUsedPlayerIds: [],
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

      // Auto-simulate other tournaments for the week we're leaving that the player skipped
      // (higher-tier first, so top players commit there before lower-tier draws are generated) —
      // ported from career mode so Tour mode doesn't silently drop skipped tournaments.
      const weekTournaments = tournaments
        .filter(t =>
          t.week === prev.currentWeek &&
          !prev.completedTournaments.includes(t.id) &&
          !['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(t.category)
        )
        .sort((a, b) => (TOURNAMENT_TIER_ORDER[a.category] ?? 99) - (TOURNAMENT_TIER_ORDER[b.category] ?? 99));

      let updatedPlayers = [...prev.players];
      const newHistory = [...prev.tournamentHistory];
      const newCompleted = [...prev.completedTournaments];
      const usedPlayerIds = new Set<number>(prev.weeklyUsedPlayerIds || []);

      for (const t of weekTournaments) {
        const available = updatedPlayers.filter(pl => !pl.injured && !usedPlayerIds.has(pl.id));
        const sim = autoSimulateTournamentBracket(t, available);
        if (sim.results.length === 0) continue;

        sim.results.forEach(r => usedPlayerIds.add(r.playerId));

        updatedPlayers = updatedPlayers.map(player => {
          const result = sim.results.find(r => r.playerId === player.id);
          if (!result) return player;
          const newCurrentYear = [...player.currentYearWeeklyPoints];
          newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
          const fatigueGain = calculateTournamentFatigueGain(result.round, t.category, t.playerLimit);
          return {
            ...player,
            livePoints: player.livePoints + result.points,
            points: player.points + result.points,
            currentYearWeeklyPoints: newCurrentYear,
            fatigue: Math.min(100, (player.fatigue ?? 0) + fatigueGain),
          };
        });

        newCompleted.push(t.id);
        newHistory.push({
          tournamentId: t.id, week: prev.currentWeek, season: prev.currentSeason,
          winnerId: sim.winnerId, winnerName: sim.winnerName,
          runnerUpId: sim.runnerUpId, runnerUpName: sim.runnerUpName,
          results: sim.results,
        });
      }

      // Laver Cup & ATP Finals: bespoke team/round-robin formats excluded from the generic loop
      // above. Auto-resolve them too if the player skipped past their week without opening the
      // bracket, so the calendar always ends up with a winner for them.
      const laverCupTournament = tournaments.find(t => t.id === 'laver-cup');
      if (laverCupTournament && prev.currentWeek === laverCupTournament.week && !newCompleted.includes('laver-cup')) {
        const lcResult = autoResolveLaverCup(updatedPlayers);
        if (lcResult) {
          newCompleted.push('laver-cup');
          newHistory.push({
            tournamentId: 'laver-cup', week: prev.currentWeek, season: prev.currentSeason,
            winnerId: lcResult.winnerId, winnerName: lcResult.winnerName,
            runnerUpId: lcResult.runnerUpId, runnerUpName: lcResult.runnerUpName,
            results: [],
          });
        }
      }
      const atpFinalsTournament = tournaments.find(t => t.id === 'atp-finals');
      if (atpFinalsTournament && prev.currentWeek === atpFinalsTournament.week && !newCompleted.includes('atp-finals')) {
        const afResult = autoResolveATPFinals(updatedPlayers);
        if (afResult) {
          newCompleted.push('atp-finals');
          newHistory.push({
            tournamentId: 'atp-finals', week: prev.currentWeek, season: prev.currentSeason,
            winnerId: afResult.winnerId, winnerName: afResult.winnerName,
            runnerUpId: afResult.runnerUpId, runnerUpName: afResult.runnerUpName,
            results: afResult.results,
          });
          updatedPlayers = updatedPlayers.map(player => {
            const result = afResult.results.find(r => r.playerId === player.id);
            if (!result) return player;
            const newCurrentYear = [...player.currentYearWeeklyPoints];
            newCurrentYear[prev.currentWeek - 1] = (newCurrentYear[prev.currentWeek - 1] || 0) + result.points;
            const fatigueGain = calculateTournamentFatigueGain(result.round, 'ATP Finals', 8);
            return {
              ...player,
              livePoints: player.livePoints + result.points,
              points: player.points + result.points,
              currentYearWeeklyPoints: newCurrentYear,
              fatigue: Math.min(100, (player.fatigue ?? 0) + fatigueGain),
            };
          });
        }
      }

      // Rest recovery: any player who didn't compete anywhere this week sheds some accumulated
      // fatigue, making them more likely to re-enter next week — mirrors career mode's CPU
      // fatigue recovery (useCareerState.ts) so Tour mode doesn't let players who keep entering
      // every single week (no fatigue penalty ever applying) snowball past their real level.
      const restedThisWeekIds = usedPlayerIds;
      const REST_RECOVERY_PER_WEEK = 12;
      updatedPlayers = updatedPlayers.map(player =>
        restedThisWeekIds.has(player.id)
          ? player
          : { ...player, fatigue: Math.max(0, (player.fatigue ?? 0) - REST_RECOVERY_PER_WEEK) }
      );

      updatedPlayers = updatedPlayers.map(player => {
        let updatedPlayer = updateInjuryRecovery(player);
        updatedPlayer = generateRandomInjury(updatedPlayer);

        // Weekly point defense - deduct defense for the INCOMING week (the one we're now
        // entering), before its tournaments are played. Matches career mode's useCareerState.ts.
        const weekToDefend = newWeek - 1; // 0-based index: defend the week we're now entering
        const pointsToDeduct = updatedPlayer.previousYearPoints[weekToDefend] || 0;
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
      let retiredNames: string[] = [];
      let newPlayerNames: string[] = [];
      if (isNewSeason) {
        const result = processSeasonTransition(updatedPlayers);
        updatedPlayers = result.players;
        retiredNames = result.retiredNames;
        newPlayerNames = result.newPlayerNames;
      }

      // Re-rank players by official points
      const rankedPlayers = [...updatedPlayers]
        .sort((a, b) => b.points - a.points)
        .map((player, index) => ({
          ...player,
          officialRanking: index + 1,
        }));

      // Build season summary if transitioning
      let seasonSummary: SeasonSummaryData | null = null;
      if (isNewSeason) {
        const gs = tournaments.filter(t => t.category === 'Grand Slam');
        const m1000 = tournaments.filter(t => t.category === 'Masters 1000');
        const prevSeason = prev.currentSeason;
        const getWinners = (tList: typeof tournaments) => tList.map(t => {
          const hist = newHistory.find(h => h.tournamentId === t.id && h.season === prevSeason);
          return { tournament: t.name, winner: hist?.winnerName || 'N/A' };
        });
        seasonSummary = {
          season: prevSeason,
          topRanking: rankedPlayers.slice(0, 10).map(p => ({ name: p.name, points: p.points })),
          grandSlamWinners: getWinners(gs),
          masters1000Winners: getWinners(m1000),
          retiredPlayers: retiredNames,
          newPlayers: newPlayerNames,
        };
      }

      // Davis Cup: auto-resolve any ties the player didn't play, then roll the season structure
      // forward — ported from career mode's advanceWeek (useCareerState.ts) so Tour mode doesn't
      // go blank once the calendar passes February/September/November without the player manually
      // finishing the bracket.
      let updatedDavisCup = prev.davisCupSeason;
      const getDCPlayer = (id: number) => rankedPlayers.find(pl => pl.id === id);
      if (prev.currentWeek === DAVIS_CUP_FEB_WEEK) {
        if (!updatedDavisCup) updatedDavisCup = generateYear1Season(rankedPlayers);
        updatedDavisCup = {
          ...updatedDavisCup,
          qualifiersR1: autoResolveTies(updatedDavisCup.qualifiersR1, getDCPlayer),
          worldGroupIRound1: autoResolveTies(updatedDavisCup.worldGroupIRound1, getDCPlayer),
        };
        updatedDavisCup = generateSeptemberRounds(updatedDavisCup);
        if (!newCompleted.includes('davis-cup-feb')) newCompleted.push('davis-cup-feb');
      }
      if (prev.currentWeek === DAVIS_CUP_SEPT_WEEK && updatedDavisCup) {
        updatedDavisCup = {
          ...updatedDavisCup,
          worldGroupIRound2: autoResolveTies(updatedDavisCup.worldGroupIRound2, getDCPlayer),
          worldGroupIIRound2: autoResolveTies(updatedDavisCup.worldGroupIIRound2, getDCPlayer),
          qualifiersR2: autoResolveTies(updatedDavisCup.qualifiersR2, getDCPlayer),
        };
        updatedDavisCup = generateFinalEight(updatedDavisCup);
        if (!newCompleted.includes('davis-cup-sept')) newCompleted.push('davis-cup-sept');
      }
      if (prev.currentWeek === DAVIS_CUP_FINAL8_WEEK && updatedDavisCup) {
        for (let i = 0; i < 6; i++) {
          updatedDavisCup = {
            ...updatedDavisCup,
            finalEight: {
              ...updatedDavisCup.finalEight,
              quarterFinals: autoResolveTies(updatedDavisCup.finalEight.quarterFinals, getDCPlayer),
              semiFinals: autoResolveTies(updatedDavisCup.finalEight.semiFinals, getDCPlayer),
              final: updatedDavisCup.finalEight.final ? autoResolveTies([updatedDavisCup.finalEight.final], getDCPlayer)[0] : undefined,
            },
          };
          updatedDavisCup = advanceFinalEight(updatedDavisCup);
        }
        if (updatedDavisCup.history.champion) {
          // Push a tournamentHistory entry with the champion's name (unless the player already
          // finished the bracket interactively, which pushes its own entry via addTournamentResult)
          // before generateNextSeason resets history for next season.
          if (!newCompleted.includes('davis-cup-final8')) {
            const championCode = updatedDavisCup.history.champion;
            const runnerUpCode = updatedDavisCup.history.runnerUp;
            const winnerCountry = updatedDavisCup.countries[championCode];
            const runnerUpCountry = runnerUpCode ? updatedDavisCup.countries[runnerUpCode] : undefined;
            newHistory.push({
              tournamentId: 'davis-cup-final8', week: prev.currentWeek, season: prev.currentSeason,
              winnerId: winnerCountry?.player1Id || 0, winnerName: winnerCountry?.country || 'Unknown',
              runnerUpId: runnerUpCountry?.player1Id || 0, runnerUpName: runnerUpCountry?.country || 'Unknown',
              results: [],
            });
          }
          updatedDavisCup = generateNextSeason(updatedDavisCup, rankedPlayers);
        }
        if (!newCompleted.includes('davis-cup-final8')) newCompleted.push('davis-cup-final8');
      }

      // The Feb ties' countries/players were locked in back in November (generateNextSeason),
      // weeks before the season-boundary retirements above could run. Refresh every country's
      // roster right as the Feb week begins so a tie never points at a since-retired player.
      if (newWeek === DAVIS_CUP_FEB_WEEK && updatedDavisCup) {
        updatedDavisCup = refreshFebRosters(updatedDavisCup, rankedPlayers);
      }

      return {
        ...prev,
        currentWeek: newWeek,
        currentSeason: newSeason,
        players: rankedPlayers,
        currentDraw: null,
        completedTournaments: newWeek === 1 ? [] : newCompleted,
        tournamentHistory: newHistory,
        seasonSummary,
        davisCupSeason: updatedDavisCup,
        weeklyUsedPlayerIds: [], // Reset at the start of each new week
      };
    });
  }, []);

  // Add players (e.g. a locked-in Laver Cup team) to this week's excluded pool, so other
  // same-week tournaments' entrant selection doesn't also draw from them.
  const addWeeklyExcludedPlayers = useCallback((playerIds: number[]) => {
    setState(prev => ({
      ...prev,
      weeklyUsedPlayerIds: [...new Set([...(prev.weeklyUsedPlayerIds || []), ...playerIds])],
    }));
  }, []);

  // Update the Davis Cup season state (interactive bracket play updates this directly).
  const updateDavisCupSeason = useCallback((season: DavisCupSeasonState) => {
    setState(prev => ({ ...prev, davisCupSeason: season }));
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
          currentYearWeeklyPoints: newCurrentYearPoints,
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
        weeklyUsedPlayerIds: [...new Set([...(prev.weeklyUsedPlayerIds || []), ...results.map(r => r.playerId)])],
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

  // Dismiss season summary
  const dismissSeasonSummary = useCallback(() => {
    setState(prev => ({ ...prev, seasonSummary: null }));
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
      players: allInitialPlayers.map(p => ({ ...p })),
      currentWeek: 1,
      currentSeason: 1,
      completedTournaments: [],
      tournamentHistory: [],
      currentDraw: null,
      davisCupSeason: null,
      weeklyUsedPlayerIds: [],
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
      if (!parsed.players || parsed.players.length < 200) {
        parsed.players = allInitialPlayers.map(p => ({ ...p }));
      }
      if (parsed.players) {
        parsed.players = parsed.players.map((p: Player) => ({ ...p, age: p.age || 25, previousRanking: p.previousRanking || p.officialRanking, weeklyDefensePoints: p.weeklyDefensePoints || 0 }));
      }
      if (parsed.davisCupSeason === undefined) parsed.davisCupSeason = null;
      if (!parsed.weeklyUsedPlayerIds) parsed.weeklyUsedPlayerIds = [];
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
    updateDavisCupSeason,
    addWeeklyExcludedPlayers,
    injurePlayer,
    healPlayer,
    dismissSeasonSummary,
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
