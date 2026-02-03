import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Player, Tournament } from "@/data/players";
import { playMatch, MatchResult } from "@/lib/matchEngine";
import { selectTournamentEntrants, getFieldDescription } from "@/lib/tournamentEntryLogic";
import { StoredMatch, TournamentDraw } from "@/hooks/useGameState";
import TournamentBracket from "./TournamentBracket";
import InteractiveMatchSimulator from "./InteractiveMatchSimulator";
import ATPFinalsView, { ATPFinalsState } from "./ATPFinalsView";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, CheckCircle, Users, Shuffle } from "lucide-react";

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
    runnerUpId: number
  ) => void;
  isCompleted?: boolean;
  savedDraw?: TournamentDraw | null;
  onSaveDraw?: (draw: TournamentDraw) => void;
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
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [draw, setDraw] = useState<Match[][]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [resultsSubmitted, setResultsSubmitted] = useState(isCompleted);
  const [entrants, setEntrants] = useState<Player[]>([]);
  const [isDrawGenerated, setIsDrawGenerated] = useState(false);
  
  // ATP Finals specific state
  const [atpFinalsState, setAtpFinalsState] = useState<ATPFinalsState | null>(null);
  const [atpFinalsSelectedMatch, setAtpFinalsSelectedMatch] = useState<{ match: any; context: any } | null>(null);
  
  const isATPFinals = tournament.category === "ATP Finals";

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
    return {
      id: stored.id,
      player1: p1,
      player2: p2,
      result: stored.result,
      round: stored.round,
    };
  }, [getPlayerById]);

  // Convert Match to stored format
  const matchToStored = (match: Match): StoredMatch => ({
    id: match.id,
    player1Id: match.player1.id,
    player2Id: match.player2.id,
    result: match.result,
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
    // Use tournament entry logic to select participants
    const tournamentEntrants = selectTournamentEntrants(
      players,
      tournament.category,
      tournament.playerLimit
    );
    setEntrants(tournamentEntrants);

    // For ATP Finals, use the special round-robin format
    if (isATPFinals) {
      setIsDrawGenerated(true);
      // ATP Finals state will be initialized by the ATPFinalsView component
      persistDraw([], 0, tournamentEntrants);
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
    
    // Place seeds strategically
    const positions: (Player | null)[] = new Array(tournament.playerLimit).fill(null);
    
    // Seed 1 at position 0, Seed 2 at last position
    if (seeds[0]) positions[0] = seeds[0];
    if (seeds[1]) positions[tournament.playerLimit - 1] = seeds[1];
    
    // Place other seeds evenly
    const seedPositions = [0, tournament.playerLimit - 1];
    for (let i = 2; i < seeds.length; i++) {
      // Find position that maximizes distance from existing seeds
      let bestPos = 0;
      let maxMinDist = -1;
      
      for (let pos = 0; pos < tournament.playerLimit; pos++) {
        if (positions[pos]) continue;
        
        const minDist = Math.min(...seedPositions.map(sp => Math.abs(pos - sp)));
        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestPos = pos;
        }
      }
      
      positions[bestPos] = seeds[i];
      seedPositions.push(bestPos);
    }
    
    // Fill remaining positions with unseeded players
    let unseededIndex = 0;
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i] && unseededIndex < unseeded.length) {
        positions[i] = unseeded[unseededIndex++];
      }
    }

    // Create matches from positions
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

    const results: { matchId: string; result: MatchResult }[] = [];
    
    currentMatches.forEach(match => {
      if (!match.result) {
        const bestOf = tournament.category === "Grand Slam" ? 5 : 3;
        const result = playMatch(match.player1, match.player2, bestOf as 3 | 5);
        results.push({ matchId: match.id, result });
      }
    });

    results.forEach(({ matchId, result }) => {
      handleMatchComplete(matchId, result);
    });
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

  const handleSubmitResults = () => {
    if (!isTournamentComplete || !winner || !runnerUp || resultsSubmitted) return;
    
    const results = calculateTournamentResults();
    onTournamentComplete?.(tournament.id, results, winner.id, runnerUp.id);
    setResultsSubmitted(true);
  };

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
        <div className="glass-card p-12 text-center">
          <Shuffle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {isATPFinals ? "Generate ATP Finals Groups" : "Generate Tournament Draw"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isATPFinals ? (
              <>
                Top 8 players by live ranking will qualify.
                <br />
                Groups are balanced: each pair (1-2, 3-4, 5-6, 7-8) is split randomly between groups.
              </>
            ) : (
              <>
                {tournament.playerLimit} players will be selected based on rankings and tournament category.
                <br />
                Top {tournament.seeds} players will be seeded.
              </>
            )}
          </p>
          <Button onClick={generateDraw} size="lg" className="gap-2">
            <Shuffle className="w-5 h-5" />
            {isATPFinals ? "Generate Groups" : "Generate Draw"}
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
        onMatchClick={(match) => !match.result && setSelectedMatch(match)}
        onRoundChange={setCurrentRound}
      />
    </div>
  );
};

export default CurrentWeekView;
