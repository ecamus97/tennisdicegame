import React from "react";
import { Tournament, getCategoryColor, getSurfaceEmoji } from "@/data/players";

interface TournamentCardProps {
  tournament: Tournament;
  isActive?: boolean;
  onClick?: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, isActive = false, onClick }) => {
  return (
    <div
      className={`
        glass-card p-4 transition-all cursor-pointer
        ${isActive ? "ring-2 ring-primary animate-pulse-glow" : "hover:border-primary/30"}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={getCategoryColor(tournament.category)}>
              {tournament.category}
            </span>
            <span className="text-sm">{getSurfaceEmoji(tournament.surface)}</span>
          </div>
          <h3 className="font-display font-bold text-lg text-foreground truncate">
            {tournament.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {tournament.city}, {tournament.country}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Week {tournament.week}</div>
          <div className="text-sm font-semibold text-primary mt-1">
            {tournament.points.winner} pts
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span>🎾 {tournament.playerLimit} players</span>
        <span>🏆 {tournament.seeds} seeds</span>
      </div>
    </div>
  );
};

export default TournamentCard;
