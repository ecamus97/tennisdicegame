import React, { useState, useMemo } from "react";
import { Player } from "@/data/players";
import PlayerCard from "./PlayerCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trophy, TrendingUp } from "lucide-react";

interface RankingsViewProps {
  players: Player[];
  onPlayerSelect?: (player: Player) => void;
}

const RankingsView: React.FC<RankingsViewProps> = ({ players, onPlayerSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankingType, setRankingType] = useState<"official" | "live">("official");

  const filteredPlayers = useMemo(() => {
    return players
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (rankingType === "official") {
          return a.officialRanking - b.officialRanking;
        }
        // Live ranking: sort by livePoints (current year points only)
        return b.livePoints - a.livePoints;
      });
  }, [players, searchTerm, rankingType]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          ATP Rankings
        </h2>
      </div>

      {/* Tabs */}
      <Tabs value={rankingType} onValueChange={(v) => setRankingType(v as "official" | "live")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="official" className="gap-2">
            <Trophy className="w-4 h-4" />
            Official
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Live
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-display font-bold text-primary">{players.length}</div>
          <div className="text-xs text-muted-foreground">Players</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-display font-bold text-accent">
            {players.filter(p => p.injured).length}
          </div>
          <div className="text-xs text-muted-foreground">Injured</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-2xl font-display font-bold text-foreground">
            {rankingType === "official" 
              ? (filteredPlayers[0]?.points || 0).toLocaleString()
              : (filteredPlayers[0]?.livePoints || 0).toLocaleString()
            }
          </div>
          <div className="text-xs text-muted-foreground">
            #1 {rankingType === "official" ? "Official" : "Live"} Pts
          </div>
        </div>
      </div>

      {/* Rankings list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
        {filteredPlayers.map((player, index) => (
          <div 
            key={player.id}
            className="animate-slide-up"
            style={{ animationDelay: `${Math.min(index, 30) * 20}ms` }}
          >
            <PlayerCard
              player={player}
              showPoints
              compact
              onClick={() => onPlayerSelect?.(player)}
              rankingType={rankingType}
              displayRank={index + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingsView;
