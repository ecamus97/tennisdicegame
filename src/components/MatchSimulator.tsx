import React, { useState, useEffect } from "react";
import { Player } from "@/data/players";
import { playMatch, MatchResult, getAdvantageLevel, getAdvantageDescription } from "@/lib/matchEngine";
import Dice from "./Dice";
import PlayerCard from "./PlayerCard";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap } from "lucide-react";

interface MatchSimulatorProps {
  player1: Player;
  player2: Player;
  bestOf?: 3 | 5;
  onMatchComplete?: (result: MatchResult) => void;
}

const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  player1,
  player2,
  bestOf = 3,
  onMatchComplete,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [currentDice, setCurrentDice] = useState<{ p1: number; p2: number }>({ p1: 1, p2: 1 });
  const [isRolling, setIsRolling] = useState(false);

  const rankingDiff = player2.fictionalRanking - player1.fictionalRanking;
  const advantageLevel = getAdvantageLevel(rankingDiff);
  const favoredPlayer = rankingDiff > 0 ? player1 : rankingDiff < 0 ? player2 : null;

  const simulateMatch = async (instant = false) => {
    setIsSimulating(true);
    setResult(null);
    
    if (!instant) {
      setIsRolling(true);
      // Animate dice rolls
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 60));
        setCurrentDice({
          p1: Math.floor(Math.random() * 6) + 1,
          p2: Math.floor(Math.random() * 6) + 1,
        });
      }
      setIsRolling(false);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const matchResult = playMatch(player1, player2, bestOf);
    setResult(matchResult);
    setIsSimulating(false);
    onMatchComplete?.(matchResult);
  };

  const resetMatch = () => {
    setResult(null);
    setCurrentDice({ p1: 1, p2: 1 });
  };

  const formatScore = () => {
    if (!result) return "";
    return result.sets.map(set => {
      const isP1SetWinner = set.player1Games > set.player2Games;
      const winnerGames = Math.max(set.player1Games, set.player2Games);
      const loserGames = Math.min(set.player1Games, set.player2Games);
      
      if (set.tiebreak) {
        const tbLoserPoints = Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points);
        return (
          <span key={`${set.player1Games}-${set.player2Games}`} className="mx-1">
            <span className={isP1SetWinner ? "text-primary font-bold" : "text-muted-foreground"}>
              {set.player1Games}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className={!isP1SetWinner ? "text-primary font-bold" : "text-muted-foreground"}>
              {set.player2Games}
            </span>
            <sup className="text-xs text-muted-foreground">({tbLoserPoints})</sup>
          </span>
        );
      }
      
      return (
        <span key={`${set.player1Games}-${set.player2Games}`} className="mx-1">
          <span className={isP1SetWinner ? "text-primary font-bold" : "text-muted-foreground"}>
            {set.player1Games}
          </span>
          <span className="text-muted-foreground">-</span>
          <span className={!isP1SetWinner ? "text-primary font-bold" : "text-muted-foreground"}>
            {set.player2Games}
          </span>
        </span>
      );
    });
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Match Simulator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Best of {bestOf} sets
        </p>
      </div>

      {/* Advantage indicator */}
      {advantageLevel !== "none" && favoredPlayer && (
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold">{favoredPlayer.name}</span> has {advantageLevel} advantage
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {getAdvantageDescription(advantageLevel)}
          </p>
        </div>
      )}

      {/* Players */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerCard 
          player={player1} 
          isWinner={result?.winner.id === player1.id}
          showPoints
        />
        <PlayerCard 
          player={player2} 
          isWinner={result?.winner.id === player2.id}
          showPoints
        />
      </div>

      {/* Dice display */}
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <Dice value={currentDice.p1} isRolling={isRolling} size="lg" variant="primary" />
          <p className="text-xs text-muted-foreground mt-2">{player1.name.split(" ").pop()}</p>
        </div>
        <div className="text-2xl font-display font-bold text-muted-foreground">VS</div>
        <div className="text-center">
          <Dice value={currentDice.p2} isRolling={isRolling} size="lg" variant="secondary" />
          <p className="text-xs text-muted-foreground mt-2">{player2.name.split(" ").pop()}</p>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="animate-slide-up text-center space-y-3">
          <div className="text-lg font-display">
            <span className="text-primary font-bold">{result.winner.name}</span>
            <span className="text-muted-foreground"> wins!</span>
          </div>
          <div className="text-xl font-display font-bold">
            {formatScore()}
          </div>
          <div className="text-sm text-muted-foreground">
            Sets: {result.player1Sets} - {result.player2Sets}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!result ? (
          <>
            <Button
              onClick={() => simulateMatch(false)}
              disabled={isSimulating}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isSimulating ? "Simulating..." : "Play Match"}
            </Button>
            <Button
              onClick={() => simulateMatch(true)}
              disabled={isSimulating}
              variant="secondary"
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Instant
            </Button>
          </>
        ) : (
          <Button onClick={resetMatch} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default MatchSimulator;
