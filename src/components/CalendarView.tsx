import React, { useState } from "react";
import { tournaments, Tournament, getCategoryColor } from "@/data/players";
import { TournamentResult } from "@/hooks/useGameState";
import TournamentCard from "./TournamentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle, Trophy } from "lucide-react";

interface CalendarViewProps {
  currentWeek: number;
  onTournamentSelect?: (tournament: Tournament) => void;
  tournamentHistory?: TournamentResult[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentWeek, onTournamentSelect, tournamentHistory = [] }) => {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");

  const upcomingTournaments = tournaments.filter(t => t.week >= currentWeek);
  const pastTournaments = tournaments.filter(t => t.week < currentWeek);
  const currentTournaments = tournaments.filter(t => t.week === currentWeek);

  const displayedTournaments = view === "upcoming" 
    ? upcomingTournaments 
    : view === "past" 
    ? pastTournaments.reverse()
    : tournaments;

  const groupByMonth = (tourns: Tournament[]) => {
    const getMonth = (week: number) => {
      if (week <= 4) return "January";
      if (week <= 8) return "February";
      if (week <= 12) return "March";
      if (week <= 17) return "April";
      if (week <= 21) return "May";
      if (week <= 25) return "June";
      if (week <= 29) return "July";
      if (week <= 33) return "August";
      if (week <= 37) return "September";
      if (week <= 41) return "October";
      if (week <= 45) return "November";
      return "December";
    };

    const groups: Record<string, Tournament[]> = {};
    tourns.forEach(t => {
      const month = getMonth(t.week);
      if (!groups[month]) groups[month] = [];
      groups[month].push(t);
    });
    return groups;
  };

  const groupedTournaments = groupByMonth(displayedTournaments);

  // Category dot color
  const getCategoryDotColor = (category?: string) => {
    switch (category) {
      case "Grand Slam": return "bg-yellow-500";
      case "Masters 1000": return "bg-primary";
      case "ATP 500": return "bg-blue-400";
      case "ATP 250": return "bg-muted-foreground";
      case "ATP Finals": return "bg-yellow-500";
      case "Davis Cup": return "bg-green-500";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          ATP Calendar 2026
        </h2>
        <div className="text-sm text-muted-foreground">
          Week {currentWeek}
        </div>
      </div>

      {/* Current tournament highlight */}
      {currentTournaments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Clock className="w-4 h-4" />
            Now Playing
          </div>
          {currentTournaments.map(t => (
            <TournamentCard 
              key={t.id} 
              tournament={t} 
              isActive 
              onClick={() => onTournamentSelect?.(t)}
            />
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1 text-xs">
            <CheckCircle className="w-3 h-3" />
            Past
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1 text-xs">
            <Calendar className="w-3 h-3" />
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="glass-card p-2">
          <div className="text-lg font-display font-bold text-primary">
            {tournaments.filter(t => t.category === "Grand Slam").length}
          </div>
          <div className="text-xs text-muted-foreground">Grand Slams</div>
        </div>
        <div className="glass-card p-2">
          <div className="text-lg font-display font-bold text-accent">
            {tournaments.filter(t => t.category === "Masters 1000").length}
          </div>
          <div className="text-xs text-muted-foreground">Masters</div>
        </div>
        <div className="glass-card p-2">
          <div className="text-lg font-display font-bold text-foreground">
            {tournaments.filter(t => t.category === "ATP 500").length}
          </div>
          <div className="text-xs text-muted-foreground">ATP 500</div>
        </div>
        <div className="glass-card p-2">
          <div className="text-lg font-display font-bold text-muted-foreground">
            {tournaments.filter(t => t.category === "ATP 250").length}
          </div>
          <div className="text-xs text-muted-foreground">ATP 250</div>
        </div>
      </div>

      {/* Tournament Winners Table */}
      {tournamentHistory.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Palmarés
          </h3>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {[...tournamentHistory].reverse().map((result, idx) => {
              const t = tournaments.find(tr => tr.id === result.tournamentId);
              return (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getCategoryDotColor(t?.category)}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{result.winnerName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{t?.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                    t?.category === "Grand Slam" ? "bg-yellow-500/20 text-yellow-600" :
                    t?.category === "Masters 1000" ? "bg-primary/20 text-primary" :
                    t?.category === "ATP Finals" ? "bg-yellow-500/20 text-yellow-600" :
                    t?.category === "Davis Cup" ? "bg-green-500/20 text-green-600" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {t?.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tournament list */}
      <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
        {Object.entries(groupedTournaments).map(([month, tourns]) => (
          <div key={month}>
            <h3 className="font-display font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
              {month}
            </h3>
            <div className="space-y-2">
              {tourns.map((tournament, index) => (
                <div 
                  key={tournament.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TournamentCard
                    tournament={tournament}
                    isActive={tournament.week === currentWeek}
                    onClick={() => onTournamentSelect?.(tournament)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
