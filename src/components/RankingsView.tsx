import React, { useState, useMemo } from "react";
import { Player } from "@/data/players";
import PlayerDetailDialog from "@/components/PlayerDetailDialog";
import { Input } from "@/components/ui/input";
import { Search, Trophy, ChevronUp, ChevronDown, Activity } from "lucide-react";

interface RankingsViewProps {
  players: Player[];
  onPlayerSelect?: (player: Player) => void;
  careerPlayerId?: number;
  getH2HRecord?: (opponentId: number) => { wins: number; losses: number };
}

function getTierStyle(rank: number): { bg: string; badge: string; text: string } {
  if (rank === 1) return { bg: "bg-amber-500/10 border border-amber-500/30", badge: "bg-amber-500 text-white", text: "text-amber-400" };
  if (rank <= 3) return { bg: "bg-amber-400/8 border border-amber-400/20", badge: "bg-amber-400/80 text-white", text: "text-amber-400/80" };
  if (rank <= 10) return { bg: "bg-sky-500/8 border border-sky-500/20", badge: "bg-sky-500 text-white", text: "text-sky-400" };
  if (rank <= 50) return { bg: "bg-violet-500/5 border border-violet-500/15", badge: "bg-violet-600 text-white", text: "text-violet-400" };
  if (rank <= 100) return { bg: "bg-card/60 border border-border/50", badge: "bg-slate-600 text-white", text: "text-slate-400" };
  return { bg: "bg-card/40 border border-border/30", badge: "bg-slate-700 text-slate-300", text: "text-slate-500" };
}


const RankingsView: React.FC<RankingsViewProps> = ({ players, onPlayerSelect, careerPlayerId, getH2HRecord }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingType, setRankingType] = useState<"official" | "live">("official");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) =>
      rankingType === "official" ? b.points - a.points : b.livePoints - a.livePoints
    );
  }, [players, rankingType]);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm) return sortedPlayers;
    return sortedPlayers.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedPlayers, searchTerm]);

  const maxPoints = sortedPlayers[0]
    ? (rankingType === "official" ? sortedPlayers[0].points : sortedPlayers[0].livePoints)
    : 1;

  const handleRowClick = (player: Player) => {
    if (onPlayerSelect) {
      onPlayerSelect(player);
    } else {
      setSelectedPlayer(player);
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 bg-gradient-to-r from-sky-950/40 to-violet-950/40 border border-sky-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              ATP World Rankings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rankings based on points earned over the last 52 weeks
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-display font-bold text-amber-400">
              {players.length}
            </div>
            <div className="text-xs text-muted-foreground">Active Players</div>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center">
            <div className="text-lg font-display font-bold text-amber-400">
              {(maxPoints).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">#1 Points</div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center">
            <div className="text-lg font-display font-bold text-red-400">
              {players.filter(p => p.injured).length}
            </div>
            <div className="text-[10px] text-muted-foreground">Injured</div>
          </div>
          <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-2 text-center">
            <div className="text-lg font-display font-bold text-sky-400">
              {players.filter(p => p.livePoints > 0).length}
            </div>
            <div className="text-[10px] text-muted-foreground">Active This Season</div>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 p-1 bg-card/50 rounded-xl border border-border/50">
        <button
          onClick={() => setRankingType("official")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            rankingType === "official"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Official Ranking
          <span className="text-[10px] hidden sm:inline opacity-70">(52-week pts)</span>
        </button>
        <button
          onClick={() => setRankingType("live")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            rankingType === "live"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Race
          <span className="text-[10px] hidden sm:inline opacity-70">(this season)</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by player name or country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border/50"
        />
        {searchTerm && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filteredPlayers.length} found
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">🏆 Top 3</span>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">⭐ Top 10</span>
        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Top 50</span>
        <span className="px-2 py-0.5 rounded-full bg-card/60 text-slate-400 border border-border/50">Top 100+</span>
        <span className="ml-auto text-muted-foreground">Click any player for details</span>
      </div>

      {/* Rankings list */}
      <div className="space-y-1 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredPlayers.map((player, index) => {
          const rank = index + 1;
          // When searching, show original rank
          const displayRank = searchTerm
            ? sortedPlayers.indexOf(player) + 1
            : rank;
          const pts = rankingType === "official" ? player.points : player.livePoints;
          const tier = getTierStyle(displayRank);
          const rankChange = player.previousRanking && player.previousRanking !== player.officialRanking
            ? player.previousRanking - player.officialRanking
            : 0;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all hover:brightness-125 ${tier.bg}`}
              onClick={() => handleRowClick(player)}
            >
              {/* Rank badge */}
              <div className={`${tier.badge} text-xs font-bold min-w-[2rem] text-center px-1.5 py-0.5 rounded-md shrink-0`}>
                {displayRank}
              </div>

              {/* Rank change arrow */}
              <div className="w-5 shrink-0 text-center">
                {rankingType === "official" && rankChange > 0 && (
                  <span className="text-[10px] text-emerald-400 flex items-center">
                    <ChevronUp className="w-3 h-3" />{rankChange}
                  </span>
                )}
                {rankingType === "official" && rankChange < 0 && (
                  <span className="text-[10px] text-red-400 flex items-center">
                    <ChevronDown className="w-3 h-3" />{Math.abs(rankChange)}
                  </span>
                )}
              </div>

              {/* Country */}
              <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-8">
                {player.countryCode}
              </span>

              {/* Age */}
              {player.age && (
                <span className="text-[11px] text-muted-foreground shrink-0 w-6 text-right">{player.age}</span>
              )}

              {/* Name + injured indicator */}
              <div className="flex-1 min-w-0">
                <span className={`font-medium text-sm truncate block ${player.injured ? "text-red-400" : "text-foreground"}`}>
                  {player.name}
                  {player.injured && " 🤕"}
                </span>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <div className={`text-sm font-semibold tabular-nums ${tier.text}`}>
                  {pts.toLocaleString()}
                </div>
                <div className="text-[9px] text-muted-foreground">pts</div>
              </div>

              {/* Weekly points delta */}
              {rankingType === "official" && ((player.weeklyEarnedPoints || 0) > 0 || player.weeklyDefensePoints > 0) && (() => {
                const net = (player.weeklyEarnedPoints || 0) - player.weeklyDefensePoints;
                return (
                  <div className={`text-[10px] shrink-0 font-semibold ${net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {net > 0 ? `+${net}` : net === 0 ? '±0' : `−${Math.abs(net)}`}
                  </div>
                );
              })()}

            </div>
          );
        })}

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No players found for "{searchTerm}"</p>
          </div>
        )}
      </div>

      <PlayerDetailDialog
        player={selectedPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateFictionalRanking={() => {}}
      />
    </div>
  );
};

export default RankingsView;
