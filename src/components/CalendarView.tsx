import React, { useState } from "react";
import { tournaments, Tournament } from "@/data/players";
import TournamentCard from "./TournamentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, CheckCircle } from "lucide-react";

interface CalendarViewProps {
  currentWeek: number;
  onTournamentSelect?: (tournament: Tournament) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentWeek, onTournamentSelect }) => {
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
    // Approximate months based on week number (season starts mid-January)
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
