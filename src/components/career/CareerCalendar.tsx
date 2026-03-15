import React from 'react';
import { CareerPlayer, CITY_DATA, calculateTravelDistance, getTravelCost, getTravelFatigue } from '@/data/careerData';
import { tournaments, getSurfaceEmoji, getCategoryColor } from '@/data/players';
import { MapPin, Plane, Check } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  currentWeek: number;
  completedTournaments: string[];
}

const CareerCalendar: React.FC<Props> = ({ player, currentWeek, completedTournaments }) => {
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  return (
    <div className="glass-card p-4">
      <h2 className="font-display font-semibold text-foreground mb-4">📅 Season Calendar</h2>
      <div className="space-y-1">
        {weeks.map(week => {
          const weekTournaments = tournaments.filter(t => t.week === week);
          const isCurrent = week === currentWeek;
          const isPast = week < currentWeek;

          if (weekTournaments.length === 0 && !isCurrent) return null;

          return (
            <div
              key={week}
              className={`p-2.5 rounded-lg transition-colors ${
                isCurrent ? 'bg-primary/10 border border-primary/30' :
                isPast ? 'opacity-50' : 'bg-secondary/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-mono font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                  W{week}
                </span>
                {isCurrent && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 rounded">CURRENT</span>}
              </div>
              {weekTournaments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No tournament</p>
              ) : (
                <div className="space-y-1">
                  {weekTournaments.map(t => {
                    const completed = completedTournaments.includes(t.id);
                    const distance = calculateTravelDistance(player.currentCity, t.city);
                    const cost = getTravelCost(distance);
                    const cityData = CITY_DATA[t.city];
                    const fatigue = getTravelFatigue(distance, player.currentContinent, cityData?.continent || 'Europe');
                    const result = player.seasonHistory.find(s => s.tournamentId === t.id);

                    return (
                      <div key={t.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {completed && <Check className="w-3 h-3 text-green-400 shrink-0" />}
                          <span className={getCategoryColor(t.category) + ' !text-[9px] shrink-0'}>{t.category}</span>
                          <span className="text-foreground truncate">{t.name}</span>
                          <span className="text-muted-foreground shrink-0">{getSurfaceEmoji(t.surface)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {result && (
                            <span className={`font-medium ${result.round === 'Winner' ? 'text-primary' : 'text-muted-foreground'}`}>
                              {result.round}
                            </span>
                          )}
                          {!isPast && !completed && (
                            <>
                              <span className="text-muted-foreground">{Math.round(distance)}km</span>
                              <span className="text-destructive/70">${cost.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CareerCalendar;
