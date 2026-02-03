import React, { useState, useEffect } from "react";
import { Player, Tournament } from "@/data/players";
import { MatchResult } from "@/lib/matchEngine";
import { Trophy, Users, Play, ChevronRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface GroupMatch {
  id: string;
  player1: Player;
  player2: Player;
  result?: MatchResult;
}

interface GroupStanding {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

export interface ATPFinalsState {
  groupA: Player[];
  groupB: Player[];
  groupAMatches: GroupMatch[];
  groupBMatches: GroupMatch[];
  semifinals: { match1?: GroupMatch; match2?: GroupMatch };
  final?: GroupMatch;
  phase: "groups" | "semifinals" | "final" | "complete";
  currentGroupMatch: { group: "A" | "B"; matchIndex: number } | null;
}

interface ATPFinalsViewProps {
  tournament: Tournament;
  entrants: Player[];
  state: ATPFinalsState | null;
  onStateChange: (state: ATPFinalsState) => void;
  onMatchClick: (match: GroupMatch, context: { phase: string; group?: string }) => void;
  onComplete: (results: { playerId: number; points: number; round: string }[], winnerId: number, runnerUpId: number) => void;
}

// Generate round-robin matches for a group (3 matches per player)
const generateGroupMatches = (players: Player[], groupName: string): GroupMatch[] => {
  const matches: GroupMatch[] = [];
  // Round robin: each player plays every other player once
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        id: `group-${groupName}-${i}-${j}`,
        player1: players[i],
        player2: players[j],
      });
    }
  }
  return matches;
};

// Calculate standings from match results
const calculateStandings = (players: Player[], matches: GroupMatch[]): GroupStanding[] => {
  const standings: GroupStanding[] = players.map(player => ({
    player,
    played: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    gamesWon: 0,
    gamesLost: 0,
    points: 0,
  }));

  matches.forEach(match => {
    if (!match.result) return;

    const p1Standing = standings.find(s => s.player.id === match.player1.id);
    const p2Standing = standings.find(s => s.player.id === match.player2.id);
    if (!p1Standing || !p2Standing) return;

    p1Standing.played++;
    p2Standing.played++;

    const isP1Winner = match.result.winner.id === match.player1.id;
    
    if (isP1Winner) {
      p1Standing.wins++;
      p1Standing.points += 200; // 200 points per win
      p2Standing.losses++;
    } else {
      p2Standing.wins++;
      p2Standing.points += 200;
      p1Standing.losses++;
    }

    // Count sets and games
    match.result.sets.forEach(set => {
      p1Standing.setsWon += set.player1Games > set.player2Games ? 1 : 0;
      p1Standing.setsLost += set.player1Games < set.player2Games ? 1 : 0;
      p2Standing.setsWon += set.player2Games > set.player1Games ? 1 : 0;
      p2Standing.setsLost += set.player2Games < set.player1Games ? 1 : 0;
      p1Standing.gamesWon += set.player1Games;
      p1Standing.gamesLost += set.player2Games;
      p2Standing.gamesWon += set.player2Games;
      p2Standing.gamesLost += set.player1Games;
    });
  });

  // Sort by: wins, then set difference, then game difference
  return standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aGameDiff = a.gamesWon - a.gamesLost;
    const bGameDiff = b.gamesWon - b.gamesLost;
    return bGameDiff - aGameDiff;
  });
};

