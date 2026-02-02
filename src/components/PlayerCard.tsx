import React from "react";
import { Player } from "@/data/players";

interface PlayerCardProps {
  player: Player;
  showRanking?: boolean;
  showPoints?: boolean;
  compact?: boolean;
  isWinner?: boolean;
  onClick?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showRanking = true,
  showPoints = false,
  compact = false,
  isWinner = false,
  onClick,
}) => {
  const getRankingBadge = (rank: number) => {
    if (rank === 1) return "bg-medal-gold text-primary-foreground";
    if (rank === 2) return "bg-medal-silver text-primary-foreground";
    if (rank === 3) return "bg-medal-bronze text-primary-foreground";
    if (rank <= 10) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg transition-all
          ${isWinner ? "bg-primary/20 border border-primary/50" : "bg-card/50"}
          ${onClick ? "cursor-pointer hover:bg-secondary/50" : ""}
        `}
        onClick={onClick}
      >
        {showRanking && (
          <span className={`${getRankingBadge(player.officialRanking)} px-2 py-0.5 rounded text-xs font-bold min-w-[2rem] text-center`}>
            {player.officialRanking}
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground">{player.countryCode}</span>
        <span className={`font-medium truncate ${isWinner ? "text-primary" : "text-foreground"}`}>
          {player.name}
        </span>
        {player.injured && (
          <span className="text-destructive text-xs">🤕</span>
        )}
        {showPoints && (
          <span className="ml-auto text-xs text-muted-foreground">{player.points.toLocaleString()} pts</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        glass-card p-4 transition-all
        ${isWinner ? "ring-2 ring-primary animate-pulse-glow" : ""}
        ${onClick ? "cursor-pointer hover:border-primary/50" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {showRanking && (
          <div className={`${getRankingBadge(player.officialRanking)} px-3 py-1 rounded-lg text-sm font-bold`}>
            #{player.officialRanking}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{player.countryCode}</span>
            {player.injured && <span className="text-destructive">🤕</span>}
          </div>
          <h3 className={`font-display font-bold text-lg truncate ${isWinner ? "text-primary glow-text" : "text-foreground"}`}>
            {player.name}
          </h3>
          {showPoints && (
            <p className="text-sm text-muted-foreground mt-1">
              {player.points.toLocaleString()} points
            </p>
          )}
        </div>
      </div>
      
      {player.fictionalRanking !== player.officialRanking && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Fictional: #{player.fictionalRanking}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
