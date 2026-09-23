import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Player, Tournament } from "@/data/players";
import { playMatch, MatchResult } from "@/lib/matchEngine";
import { selectTournamentEntrants, getFieldDescription } from "@/lib/tournamentEntryLogic";
import { StoredMatch, TournamentDraw } from "@/hooks/useGameState";
import TournamentBracket from "./TournamentBracket";
import InteractiveMatchSimulator from "./InteractiveMatchSimulator";
import ATPFinalsView, { ATPFinalsState } from "./ATPFinalsView";
import DavisCupView, { DavisCupState, updateDavisCupMatchResult } from "./DavisCupView";
import LaverCupView, { LaverCupState } from "./LaverCupView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Trophy, CheckCircle, Users, Shuffle, Search, X } from "lucide-react";

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  result?: MatchResult;
  round: string;
}

interface PlayerResult {
  playerId: number;
  points: number;
  round: string;
}

interface CurrentWeekViewProps {
  tournament: Tournament;
  players: Player[];
  onTournamentComplete?: (
    tournamentId: string,
    results: PlayerResult[],
    winnerId: number,
    runnerUpId: number,
    overrideWinnerName?: string,
    overrideRunnerUpName?: string
  ) => void;
  isCompleted?: boolean;
  savedDraw?: TournamentDraw | null;
  onSaveDraw?: (draw: TournamentDraw) => void;
  excludedPlayerIds?: Set<number>;
  sameWeekSameCategoryCount?: number;
  initialForcedEntrants?: Player[];
  concurrentHigherTierTournaments?: Tournament[];
  concurrentSameTierTournaments?: Tournament[];
  getH2HRecord?: (opponentId: number) => { wins: number; losses: number };
  getH2HPair?: (id1: number, id2: number) => { p1Wins: number; p2Wins: number };
  onPlayersLocked?: (playerIds: number[]) => void;
}

// Helper function - defined outside component to avoid hoisting issues
const getRoundName = (totalPlayers: number, roundNumber: number): string => {
  const remaining = totalPlayers / Math.pow(2, roundNumber);
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semifinal";
  if (remaining === 4) return "Quarterfinal";
  if (remaining === 8) return "R16";
  if (remaining === 16) return "R32";
  if (remaining === 32) return "R64";
  if (remaining === 64) return "R128";
  return `Round ${roundNumber}`;
};

