import React, { useState } from "react";
import { Player } from "@/data/players";
import { MatchResult } from "@/lib/matchEngine";
import { ChevronLeft, ChevronRight, Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  result?: MatchResult;
  round: string;
}

interface TournamentBracketProps {
  draw: Match[][];
  currentRound: number;
  seeds: number[];
  wildCardIds?: Set<number>;
  onMatchClick?: (match: Match) => void;
  onRoundChange?: (round: number) => void;
}

// Build seed map from entrant IDs (first N players are seeds)
const getSeedNumber = (playerId: number, seeds: number[]): number | null => {
  const index = seeds.indexOf(playerId);
  return index !== -1 ? index + 1 : null;
};

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  draw,
  currentRound,
  seeds,
  wildCardIds,
  onMatchClick,
  onRoundChange,
}) => {
  const [viewingRound, setViewingRound] = useState(currentRound);

  // Update viewing round when current round changes
  React.useEffect(() => {
    setViewingRound(currentRound);
  }, [currentRound]);

  if (draw.length === 0) return null;

  const roundMatches = draw[viewingRound] || [];
  const isCurrentRound = viewingRound === currentRound;
  const hasPreviousRound = viewingRound > 0;
  const hasNextRound = viewingRound < draw.length - 1;
  const isFinalCompleted = draw[draw.length - 1]?.length === 1 && draw[draw.length - 1][0]?.result;

  const handlePreviousRound = () => {
    if (hasPreviousRound) {
      setViewingRound(prev => prev - 1);
      onRoundChange?.(viewingRound - 1);
    }
  };

  const handleNextRound = () => {
    if (hasNextRound) {
      setViewingRound(prev => prev + 1);
      onRoundChange?.(viewingRound + 1);
    }
  };

  const renderPlayerRow = (player: Player, isWinner: boolean, isTop: boolean) => {
    const seedNum = getSeedNumber(player.id, seeds);
    const isWildCard = wildCardIds?.has(player.id);
    
    return (
      <div 
        className={`
          flex items-center gap-2 p-2 transition-all
          ${isTop ? "rounded-t-lg border-b border-border/30" : "rounded-b-lg"}
          ${isWinner ? "bg-primary/20" : "bg-card/50"}
        `}
      >
        {/* Seed number or WC badge */}
        {seedNum ? (
          <span className="bg-medal-gold text-primary-foreground px-2 py-0.5 rounded text-xs font-bold min-w-[1.75rem] text-center">
            {seedNum}
          </span>
        ) : isWildCard ? (
          <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded text-xs font-bold min-w-[1.75rem] text-center">
            WC
          </span>
        ) : (
          <span className="min-w-[1.75rem]" />
        )}
        
        {/* Country code */}
        <span className="text-xs font-medium text-muted-foreground w-8">{player.countryCode}</span>
        
        {/* Player name + ranking */}
        <div className="flex-1 min-w-0">
          <span className={`font-medium truncate ${isWinner ? "text-primary" : "text-foreground"}`}>
            {player.name}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({player.officialRanking})
          </span>
        </div>
        
        {/* Injury indicator */}
        {player.injured && (
          <span className="text-destructive text-xs">🤕</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Round Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousRound}
          disabled={!hasPreviousRound}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <div className="text-center">
          <h3 className="font-display font-semibold text-foreground">
            {roundMatches[0]?.round || `Round ${viewingRound + 1}`}
          </h3>
          {!isCurrentRound && (
            <p className="text-xs text-muted-foreground">
              {viewingRound < currentRound ? "Completed" : "Upcoming"}
            </p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextRound}
          disabled={!hasNextRound}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Round Pills */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto pb-2">
        {draw.map((round, index) => {
          const completed = round.every(m => m.result);
          const isCurrent = index === currentRound;
          const isViewing = index === viewingRound;
          
          return (
            <button
              key={index}
              className={`
                px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all
                ${isViewing 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : ""
                }
                ${isCurrent ? "bg-primary text-primary-foreground" : 
                  completed ? "bg-secondary text-secondary-foreground" : 
                  "bg-muted text-muted-foreground"}
              `}
              onClick={() => {
                setViewingRound(index);
                onRoundChange?.(index);
              }}
            >
              {round[0]?.round}
            </button>
          );
        })}
      </div>

      {/* Matches Grid */}
      <ScrollArea className="h-[450px]">
        <div className="space-y-3 pr-4">
          {roundMatches.map((match) => {
            const isClickable = isCurrentRound && !match.result;
            
            return (
              <div
                key={match.id}
                className={`
                  glass-card overflow-hidden transition-all
                  ${isClickable ? "cursor-pointer hover:border-primary/50 hover:shadow-lg" : ""}
                  ${match.result ? "" : isCurrentRound ? "ring-1 ring-primary/30" : "opacity-60"}
                `}
                onClick={() => isClickable && onMatchClick?.(match)}
              >
                <div className="flex">
                  {/* Match content */}
                  <div className="flex-1">
                    {renderPlayerRow(match.player1, match.result?.winner.id === match.player1.id, true)}
                    {renderPlayerRow(match.player2, match.result?.winner.id === match.player2.id, false)}
                  </div>
                  
                  {/* Score column */}
                  <div className="flex flex-col justify-center px-3 bg-secondary/30 min-w-[60px]">
                    {match.result ? (
                      <div className="text-xs text-center space-y-0.5">
                        {match.result.sets.map((set, i) => (
                          <div key={i} className="font-mono">
                            {set.player1Games}-{set.player2Games}
                            {set.tiebreak && (
                              <sup className="text-muted-foreground">
                                ({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})
                              </sup>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : isCurrentRound ? (
                      <div className="flex items-center justify-center text-primary">
                        <Play className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center">
                        TBD
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Winner Display */}
      {isFinalCompleted && draw[draw.length - 1][0].result && (
        <div className="glass-card p-4 text-center bg-gradient-to-r from-primary/10 to-primary/5">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Champion</p>
          <h3 className="font-display text-xl font-bold text-primary">
            {draw[draw.length - 1][0].result?.winner.name}
          </h3>
        </div>
      )}
    </div>
  );
};

export default TournamentBracket;
