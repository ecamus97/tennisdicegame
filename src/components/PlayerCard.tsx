import React from "react";
import { Player } from "@/data/players";

interface PlayerCardProps {
  player: Player;
  showRanking?: boolean;
  showPoints?: boolean;
  compact?: boolean;
  isWinner?: boolean;
  onClick?: () => void;
  rankingType?: "official" | "live";
  displayRank?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  showRanking = true,
  showPoints = false,
  compact = false,
  isWinner = false,
  onClick,
  rankingType = "official",
  displayRank,
}) => {
  const rank = displayRank ?? player.officialRanking;
  const points = rankingType === "live" ? player.livePoints : player.points;
  const rankingDrop = (player.previousRanking && player.previousRanking < player.officialRanking)
    ? player.officialRanking - player.previousRanking
    : 0;
  const rankingRise = (player.previousRanking && player.previousRanking > player.officialRanking)
    ? player.previousRanking - player.officialRanking
    : 0;
  const defensePoints = player.weeklyDefensePoints || 0;

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
          <div className="flex items-center gap-1">
            <span className={`${getRankingBadge(rank)} px-2 py-0.5 rounded text-xs font-bold min-w-[2rem] text-center`}>
              {rank}
            </span>
            {rankingDrop > 0 && (
              <span className="text-[10px] font-bold text-red-500">▼{rankingDrop}</span>
            )}
            {rankingRise > 0 && (
              <span className="text-[10px] font-bold text-green-500">▲{rankingRise}</span>
            )}
          </div>
        )}
        <span className="text-xs font-medium text-muted-foreground">{player.countryCode}</span>
        <span className={`font-medium truncate ${isWinner ? "text-primary" : "text-foreground"}`}>
          {player.name}
        </span>
        {player.injured && (
          <span className="text-destructive text-xs">🤕</span>
        )}
        {showPoints && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">{points.toLocaleString()} pts</span>
            {defensePoints > 0 && rankingType === "official" && (
              <span className="text-[10px] font-bold text-red-500">(-{defensePoints})</span>
            )}
          </div>
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
          <div className="flex flex-col items-center gap-0.5">
            <div className={`${getRankingBadge(rank)} px-3 py-1 rounded-lg text-sm font-bold`}>
              #{rank}
            </div>
            {rankingDrop > 0 && (
              <span className="text-[10px] font-bold text-red-500">▼{rankingDrop}</span>
            )}
            {rankingRise > 0 && (
              <span className="text-[10px] font-bold text-green-500">▲{rankingRise}</span>
            )}
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
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span>{points.toLocaleString()} pts</span>
              {defensePoints > 0 && rankingType === "official" && (
                <span className="text-red-500 font-bold text-xs">(-{defensePoints})</span>
              )}
              {rankingType === "official" && player.livePoints > 0 && (
                <span className="text-primary">({player.livePoints.toLocaleString()} this year)</span>
              )}
            </div>
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
