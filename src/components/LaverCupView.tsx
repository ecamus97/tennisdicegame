import React, { useEffect, useState } from "react";
import { Player, EUROPEAN_COUNTRY_CODES } from "@/data/players";
import { MatchResult } from "@/lib/matchEngine";
import { Trophy, Users, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ========== Types ==========

export interface LaverCupMatch {
  id: string;
  day: 1 | 2 | 3;
  matchNumber: number; // 1-4 within day
  isDoubles: boolean;
  europePlayer1Id: number;
  europePlayer2Id?: number; // doubles partner
  worldPlayer1Id: number;
  worldPlayer2Id?: number; // doubles partner
  result?: MatchResult;
  europeWon?: boolean;
  pointValue: number; // 1, 2, or 3
}

export interface LaverCupState {
  europePlayerIds: number[];
  worldPlayerIds: number[];
  matches: LaverCupMatch[];
  europeScore: number;
  worldScore: number;
  phase: "playing" | "complete";
}

interface LaverCupViewProps {
  players: Player[];
  state: LaverCupState | null;
  onStateChange: (state: LaverCupState) => void;
  onMatchClick: (
    player1: Player,
    player2: Player,
    matchId: string,
  ) => void;
  onComplete: () => void;
}

// ========== Helpers ==========

const getPlayerById = (players: Player[], id: number): Player | undefined =>
  players.find(p => p.id === id);

// Create a composite player for doubles display
const createDoublesPlayer = (p1: Player, p2: Player): Player => ({
  ...p1,
  id: -(p1.id * 1000 + p2.id),
  name: `${p1.name.split(' ').pop()}/${p2.name.split(' ').pop()}`,
  fictionalRanking: Math.round((p1.fictionalRanking + p2.fictionalRanking) / 2),
  officialRanking: Math.round((p1.officialRanking + p2.officialRanking) / 2),
});

// Select top 6 players for each team with some skip chance
const selectTeams = (players: Player[]): { europe: Player[]; world: Player[] } => {
  const sorted = [...players].sort((a, b) => a.officialRanking - b.officialRanking);
  const available = sorted.filter(p => !p.injured);

  const europe: Player[] = [];
  const world: Player[] = [];

  for (const p of available) {
    if (europe.length >= 6 && world.length >= 6) break;
    const isEuropean = EUROPEAN_COUNTRY_CODES.has(p.countryCode);
    const team = isEuropean ? europe : world;
    if (team.length >= 6) continue;
    // ~15% chance top players skip
    if (Math.random() < 0.15 && team.length < 5) continue;
    team.push(p);
  }

  return { europe, world };
};

// Generate a derangement of indices [0,1,2] given an existing permutation
const derange = (perm: number[]): number[] => {
  // Shift by 1
  return perm.map((_, i) => perm[(i + 1) % perm.length]);
};

// Shuffle array
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Generate all 12 matches
const generateSchedule = (europeIds: number[], worldIds: number[]): LaverCupMatch[] => {
  // Players ranked 0-5 within each team (0=best)
  // Day 1: singles by ranks 3,4,5; doubles by (4,5)
  // Day 2: singles by ranks 0,1,2; doubles by (2,3)
  // Day 3: doubles by (0,1); singles by ranks 0,1,2 (deranged from day2)

  const matches: LaverCupMatch[] = [];
  let matchCounter = 0;

  // Day 1 Singles: ranks 3,4,5 vs shuffled 3,4,5
  const day1EuropeIdx = [3, 4, 5];
  const day1WorldIdx = shuffle([3, 4, 5]);
  for (let i = 0; i < 3; i++) {
    matches.push({
      id: `lc-${matchCounter++}`,
      day: 1, matchNumber: i + 1, isDoubles: false,
      europePlayer1Id: europeIds[day1EuropeIdx[i]],
      worldPlayer1Id: worldIds[day1WorldIdx[i]],
      pointValue: 1,
    });
  }
  // Day 1 Doubles: (4,5)
  matches.push({
    id: `lc-${matchCounter++}`,
    day: 1, matchNumber: 4, isDoubles: true,
    europePlayer1Id: europeIds[4], europePlayer2Id: europeIds[5],
    worldPlayer1Id: worldIds[4], worldPlayer2Id: worldIds[5],
    pointValue: 1,
  });

  // Day 2 Singles: ranks 0,1,2 vs shuffled 0,1,2
  const day2WorldPerm = shuffle([0, 1, 2]);
  for (let i = 0; i < 3; i++) {
    matches.push({
      id: `lc-${matchCounter++}`,
      day: 2, matchNumber: i + 1, isDoubles: false,
      europePlayer1Id: europeIds[i],
      worldPlayer1Id: worldIds[day2WorldPerm[i]],
      pointValue: 2,
    });
  }
  // Day 2 Doubles: (2,3)
  matches.push({
    id: `lc-${matchCounter++}`,
    day: 2, matchNumber: 4, isDoubles: true,
    europePlayer1Id: europeIds[2], europePlayer2Id: europeIds[3],
    worldPlayer1Id: worldIds[2], worldPlayer2Id: worldIds[3],
    pointValue: 2,
  });

  // Day 3 Doubles first: (0,1)
  matches.push({
    id: `lc-${matchCounter++}`,
    day: 3, matchNumber: 1, isDoubles: true,
    europePlayer1Id: europeIds[0], europePlayer2Id: europeIds[1],
    worldPlayer1Id: worldIds[0], worldPlayer2Id: worldIds[1],
    pointValue: 3,
  });
  // Day 3 Singles: ranks 0,1,2 vs deranged from day2
  const day3WorldPerm = derange(day2WorldPerm);
  for (let i = 0; i < 3; i++) {
    matches.push({
      id: `lc-${matchCounter++}`,
      day: 3, matchNumber: i + 2, isDoubles: false,
      europePlayer1Id: europeIds[i],
      worldPlayer1Id: worldIds[day3WorldPerm[i]],
      pointValue: 3,
    });
  }

  return matches;
};

// ========== Component ==========

const LaverCupView: React.FC<LaverCupViewProps> = ({
  players,
  state,
  onStateChange,
  onMatchClick,
  onComplete,
}) => {
  // Initialize state
  useEffect(() => {
    if (state) return;
    const { europe, world } = selectTeams(players);
    const europeIds = europe.map(p => p.id);
    const worldIds = world.map(p => p.id);
    const matches = generateSchedule(europeIds, worldIds);
    onStateChange({
      europePlayerIds: europeIds,
      worldPlayerIds: worldIds,
      matches,
      europeScore: 0,
      worldScore: 0,
      phase: "playing",
    });
  }, [state, players, onStateChange]);

  const allPlayed = state ? state.matches.every(m => m.result) : false;
  const isComplete = state ? (state.phase === "complete" || allPlayed) : false;

  // Check completion
  useEffect(() => {
    if (state && allPlayed && state.phase !== "complete") {
      onStateChange({ ...state, phase: "complete" });
      onComplete();
    }
  }, [allPlayed, state, onStateChange, onComplete]);

  if (!state) return null;

  const europeScore = state.matches
    .filter(m => m.europeWon === true)
    .reduce((sum, m) => sum + m.pointValue, 0);
  const worldScore = state.matches
    .filter(m => m.europeWon === false)
    .reduce((sum, m) => sum + m.pointValue, 0);

  const handleMatchClick = (match: LaverCupMatch) => {
    if (match.result) return;
    let europePlayer: Player;
    let worldPlayer: Player;

    if (match.isDoubles) {
      const e1 = getPlayerById(players, match.europePlayer1Id);
      const e2 = getPlayerById(players, match.europePlayer2Id!);
      const w1 = getPlayerById(players, match.worldPlayer1Id);
      const w2 = getPlayerById(players, match.worldPlayer2Id!);
      if (!e1 || !e2 || !w1 || !w2) return;
      europePlayer = createDoublesPlayer(e1, e2);
      worldPlayer = createDoublesPlayer(w1, w2);
    } else {
      const e = getPlayerById(players, match.europePlayer1Id);
      const w = getPlayerById(players, match.worldPlayer1Id);
      if (!e || !w) return;
      europePlayer = e;
      worldPlayer = w;
    }

    onMatchClick(europePlayer, worldPlayer, match.id);
  };

  // Update match result
  const updateMatchResult = (matchId: string, result: MatchResult) => {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;

    // Determine if Europe won
    let europeWon: boolean;
    if (match.isDoubles) {
      // Winner ID will be the composite doubles player ID
      const e1 = match.europePlayer1Id;
      const e2 = match.europePlayer2Id!;
      const compositeEuropeId = -(e1 * 1000 + e2);
      europeWon = result.winner.id === compositeEuropeId;
    } else {
      europeWon = result.winner.id === match.europePlayer1Id;
    }

    const updatedMatches = state.matches.map(m =>
      m.id === matchId ? { ...m, result, europeWon } : m
    );

    onStateChange({
      ...state,
      matches: updatedMatches,
      europeScore: updatedMatches.filter(m => m.europeWon === true).reduce((s, m) => s + m.pointValue, 0),
      worldScore: updatedMatches.filter(m => m.europeWon === false).reduce((s, m) => s + m.pointValue, 0),
    });
  };

  const renderMatch = (match: LaverCupMatch) => {
    const eName = match.isDoubles
      ? `${getPlayerById(players, match.europePlayer1Id)?.name.split(' ').pop()}/${getPlayerById(players, match.europePlayer2Id!)?.name.split(' ').pop()}`
      : getPlayerById(players, match.europePlayer1Id)?.name || "?";
    const wName = match.isDoubles
      ? `${getPlayerById(players, match.worldPlayer1Id)?.name.split(' ').pop()}/${getPlayerById(players, match.worldPlayer2Id!)?.name.split(' ').pop()}`
      : getPlayerById(players, match.worldPlayer1Id)?.name || "?";

    const played = !!match.result;
    const europeWon = match.europeWon === true;

    return (
      <div
        key={match.id}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          played
            ? "bg-secondary/30"
            : "bg-secondary/10 hover:bg-secondary/30 border border-dashed border-border"
        }`}
        onClick={() => !played && handleMatchClick(match)}
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 flex-1">
            <span className={`font-medium ${played && europeWon ? "text-blue-400" : "text-foreground"}`}>
              🔵 {eName}
            </span>
          </div>
          <div className="flex items-center gap-1 mx-2">
            {played ? (
              <span className="text-xs text-muted-foreground">
                {match.result!.sets.map(s => `${s[0]}-${s[1]}`).join(" ")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">vs</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={`font-medium ${played && !europeWon ? "text-red-400" : "text-foreground"}`}>
              {wName} 🔴
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <Badge variant="outline" className="text-[10px]">
            {match.isDoubles ? "Doubles" : "Singles"}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {match.pointValue}pt{match.pointValue > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    );
  };

  const matchesByDay = [1, 2, 3].map(day =>
    state.matches.filter(m => m.day === day)
  );

  const winner = isComplete
    ? europeScore > worldScore ? "Team Europe" : europeScore < worldScore ? "Team World" : "Tied"
    : null;

  return (
    <div className="space-y-4">
      {/* Header & Score */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Laver Cup
          </h2>
          <Badge variant="outline">Best of 24 pts</Badge>
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-blue-400">{europeScore}</div>
            <div className="text-sm text-muted-foreground">🔵 Team Europe</div>
          </div>
          <div className="text-2xl text-muted-foreground">-</div>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-red-400">{worldScore}</div>
            <div className="text-sm text-muted-foreground">Team World 🔴</div>
          </div>
        </div>
      </div>

      {/* Winner */}
      {winner && winner !== "Tied" && (
        <div className="glass-card p-6 text-center animate-bounce-in">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
          <h3 className="font-display text-2xl font-bold text-primary glow-text">
            🏆 {winner} Wins! 🏆
          </h3>
          <p className="text-muted-foreground mt-1">
            {europeScore} - {worldScore}
          </p>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3">
          <h3 className="font-display font-semibold text-blue-400 mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Team Europe
          </h3>
          <div className="space-y-1">
            {state.europePlayerIds.map((id, i) => {
              const p = getPlayerById(players, id);
              return p ? (
                <div key={id} className="text-xs flex justify-between p-1 rounded bg-blue-500/5">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">#{p.officialRanking}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div className="glass-card p-3">
          <h3 className="font-display font-semibold text-red-400 mb-2 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Team World
          </h3>
          <div className="space-y-1">
            {state.worldPlayerIds.map((id, i) => {
              const p = getPlayerById(players, id);
              return p ? (
                <div key={id} className="text-xs flex justify-between p-1 rounded bg-red-500/5">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">#{p.officialRanking}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Matches by Day */}
      {matchesByDay.map((dayMatches, dayIdx) => (
        <div key={dayIdx} className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Day {dayIdx + 1}
            <Badge variant="secondary" className="text-[10px]">
              {dayIdx + 1}x points
            </Badge>
            {dayIdx === 2 && (
              <span className="text-[10px] text-muted-foreground">(Doubles first)</span>
            )}
          </h3>
          <div className="space-y-2">
            {dayMatches.map(renderMatch)}
          </div>
        </div>
      ))}

      {/* Simulate All */}
      {!isComplete && (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1"
            onClick={() => {
              // Find next unplayed match
              const next = state.matches.find(m => !m.result);
              if (next) handleMatchClick(next);
            }}
          >
            <Zap className="w-3 h-3" />
            Play Next Match
          </Button>
        </div>
      )}
    </div>
  );
};

export default LaverCupView;
export { selectTeams };