const CurrentWeekView: React.FC<CurrentWeekViewProps> = ({
  tournament,
  players,
  onTournamentComplete,
  isCompleted = false,
  savedDraw,
  onSaveDraw,
  excludedPlayerIds = new Set(),
  sameWeekSameCategoryCount = 1,
  initialForcedEntrants = [],
  concurrentHigherTierTournaments = [],
  concurrentSameTierTournaments = [],
  getH2HRecord,
  getH2HPair,
  onPlayersLocked,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [wildCardIds, setWildCardIds] = useState<Set<number>>(new Set());
  const [draw, setDraw] = useState<Match[][]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [resultsSubmitted, setResultsSubmitted] = useState(isCompleted);
  const [entrants, setEntrants] = useState<Player[]>([]);
  const [isDrawGenerated, setIsDrawGenerated] = useState(false);
  
  // ATP Finals specific state
  const [atpFinalsState, setAtpFinalsState] = useState<ATPFinalsState | null>(null);
  const [atpFinalsSelectedMatch, setAtpFinalsSelectedMatch] = useState<{ match: any; context: any } | null>(null);
  const [forcedEntrants, setForcedEntrants] = useState<Player[]>(initialForcedEntrants);
  const [searchQuery, setSearchQuery] = useState("");
  const [davisCupState, setDavisCupState] = useState<DavisCupState | null>(null);
  const [davisCupSelectedMatch, setDavisCupSelectedMatch] = useState<{
    matchPlayer1: Player;
    matchPlayer2: Player;
    matchId: string;
    seriesId: string;
  } | null>(null);
  // Laver Cup specific state
  const [laverCupState, setLaverCupState] = useState<LaverCupState | null>(null);
  const [laverCupSelectedMatch, setLaverCupSelectedMatch] = useState<{
    player1: Player;
    player2: Player;
    matchId: string;
  } | null>(null);
  
  const isATPFinals = tournament.category === "ATP Finals";
  const isDavisCup = tournament.category === "Davis Cup";
  const isLaverCup = tournament.category === "Laver Cup";

  // Seed IDs for bracket display (first N entrants by ranking are seeds)
  const seedIds = useMemo(() => {
    return entrants.slice(0, tournament.seeds).map(p => p.id);
  }, [entrants, tournament.seeds]);

  // Helper to get player by ID
  const getPlayerById = useCallback((id: number): Player | undefined => {
    return players.find(p => p.id === id);
  }, [players]);

  // Convert stored matches to Match objects
  const storedToMatch = useCallback((stored: StoredMatch): Match | null => {
    const p1 = getPlayerById(stored.player1Id);
    const p2 = getPlayerById(stored.player2Id);
    if (!p1 || !p2) return null;
    // Restore full player objects into result (stored result only keeps id)
    const result = stored.result ? {
      ...stored.result,
      winner: getPlayerById(stored.result.winner.id) ?? stored.result.winner,
      loser:  getPlayerById(stored.result.loser.id)  ?? stored.result.loser,
    } : undefined;
    return {
      id: stored.id,
      player1: p1,
      player2: p2,
      result,
      round: stored.round,
    };
  }, [getPlayerById]);

  // Convert Match to stored format — strip games[] and slim winner/loser to id-only
  // to keep localStorage payload small (quota is ~5MB and 128-player GS draws are huge)
  const matchToStored = (match: Match): StoredMatch => ({
    id: match.id,
    player1Id: match.player1.id,
    player2Id: match.player2.id,
    result: match.result ? {
      winner: { id: match.result.winner.id } as Player,
      loser:  { id: match.result.loser.id  } as Player,
      sets: match.result.sets,
      player1Sets: match.result.player1Sets,
      player2Sets: match.result.player2Sets,
      games: [],  // game-by-game data not needed for bracket state
    } : undefined,
    round: match.round,
  });

  // Load saved draw if exists
  useEffect(() => {
    if (savedDraw && savedDraw.tournamentId === tournament.id && savedDraw.isGenerated) {
      // Restore draw from saved state
      const restoredDraw: Match[][] = [];
      const entrantPlayers = savedDraw.entrantIds
        .map(id => getPlayerById(id))
        .filter((p): p is Player => p !== undefined);
      
      setEntrants(entrantPlayers);
      
      for (const round of savedDraw.rounds) {
        const roundMatches: Match[] = [];
        for (const stored of round) {
          const match = storedToMatch(stored);
          if (match) roundMatches.push(match);
        }
        if (roundMatches.length > 0) restoredDraw.push(roundMatches);
      }
      
      setDraw(restoredDraw);
      setCurrentRound(savedDraw.currentRound);
      setIsDrawGenerated(true);
    } else {
      // Reset for new tournament
      setDraw([]);
      setCurrentRound(0);
      setIsDrawGenerated(false);
      setEntrants([]);
    }
  }, [tournament.id, savedDraw, storedToMatch, getPlayerById]);

  // Persist draw changes
  const persistDraw = useCallback((newDraw: Match[][], newCurrentRound: number, newEntrants: Player[]) => {
    if (onSaveDraw && newDraw.length > 0) {
      const storedDraw: TournamentDraw = {
        tournamentId: tournament.id,
        rounds: newDraw.map(round => round.map(matchToStored)),
        currentRound: newCurrentRound,
        isGenerated: true,
        entrantIds: newEntrants.map(p => p.id),
      };
      onSaveDraw(storedDraw);
    }
  }, [tournament.id, onSaveDraw]);

  // Generate draw
  const generateDraw = () => {
    // For Davis Cup or Laver Cup, skip entrant selection
    if (isDavisCup || isLaverCup) {
      setIsDrawGenerated(true);
      return;
    }

    // Pre-simulate higher-tier concurrent tournament draws to exclude their committed players
    const higherTierExcludedIds = new Set<number>(excludedPlayerIds);
    for (const higherTournament of concurrentHigherTierTournaments) {
      const pool = players.filter(p => !higherTierExcludedIds.has(p.id));
      const { entrants: higherEntrants } = selectTournamentEntrants(
        pool,
        higherTournament.category,
        higherTournament.playerLimit,
        higherTournament.country
      );
      for (const p of higherEntrants) {
        higherTierExcludedIds.add(p.id);
      }
    }

    // Filter out players committed to higher-tier concurrent tournaments
    let availablePlayers = players.filter(p => !higherTierExcludedIds.has(p.id));

    // Interleave-split same-tier concurrent tournaments so each gets equal proportions of
    // top players. Sort all concurrent same-tier tournaments + this one by ID to get a
    // stable index, then assign every Nth player (by ranking) to this tournament.
    if (concurrentSameTierTournaments.length > 0) {
      const allSameTier = [tournament, ...concurrentSameTierTournaments]
        .sort((a, b) => a.id.localeCompare(b.id));
      const totalCount = allSameTier.length;
      const myIndex = allSameTier.findIndex(t => t.id === tournament.id);
      availablePlayers = availablePlayers
        .sort((a, b) => a.officialRanking - b.officialRanking)
        .filter((_, idx) => idx % totalCount === myIndex);
    }

    // Include forced entrants in the draw
    const availableForAutoSelect = availablePlayers.filter(p => !forcedEntrants.some(f => f.id === p.id));
    const { entrants: autoEntrants, wildCardIds: autoWCs } = selectTournamentEntrants(
      availableForAutoSelect,
      tournament.category,
      Math.max(0, tournament.playerLimit - forcedEntrants.length),
      tournament.country
    );
    let tournamentEntrants = [...forcedEntrants, ...autoEntrants]
      .slice(0, tournament.playerLimit)
      .sort((a, b) => a.officialRanking - b.officialRanking);

    // Pre-fill to full draw size so bracket positions and seed badges always match.
    // Use availableForAutoSelect (this tournament's allocated pool) — NOT all players —
    // so that concurrent same-category tournaments don't share top players.
    if (tournamentEntrants.length < tournament.playerLimit) {
      const usedIds = new Set(tournamentEntrants.map(p => p.id));
      const extra = availableForAutoSelect
        .filter(p => !usedIds.has(p.id) && !p.injured)
        .sort((a, b) => a.officialRanking - b.officialRanking)
        .slice(0, tournament.playerLimit - tournamentEntrants.length);
      tournamentEntrants = [...tournamentEntrants, ...extra]
        .sort((a, b) => a.officialRanking - b.officialRanking);
    }

    setWildCardIds(autoWCs);
    setEntrants(tournamentEntrants);

    // For ATP Finals, select top 8 by live race (livePoints), not official ranking
    if (isATPFinals) {
      const atpEntrants = players
        .filter(p => !p.injured)
        .sort((a, b) => b.livePoints - a.livePoints)
        .slice(0, 8);
      // If fewer than 8 non-injured players available, fill with injured players as last resort
      if (atpEntrants.length < 8) {
        const extras = players
          .filter(p => p.injured && !atpEntrants.some(e => e.id === p.id))
          .sort((a, b) => b.livePoints - a.livePoints)
          .slice(0, 8 - atpEntrants.length);
        atpEntrants.push(...extras);
      }
      setEntrants(atpEntrants);
      setIsDrawGenerated(true);
      // Don't persistDraw for ATP Finals (no bracket to save)
      return;
    }

    // Seed players
    const seeds = tournamentEntrants.slice(0, tournament.seeds);
    const unseeded = tournamentEntrants.slice(tournament.seeds);
    
    // Shuffle unseeded players
    for (let i = unseeded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
    }

    // Create first round matches
    const firstRoundMatches: Match[] = [];
    const totalMatches = tournament.playerLimit / 2;
    
    // Place seeds using proper tennis bracket seeding with randomization
    const positions: (Player | null)[] = new Array(tournament.playerLimit).fill(null);
    const drawSize = tournament.playerLimit;
    
    // Seed 1 at top, Seed 2 at bottom (always fixed)
    if (seeds[0]) positions[0] = seeds[0];
    if (seeds[1]) positions[drawSize - 1] = seeds[1];
    
    // Place remaining seed tiers with randomization within each tier
    const usedPositions = new Set<number>([0, drawSize - 1]);
    let seedsPlaced = 2;
    let numSections = 2;
    
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    
    while (seedsPlaced < seeds.length) {
      numSections *= 2;
      const sectionSize = drawSize / numSections;
      if (sectionSize < 1) break;
      
      const newPositions: number[] = [];
      
      for (let s = 0; s < numSections; s++) {
        const sectionStart = Math.floor(s * sectionSize);
        const sectionEnd = Math.floor((s + 1) * sectionSize) - 1;
        
        // Check if this section already has a seed
        let hasExistingSeed = false;
        for (const pos of usedPositions) {
          if (pos >= sectionStart && pos <= sectionEnd) {
            hasExistingSeed = true;
            break;
          }
        }
        
        if (!hasExistingSeed) {
          // Find the paired section's seed position to determine placement
          const pairedSectionIdx = s % 2 === 0 ? s + 1 : s - 1;
          const pairedStart = Math.floor(pairedSectionIdx * sectionSize);
          const pairedEnd = Math.floor((pairedSectionIdx + 1) * sectionSize) - 1;
          
          let pairedSeedPos = -1;
          for (const pos of usedPositions) {
            if (pos >= pairedStart && pos <= pairedEnd) {
              pairedSeedPos = pos;
              break;
            }
          }
          
          // Place at the opposite end from the paired seed
          if (pairedSeedPos >= 0 && pairedSeedPos <= (pairedStart + pairedEnd) / 2) {
            newPositions.push(sectionEnd);
          } else {
            newPositions.push(sectionStart);
          }
        }
      }
      
      // Get seeds for this tier and shuffle them randomly
      const tierSeeds = seeds.slice(seedsPlaced, seedsPlaced + newPositions.length);
      const shuffledTierSeeds = shuffleArray(tierSeeds);
      
      // Assign shuffled seeds to positions
      for (let i = 0; i < shuffledTierSeeds.length; i++) {
        positions[newPositions[i]] = shuffledTierSeeds[i];
        usedPositions.add(newPositions[i]);
      }
      
      seedsPlaced += newPositions.length;
    }
    
    // Fill remaining positions with unseeded players
    let unseededIndex = 0;
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i] && unseededIndex < unseeded.length) {
        positions[i] = unseeded[unseededIndex++];
      }
    }

    // If there are still empty positions, fill with extra players from the broader pool
    const usedIds = new Set(positions.filter(Boolean).map(p => p!.id));
    const extraPool = players
      .filter(p => !usedIds.has(p.id) && !p.injured)
      .sort((a, b) => a.officialRanking - b.officialRanking);
    let extraIdx = 0;
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i] && extraIdx < extraPool.length) {
        positions[i] = extraPool[extraIdx++];
      }
    }

    // Create matches from positions - ensure ALL matches are created
    for (let i = 0; i < totalMatches; i++) {
      const p1 = positions[i * 2];
      const p2 = positions[i * 2 + 1];
      if (p1 && p2) {
        firstRoundMatches.push({
          id: `R1-${i}`,
          player1: p1,
          player2: p2,
          round: getRoundName(tournament.playerLimit, 1),
        });
      }
    }

    const newDraw = [firstRoundMatches];
    setDraw(newDraw);
    setIsDrawGenerated(true);
    setCurrentRound(0);

    // Persist immediately
    persistDraw(newDraw, 0, tournamentEntrants);
  };

  // Handle ATP Finals match completion
  const handleATPFinalsMatchComplete = (matchId: string, result: MatchResult) => {
    if (!atpFinalsState || !atpFinalsSelectedMatch) return;
    
    const { context } = atpFinalsSelectedMatch;
    
    setAtpFinalsState(prev => {
      if (!prev) return prev;
      
      if (context.phase === "groups" && context.group === "A") {
        return {
          ...prev,
          groupAMatches: prev.groupAMatches.map(m => 
            m.id === matchId ? { ...m, result } : m
          ),
        };
      } else if (context.phase === "groups" && context.group === "B") {
        return {
          ...prev,
          groupBMatches: prev.groupBMatches.map(m => 
            m.id === matchId ? { ...m, result } : m
          ),
        };
      } else if (context.phase === "semifinals") {
        return {
          ...prev,
          semifinals: {
            match1: prev.semifinals.match1?.id === matchId 
              ? { ...prev.semifinals.match1, result } 
              : prev.semifinals.match1,
            match2: prev.semifinals.match2?.id === matchId 
              ? { ...prev.semifinals.match2, result } 
              : prev.semifinals.match2,
          },
        };
      } else if (context.phase === "final" && prev.final) {
        return {
          ...prev,
          final: { ...prev.final, result },
        };
      }
      
      return prev;
    });
    
    setAtpFinalsSelectedMatch(null);
  };

  // Handle Davis Cup match completion
  const handleDavisCupMatchComplete = useCallback((result: MatchResult) => {
    if (!davisCupSelectedMatch || !davisCupState) return;
    const { matchId, seriesId, matchPlayer1 } = davisCupSelectedMatch;
    const country1Won = result.winner.id === matchPlayer1.id;
    
    setDavisCupState(prev => {
      if (!prev) return prev;
      return updateDavisCupMatchResult(prev, seriesId, matchId, country1Won, result);
    });
    setDavisCupSelectedMatch(null);
  }, [davisCupSelectedMatch, davisCupState]);

  const handleMatchComplete = (matchId: string, result: MatchResult) => {
    setDraw(prev => {
      const newDraw = [...prev];
      const roundIndex = newDraw.findIndex(round => 
        round.some(m => m.id === matchId)
      );
      
      if (roundIndex !== -1) {
        newDraw[roundIndex] = newDraw[roundIndex].map(m => 
          m.id === matchId ? { ...m, result } : m
        );
        
        // Check if round is complete
        const currentRoundMatches = newDraw[roundIndex];
        const allCompleted = currentRoundMatches.every(m => m.result);
        
        if (allCompleted && currentRoundMatches.length > 1) {
          // Create next round
          const nextRoundMatches: Match[] = [];
          for (let i = 0; i < currentRoundMatches.length; i += 2) {
            const winner1 = currentRoundMatches[i].result!.winner;
            const winner2 = currentRoundMatches[i + 1]?.result?.winner;
            
            if (winner2) {
              nextRoundMatches.push({
                id: `R${roundIndex + 2}-${i / 2}`,
                player1: winner1,
                player2: winner2,
                round: getRoundName(tournament.playerLimit, roundIndex + 2),
              });
            }
          }
          
          if (nextRoundMatches.length > 0) {
            newDraw.push(nextRoundMatches);
            setCurrentRound(roundIndex + 1);
            // Persist with new round
            setTimeout(() => persistDraw(newDraw, roundIndex + 1, entrants), 0);
          }
        } else {
          // Just persist current changes
          setTimeout(() => persistDraw(newDraw, currentRound, entrants), 0);
        }
      }
      
      return newDraw;
    });
    
    setSelectedMatch(null);
  };

  const simulateRound = () => {
    const currentMatches = draw[currentRound];
    if (!currentMatches) return;

    // Build the complete new round in one pass (no side effects inside setDraw)
    const newRound = currentMatches.map(match => {
      if (match.result) return match;
      const bestOf = tournament.category === "Grand Slam" ? 5 : 3;
      const result = playMatch(match.player1, match.player2, bestOf as 3 | 5, tournament.surface);
      return { ...match, result };
    });

    // Build next round if all matches now have results
    let newDraw = draw.map((r, i) => i === currentRound ? newRound : r);
    let nextRoundIdx = currentRound;

    if (newRound.every(m => m.result) && newRound.length > 1) {
      const nextRoundMatches: typeof newRound = [];
      for (let i = 0; i < newRound.length; i += 2) {
        const winner1 = newRound[i].result!.winner;
        const winner2 = newRound[i + 1]?.result?.winner;
        if (winner2) {
          nextRoundMatches.push({
            id: `R${currentRound + 2}-${i / 2}`,
            player1: winner1,
            player2: winner2,
            round: getRoundName(tournament.playerLimit, currentRound + 2),
          });
        }
      }
      if (nextRoundMatches.length > 0) {
        newDraw = [...newDraw, nextRoundMatches];
        nextRoundIdx = currentRound + 1;
      }
    }

    // Single atomic state update — no setState calls inside updater
    setDraw(newDraw);
    setSelectedMatch(null);
    if (nextRoundIdx !== currentRound) {
      setCurrentRound(nextRoundIdx);
    }
    persistDraw(newDraw, nextRoundIdx, entrants);
  };

  const currentRoundMatches = draw[currentRound] || [];
  const isTournamentComplete = draw.length > 0 && 
    draw[draw.length - 1].length === 1 && 
    draw[draw.length - 1][0].result;

  const winner = isTournamentComplete ? draw[draw.length - 1][0].result?.winner : null;
  const runnerUp = isTournamentComplete ? draw[draw.length - 1][0].result?.loser : null;

  // Calculate points for all participants when tournament is complete
  const calculateTournamentResults = (): PlayerResult[] => {
    if (!isTournamentComplete) return [];
    
    const results: Map<number, PlayerResult> = new Map();
    
    // Go through all rounds and assign points
    draw.forEach((round, roundIndex) => {
      round.forEach(match => {
        if (match.result) {
          const loser = match.result.loser;
          const roundName = match.round;
          
          // Assign points based on round reached
          let points = 0;
          switch (roundName) {
            case "Final":
              points = tournament.points.finalist;
              break;
            case "Semifinal":
              points = tournament.points.sf;
              break;
            case "Quarterfinal":
              points = tournament.points.qf;
              break;
            case "R16":
              points = tournament.points.r16;
              break;
            case "R32":
              points = tournament.points.r32;
              break;
            case "R64":
              points = tournament.points.r64;
              break;
            case "R128":
              points = tournament.points.r128;
              break;
            default:
              points = 10;
          }
          
          // Don't overwrite if already has higher points (from later round)
          if (!results.has(loser.id) || results.get(loser.id)!.points < points) {
            results.set(loser.id, {
              playerId: loser.id,
              points,
              round: roundName,
            });
          }
        }
      });
    });
    
    // Add winner points
    if (winner) {
      results.set(winner.id, {
        playerId: winner.id,
        points: tournament.points.winner,
        round: "Winner",
      });
    }
    
    return Array.from(results.values());
  };

  const handleSubmitResults = useCallback(() => {
    if (!isTournamentComplete || !winner || !runnerUp) return;
    if (resultsSubmitted) return;
    
    const results = calculateTournamentResults();
    if (results.length === 0) return;
    
    // Mark as submitted immediately to prevent double-submission
    setResultsSubmitted(true);
    
    // Then notify parent
    onTournamentComplete?.(tournament.id, results, winner.id, runnerUp.id);
  }, [isTournamentComplete, winner, runnerUp, resultsSubmitted, calculateTournamentResults, onTournamentComplete, tournament.id]);

  // Handle ATP Finals completion
  const handleATPFinalsComplete = (
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number
  ) => {
    onTournamentComplete?.(tournament.id, results, winnerId, runnerUpId);
    setResultsSubmitted(true);
  };

  // If draw not generated, show generate button
  if (!isDrawGenerated) {
    return (
      <div className="space-y-4">
        {/* Tournament Header */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {tournament.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tournament.city}, {tournament.country}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getFieldDescription(tournament.category)}
              </p>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className={`tournament-badge ${
                tournament.category === "Grand Slam" ? "tournament-badge-gs" :
                tournament.category === "Masters 1000" ? "tournament-badge-m1000" :
                tournament.category === "ATP Finals" ? "tournament-badge-gs" :
                "tournament-badge-500"
              }`}>
                {tournament.category}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Draw Button */}
        <div className="glass-card p-8 text-center">
          <Shuffle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {isATPFinals ? "Generate ATP Finals Groups" : isDavisCup ? "Generate Davis Cup Draw" : isLaverCup ? "Generate Laver Cup" : "Generate Tournament Draw"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isATPFinals ? (
              <>
                Top 8 players by live ranking will qualify.
                <br />
                Groups are balanced: each pair (1-2, 3-4, 5-6, 7-8) is split randomly between groups.
              </>
            ) : isDavisCup ? (
              <>
                Top 16 countries (with 2+ ranked players) will qualify.
                <br />
                4 groups of 4 countries, round-robin with 5-match series per matchup.
              </>
            ) : isLaverCup ? (
              <>
                Team Europe vs Team World. Top 6 players per team.
                <br />
                3 days: Day 1 (1pt), Day 2 (2pts), Day 3 (3pts). First to 13 wins.
              </>
            ) : (
              <>
                {tournament.playerLimit} players will be selected based on rankings and tournament category.
                <br />
                Top {tournament.seeds} players will be seeded.
              </>
            )}
          </p>

          {/* Manual Player Entry (not for ATP Finals, Davis Cup, or Laver Cup) */}
          {!isATPFinals && !isDavisCup && !isLaverCup && (
            <div className="mt-4 mb-6 max-w-md mx-auto text-left space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Add a specific player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="space-y-1">
                  {players
                    .filter(p =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      !forcedEntrants.some(e => e.id === p.id) &&
                      !p.injured
                    )
                    .slice(0, 5)
                    .map(player => (
                      <button
                        key={player.id}
                        className="w-full text-left p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 flex items-center justify-between transition-colors"
                        onClick={() => {
                          setForcedEntrants(prev => [...prev, player]);
                          setSearchQuery("");
                        }}
                      >
                        <span className="text-sm">{player.name} ({player.countryCode})</span>
                        <span className="text-xs text-muted-foreground">#{player.officialRanking}</span>
                      </button>
                    ))}
                  {players.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !forcedEntrants.some(e => e.id === p.id) &&
                    !p.injured
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">No players found</p>
                  )}
                </div>
              )}
              {forcedEntrants.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Manually added ({forcedEntrants.length}):</p>
                  {forcedEntrants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium">{p.name} <span className="text-xs text-muted-foreground">#{p.officialRanking}</span></span>
                      <button onClick={() => setForcedEntrants(prev => prev.filter(e => e.id !== p.id))}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={generateDraw} size="lg" className="gap-2">
            <Shuffle className="w-5 h-5" />
            {isATPFinals ? "Generate Groups" : isDavisCup ? "Generate Draw" : isLaverCup ? "Generate Laver Cup" : "Generate Draw"}
          </Button>
        </div>
      </div>
    );
  }

  // ATP Finals special view
  if (isATPFinals) {
    return (
      <div className="space-y-4">
        {/* ATP Finals Match Simulator Modal */}
        {atpFinalsSelectedMatch && !atpFinalsSelectedMatch.match.result && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <InteractiveMatchSimulator
                player1={atpFinalsSelectedMatch.match.player1}
                player2={atpFinalsSelectedMatch.match.player2}
                bestOf={3}
                onMatchComplete={(result) => handleATPFinalsMatchComplete(atpFinalsSelectedMatch.match.id, result)}
                surface={tournament.surface}
              />
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => setAtpFinalsSelectedMatch(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <ATPFinalsView
          tournament={tournament}
          entrants={entrants}
          state={atpFinalsState}
          onStateChange={setAtpFinalsState}
          onMatchClick={(match, context) => setAtpFinalsSelectedMatch({ match, context })}
          onComplete={handleATPFinalsComplete}
        />
      </div>
    );
  }

  // Davis Cup special view
  if (isDavisCup) {
    return (
      <div className="space-y-4">
        {davisCupSelectedMatch && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <InteractiveMatchSimulator
                player1={davisCupSelectedMatch.matchPlayer1}
                player2={davisCupSelectedMatch.matchPlayer2}
                bestOf={3}
                onMatchComplete={handleDavisCupMatchComplete}
                surface={tournament.surface}
              />
              <Button 
                variant="ghost" 
                className="w-full mt-2"
                onClick={() => setDavisCupSelectedMatch(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <DavisCupView
          players={players}
          state={davisCupState}
          onStateChange={setDavisCupState}
          onMatchClick={(p1, p2, matchId, seriesId) => 
            setDavisCupSelectedMatch({ matchPlayer1: p1, matchPlayer2: p2, matchId, seriesId })
          }
          onComplete={() => {
            setResultsSubmitted(true);
            if (davisCupState?.final?.winner) {
              const winnerCountry = davisCupState.countries.find(c => c.countryCode === davisCupState.final!.winner);
              const runnerUpCode = davisCupState.final.winner === davisCupState.final.country1Code
                ? davisCupState.final.country2Code
                : davisCupState.final.country1Code;
              const runnerUpCountry = davisCupState.countries.find(c => c.countryCode === runnerUpCode);
              onTournamentComplete?.(
                tournament.id,
                [],
                winnerCountry?.player1Id || 0,
                runnerUpCountry?.player1Id || 0,
                winnerCountry?.country || "Unknown",
                runnerUpCountry?.country || "Unknown"
              );
            }
          }}
        />
      </div>
    );
  }

  // Laver Cup special view
  if (isLaverCup) {
    const handleLaverCupMatchComplete = (result: MatchResult) => {
      if (!laverCupSelectedMatch || !laverCupState) return;
      const match = laverCupState.matches.find(m => m.id === laverCupSelectedMatch.matchId);
      if (!match) return;
      let europeWon: boolean;
      if (match.isDoubles) {
        const compositeId = -(match.europePlayer1Id * 1000 + match.europePlayer2Id!);
        europeWon = result.winner.id === compositeId;
      } else {
        europeWon = result.winner.id === match.europePlayer1Id;
      }
      const updatedMatches = laverCupState.matches.map(m =>
        m.id === match.id ? { ...m, result, europeWon } : m
      );
      const allDone = updatedMatches.every(m => m.result);
      const newEuropeScore = updatedMatches.filter(m => m.europeWon === true).reduce((s, m) => s + m.pointValue, 0);
      const newWorldScore = updatedMatches.filter(m => m.europeWon === false).reduce((s, m) => s + m.pointValue, 0);
      const updatedState = {
        ...laverCupState,
        matches: updatedMatches,
        europeScore: newEuropeScore,
        worldScore: newWorldScore,
        phase: allDone ? "complete" as const : "playing" as const,
      };
      setLaverCupState(updatedState);
      setLaverCupSelectedMatch(null);
      // Auto-complete when all matches have been played
      if (allDone && !resultsSubmitted) {
        setResultsSubmitted(true);
        const winnerName = newEuropeScore > newWorldScore ? "Team Europe" : "Team World";
        const runnerUpName = newEuropeScore > newWorldScore ? "Team World" : "Team Europe";
        const winnerId = newEuropeScore > newWorldScore ? laverCupState.europePlayerIds[0] : laverCupState.worldPlayerIds[0];
        const runnerUpId = newEuropeScore > newWorldScore ? laverCupState.worldPlayerIds[0] : laverCupState.europePlayerIds[0];
        onTournamentComplete?.(tournament.id, [], winnerId, runnerUpId, winnerName, runnerUpName);
      }
    };

    return (
      <div className="space-y-4">
        {laverCupSelectedMatch && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
              <InteractiveMatchSimulator
                player1={laverCupSelectedMatch.player1}
                player2={laverCupSelectedMatch.player2}
                bestOf={3}
                onMatchComplete={handleLaverCupMatchComplete}
                surface={tournament.surface}
              />
              <Button variant="ghost" className="w-full mt-2" onClick={() => setLaverCupSelectedMatch(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        <LaverCupView
          players={players}
          state={laverCupState}
          onStateChange={(newState) => {
            if (!laverCupState && newState && onPlayersLocked) {
              onPlayersLocked([...newState.europePlayerIds, ...newState.worldPlayerIds]);
            }
            setLaverCupState(newState);
          }}
          onMatchClick={(p1, p2, matchId) =>
            setLaverCupSelectedMatch({ player1: p1, player2: p2, matchId })
          }
          onComplete={() => {
            setResultsSubmitted(true);
            if (laverCupState) {
              const europeScore = laverCupState.matches.filter(m => m.europeWon === true).reduce((s, m) => s + m.pointValue, 0);
              const worldScore = laverCupState.matches.filter(m => m.europeWon === false).reduce((s, m) => s + m.pointValue, 0);
              const winnerName = europeScore > worldScore ? "Team Europe" : "Team World";
              const runnerUpName = europeScore > worldScore ? "Team World" : "Team Europe";
              // Use first player of winning team as winnerId for palmarés
              const winnerId = europeScore > worldScore ? laverCupState.europePlayerIds[0] : laverCupState.worldPlayerIds[0];
              const runnerUpId = europeScore > worldScore ? laverCupState.worldPlayerIds[0] : laverCupState.europePlayerIds[0];
              onTournamentComplete?.(tournament.id, [], winnerId, runnerUpId, winnerName, runnerUpName);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tournament Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {tournament.name}
            </h2>
          <p className="text-sm text-muted-foreground">
            {tournament.city}, {tournament.country}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getFieldDescription(tournament.category)}
          </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{entrants.length} players</span>
            </div>
            <div className={`tournament-badge ${
              tournament.category === "Grand Slam" ? "tournament-badge-gs" :
              tournament.category === "Masters 1000" ? "tournament-badge-m1000" :
              "tournament-badge-500"
            }`}>
              {tournament.category}
            </div>
          </div>
        </div>
      </div>

      {/* Winner display */}
      {winner && (
        <div className="glass-card p-6 text-center animate-bounce-in">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
          <h3 className="font-display text-2xl font-bold text-primary glow-text">
            🏆 {winner.name} 🏆
          </h3>
          <p className="text-muted-foreground">
            {tournament.name} Champion
          </p>
          <p className="text-sm text-primary mt-2">
            +{tournament.points.winner} points
          </p>
          
          {!resultsSubmitted ? (
            <Button 
              className="mt-4 gap-2" 
              onClick={handleSubmitResults}
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Results & Award Points
            </Button>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Points awarded - Advance to next week
            </div>
          )}
        </div>
      )}

      {/* Match Simulator Modal */}
      {selectedMatch && !selectedMatch.result && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <InteractiveMatchSimulator
              player1={selectedMatch.player1}
              player2={selectedMatch.player2}
              bestOf={tournament.category === "Grand Slam" ? 5 : 3}
              onMatchComplete={(result) => handleMatchComplete(selectedMatch.id, result)}
              surface={tournament.surface}
              h2hRecord={selectedMatch && (() => {
                const careerPlayerId = -1;
                // Career player match: use per-career H2H
                if (getH2HRecord) {
                  if (selectedMatch.player1.id === careerPlayerId) return getH2HRecord(selectedMatch.player2.id);
                  if (selectedMatch.player2.id === careerPlayerId) return getH2HRecord(selectedMatch.player1.id);
                }
                // CPU vs CPU match: use global H2H pair
                if (getH2HPair) {
                  const pair = getH2HPair(selectedMatch.player1.id, selectedMatch.player2.id);
                  return { wins: pair.p1Wins, losses: pair.p2Wins };
                }
                return undefined;
              })()}
            />
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              onClick={() => setSelectedMatch(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Simulate All button for current round */}
      {!isTournamentComplete && currentRoundMatches.length > 0 && (
        <div className="flex justify-end">
          <Button size="sm" onClick={simulateRound} className="gap-1">
            <Zap className="w-3 h-3" />
            Simulate All {currentRoundMatches[0]?.round}
          </Button>
        </div>
      )}

      {/* Tournament Bracket */}
      <TournamentBracket
        draw={draw}
        currentRound={currentRound}
        seeds={seedIds}
        wildCardIds={wildCardIds}
        onMatchClick={(match) => !match.result && setSelectedMatch(match)}
        onRoundChange={setCurrentRound}
      />
    </div>
  );
};

export default CurrentWeekView;
