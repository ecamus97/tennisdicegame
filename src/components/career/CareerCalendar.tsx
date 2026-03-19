import React, { useState, useMemo } from 'react';
import { CareerPlayer, CareerTournamentResult } from '@/data/careerData';
import { Tournament, getSurfaceEmoji, getCategoryColor } from '@/data/players';
import { Check, Trophy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  player: CareerPlayer;
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  allTournaments: Tournament[];
  tournamentHistory: CareerTournamentResult[];
}

const CareerCalendar: React.FC<Props> = ({ player, currentWeek, currentSeason, completedTournaments, allTournaments, tournamentHistory }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<number>(currentSeason);

  // Update season filter when currentSeason changes
  React.useEffect(() => {
    setSeasonFilter(currentSeason);
  }, [currentSeason]);

  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  const filteredTournaments = useMemo(() => {
    if (categoryFilter === 'all') return allTournaments;
    return allTournaments.filter(t => t.category === categoryFilter);
  }, [allTournaments, categoryFilter]);

  // Filter tournament history by selected season
  const seasonTournamentHistory = useMemo(() => {
    return tournamentHistory.filter(h => h.season === seasonFilter);
  }, [tournamentHistory, seasonFilter]);

  // Get season history for career player's results filtered by season
  const seasonPlayerHistory = useMemo(() => {
    return player.seasonHistory.filter(s => s.season === seasonFilter);
  }, [player.seasonHistory, seasonFilter]);

  // Available seasons
  const availableSeasons = useMemo(() => {
    const seasons = new Set<number>();
    seasons.add(currentSeason);
    tournamentHistory.forEach(h => seasons.add(h.season));
    player.seasonHistory.forEach(s => seasons.add(s.season));
    return Array.from(seasons).sort();
  }, [currentSeason, tournamentHistory, player.seasonHistory]);

  const isCurrentSeason = seasonFilter === currentSeason;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display font-semibold text-foreground">📅 Season Calendar</h2>
        <div className="flex items-center gap-2">
          {availableSeasons.length > 1 && (
            <Select value={String(seasonFilter)} onValueChange={v => setSeasonFilter(Number(v))}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {availableSeasons.map(s => (
                  <SelectItem key={s} value={String(s)}>Season {s}{s === currentSeason ? ' (Current)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              <SelectItem value="Grand Slam">Grand Slam</SelectItem>
              <SelectItem value="Masters 1000">Masters 1000</SelectItem>
              <SelectItem value="ATP 500">ATP 500</SelectItem>
              <SelectItem value="ATP 250">ATP 250</SelectItem>
              <SelectItem value="Challenger 175">Challenger 175</SelectItem>
              <SelectItem value="Challenger 125">Challenger 125</SelectItem>
              <SelectItem value="Challenger 100">Challenger 100</SelectItem>
              <SelectItem value="Challenger 75">Challenger 75</SelectItem>
              <SelectItem value="Challenger 50">Challenger 50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        {weeks.map(week => {
          const weekTournaments = filteredTournaments.filter(t => t.week === week);
          const isCurrent = isCurrentSeason && week === currentWeek;
          const isPast = isCurrentSeason ? week < currentWeek : seasonFilter < currentSeason;

          if (weekTournaments.length === 0 && !isCurrent) return null;

          return (
            <div
              key={week}
              className={`p-2.5 rounded-lg transition-colors ${
                isCurrent ? 'bg-primary/10 border border-primary/30' :
                isPast ? 'opacity-60' : 'bg-secondary/20'
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
                    const historyEntry = seasonTournamentHistory.find(h => h.tournamentId === t.id);
                    const completed = !!historyEntry;
                    const playerResult = seasonPlayerHistory.find(s => s.tournamentId === t.id);

                    return (
                      <div key={t.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {completed && <Check className="w-3 h-3 text-green-400 shrink-0" />}
                          <span className={getCategoryColor(t.category) + ' !text-[9px] shrink-0'}>{t.category}</span>
                          <span className="text-foreground truncate">{t.name}</span>
                          <span className="text-muted-foreground shrink-0">{getSurfaceEmoji(t.surface)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {/* Show player's result if they played */}
                          {playerResult && (
                            <span className={`font-medium ${playerResult.round === 'Winner' ? 'text-primary' : 'text-muted-foreground'}`}>
                              ({playerResult.round})
                            </span>
                          )}
                          {/* Always show tournament winner */}
                          {historyEntry && (
                            <span className="flex items-center gap-1 text-primary">
                              <Trophy className="w-3 h-3" /> {historyEntry.winnerName}
                            </span>
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