const ATPFinalsView: React.FC<ATPFinalsViewProps> = ({
  tournament,
  entrants,
  state,
  onStateChange,
  onMatchClick,
  onComplete,
}) => {
  // Initialize state if needed
  useEffect(() => {
    if (!state && entrants.length === 8) {
      // Sort by live ranking (or official if no live points)
      const sorted = [...entrants].sort((a, b) => {
        const aRank = a.livePoints > 0 ? a.livePoints : a.points;
        const bRank = b.livePoints > 0 ? b.livePoints : b.points;
        return bRank - aRank;
      });

      // Balanced group distribution with randomness:
      // 1st goes to one group, 2nd to the other (random)
      // 3rd goes to one group, 4th to the other (random)
      // 5th goes to one group, 6th to the other (random)
      // 7th goes to one group, 8th to the other (random)
      const groupA: Player[] = [];
      const groupB: Player[] = [];
      
      // For each pair, randomly assign one to A and one to B
      for (let i = 0; i < 8; i += 2) {
        const player1 = sorted[i];
        const player2 = sorted[i + 1];
        
        if (Math.random() < 0.5) {
          groupA.push(player1);
          groupB.push(player2);
        } else {
          groupA.push(player2);
          groupB.push(player1);
        }
      }

      const initialState: ATPFinalsState = {
        groupA,
        groupB,
        groupAMatches: generateGroupMatches(groupA, "A"),
        groupBMatches: generateGroupMatches(groupB, "B"),
        semifinals: {},
        final: undefined,
        phase: "groups",
        currentGroupMatch: null,
      };

      onStateChange(initialState);
    }
  }, [entrants, state, onStateChange]);

  if (!state) {
    return (
      <div className="glass-card p-6 text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading ATP Finals draw...</p>
      </div>
    );
  }

  const groupAStandings = calculateStandings(state.groupA, state.groupAMatches);
  const groupBStandings = calculateStandings(state.groupB, state.groupBMatches);

  const allGroupMatchesComplete = 
    state.groupAMatches.every(m => m.result) && 
    state.groupBMatches.every(m => m.result);

  // Check if we need to advance to semifinals
  const handleAdvanceToSemifinals = () => {
    if (!allGroupMatchesComplete) return;

    // Top 2 from each group
    const a1 = groupAStandings[0].player;
    const a2 = groupAStandings[1].player;
    const b1 = groupBStandings[0].player;
    const b2 = groupBStandings[1].player;

    // Cross semifinals: A1 vs B2, B1 vs A2
    const newState: ATPFinalsState = {
      ...state,
      phase: "semifinals",
      semifinals: {
        match1: { id: "sf-1", player1: a1, player2: b2 },
        match2: { id: "sf-2", player1: b1, player2: a2 },
      },
    };

    onStateChange(newState);
  };

  const handleAdvanceToFinal = () => {
    if (!state.semifinals.match1?.result || !state.semifinals.match2?.result) return;

    const winner1 = state.semifinals.match1.result.winner;
    const winner2 = state.semifinals.match2.result.winner;

    const newState: ATPFinalsState = {
      ...state,
      phase: "final",
      final: { id: "final", player1: winner1, player2: winner2 },
    };

    onStateChange(newState);
  };

  const handleCompleteTournament = () => {
    if (!state.final?.result) return;

    const winner = state.final.result.winner;
    const finalist = state.final.result.loser;

    // Calculate points for all players
    const results: { playerId: number; points: number; round: string }[] = [];

    // Group stage points (200 per win)
    [...groupAStandings, ...groupBStandings].forEach(standing => {
      const groupPoints = standing.wins * 200;
      if (groupPoints > 0) {
        results.push({
          playerId: standing.player.id,
          points: groupPoints,
          round: "Group Stage",
        });
      }
    });

    // Semifinal winners get +400
    if (state.semifinals.match1?.result) {
      results.push({
        playerId: state.semifinals.match1.result.winner.id,
        points: 400,
        round: "Semifinal",
      });
    }
    if (state.semifinals.match2?.result) {
      results.push({
        playerId: state.semifinals.match2.result.winner.id,
        points: 400,
        round: "Semifinal",
      });
    }

    // Final winner gets +500
    results.push({
      playerId: winner.id,
      points: 500,
      round: "Champion",
    });

    // Aggregate points per player
    const aggregated = results.reduce((acc, r) => {
      const existing = acc.find(a => a.playerId === r.playerId);
      if (existing) {
        existing.points += r.points;
      } else {
        acc.push({ ...r });
      }
      return acc;
    }, [] as { playerId: number; points: number; round: string }[]);

    // Update round labels based on final standing
    aggregated.forEach(r => {
      if (r.playerId === winner.id) r.round = "Champion";
      else if (r.playerId === finalist.id) r.round = "Finalist";
      else if (r.points >= 400) r.round = "Semifinalist";
      else r.round = "Group Stage";
    });

    const newState: ATPFinalsState = {
      ...state,
      phase: "complete",
    };
    onStateChange(newState);

    onComplete(aggregated, winner.id, finalist.id);
  };

  const renderMatch = (match: GroupMatch, context: { phase: string; group?: string }) => {
    const canPlay = !match.result;

    return (
      <div
        key={match.id}
        className={`
          glass-card p-3 transition-all
          ${canPlay ? "cursor-pointer hover:border-primary/50" : ""}
          ${match.result ? "opacity-90" : "ring-1 ring-primary/30"}
        `}
        onClick={() => canPlay && onMatchClick(match, context)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <div className={`flex items-center gap-2 ${match.result?.winner.id === match.player1.id ? "text-primary font-semibold" : ""}`}>
              <span className="text-xs text-muted-foreground w-8">{match.player1.countryCode}</span>
              <span className="truncate">{match.player1.name}</span>
            </div>
            <div className={`flex items-center gap-2 ${match.result?.winner.id === match.player2.id ? "text-primary font-semibold" : ""}`}>
              <span className="text-xs text-muted-foreground w-8">{match.player2.countryCode}</span>
              <span className="truncate">{match.player2.name}</span>
            </div>
          </div>
          
          <div className="ml-4 min-w-[60px] text-right">
            {match.result ? (
              <div className="text-xs font-mono space-y-0.5">
                {match.result.sets.map((set, i) => (
                  <div key={i}>
                    {set.player1Games}-{set.player2Games}
                    {set.tiebreak && <sup>({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})</sup>}
                  </div>
                ))}
              </div>
            ) : (
              <Play className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStandings = (standings: GroupStanding[], groupName: string) => (
    <div className="glass-card overflow-hidden">
      <div className="bg-primary/10 px-3 py-2 border-b border-border/50">
        <h4 className="font-display font-semibold text-sm">Group {groupName} Standings</h4>
      </div>
      <div className="divide-y divide-border/30">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
          <span>Player</span>
          <span className="w-8 text-center">W</span>
          <span className="w-8 text-center">L</span>
          <span className="w-12 text-center">Sets</span>
          <span className="w-12 text-center">Pts</span>
        </div>
        {standings.map((standing, idx) => (
          <div 
            key={standing.player.id}
            className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-3 py-2 text-sm ${idx < 2 ? "bg-primary/5" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx < 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {idx + 1}
              </span>
              <span className="text-xs text-muted-foreground">{standing.player.countryCode}</span>
              <span className="truncate">{standing.player.name}</span>
            </div>
            <span className="w-8 text-center font-semibold text-primary">{standing.wins}</span>
            <span className="w-8 text-center text-muted-foreground">{standing.losses}</span>
            <span className="w-12 text-center text-muted-foreground">{standing.setsWon}-{standing.setsLost}</span>
            <span className="w-12 text-center font-semibold">{standing.points}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <div className="glass-card p-4 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2">ATP Finals</Badge>
            <h2 className="font-display text-2xl font-bold">{tournament.name}</h2>
            <p className="text-sm text-muted-foreground">{tournament.city}, {tournament.country}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Points System</p>
            <p className="text-sm">200/group win • 400/SF • 500/Final</p>
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-2">
        {["groups", "semifinals", "final"].map((phase, idx) => (
          <React.Fragment key={phase}>
            <div className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${state.phase === phase ? "bg-primary text-primary-foreground" : 
                state.phase === "complete" || 
                (phase === "groups" && ["semifinals", "final", "complete"].includes(state.phase)) ||
                (phase === "semifinals" && ["final", "complete"].includes(state.phase))
                ? "bg-secondary text-secondary-foreground" 
                : "bg-muted text-muted-foreground"}
            `}>
              {phase === "groups" ? "Group Stage" : phase === "semifinals" ? "Semifinals" : "Final"}
            </div>
            {idx < 2 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      <ScrollArea className="h-[500px]">
        {/* Group Stage */}
        {state.phase === "groups" && (
          <div className="space-y-6 pr-4">
            {/* Group A */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Group A
                <span className="text-xs text-muted-foreground font-normal">(Rankings 1, 4, 5, 8)</span>
              </h3>
              {renderStandings(groupAStandings, "A")}
              <div className="space-y-2">
                {state.groupAMatches.map(match => renderMatch(match, { phase: "groups", group: "A" }))}
              </div>
            </div>

            {/* Group B */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Group B
                <span className="text-xs text-muted-foreground font-normal">(Rankings 2, 3, 6, 7)</span>
              </h3>
              {renderStandings(groupBStandings, "B")}
              <div className="space-y-2">
                {state.groupBMatches.map(match => renderMatch(match, { phase: "groups", group: "B" }))}
              </div>
            </div>

            {/* Advance button */}
            {allGroupMatchesComplete && (
              <Button onClick={handleAdvanceToSemifinals} className="w-full gap-2">
                Advance to Semifinals
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Semifinals */}
        {state.phase === "semifinals" && (
          <div className="space-y-6 pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-center">SF 1: A1 vs B2</h4>
                {state.semifinals.match1 && renderMatch(state.semifinals.match1, { phase: "semifinals" })}
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-center">SF 2: B1 vs A2</h4>
                {state.semifinals.match2 && renderMatch(state.semifinals.match2, { phase: "semifinals" })}
              </div>
            </div>

            {state.semifinals.match1?.result && state.semifinals.match2?.result && (
              <Button onClick={handleAdvanceToFinal} className="w-full gap-2">
                Advance to Final
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Final */}
        {(state.phase === "final" || state.phase === "complete") && state.final && (
          <div className="space-y-6 pr-4">
            <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <Trophy className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-center mb-4">Final</h3>
              {renderMatch(state.final, { phase: "final" })}
            </div>

            {state.final.result && state.phase !== "complete" && (
              <Button onClick={handleCompleteTournament} className="w-full gap-2">
                <Award className="w-4 h-4" />
                Complete Tournament & Award Points
              </Button>
            )}

            {state.phase === "complete" && state.final.result && (
              <div className="glass-card p-6 text-center bg-gradient-to-r from-yellow-500/20 to-yellow-500/5">
                <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">ATP Finals Champion</p>
                <h3 className="font-display text-2xl font-bold text-primary">
                  {state.final.result.winner.name}
                </h3>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ATPFinalsView;
