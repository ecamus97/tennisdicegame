import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CareerPlayer, CareerTournamentResult } from '@/data/careerData';
import { Tournament, getSurfaceEmoji, getCategoryColor, TournamentCategory } from '@/data/players';
import { Check, Trophy, ChevronDown, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  player: CareerPlayer;
  currentWeek: number;
  currentSeason: number;
  completedTournaments: string[];
  allTournaments: Tournament[];
  tournamentHistory: CareerTournamentResult[];
}

const ALL_CATEGORIES: TournamentCategory[] = [
  'Grand Slam', 'Masters 1000', 'ATP 500', 'ATP 250',
  'Challenger 175', 'Challenger 125', 'Challenger 100', 'Challenger 75', 'Challenger 50',
  'ITF M25', 'ITF M15',
];

const CareerCalendar: React.FC<Props> = ({ player, currentWeek, currentSeason, completedTournaments, allTournaments, tournamentHistory }) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<TournamentCategory>>(new Set());
  const [seasonFilter, setSeasonFilter] = useState<number>(currentSeason);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSeasonFilter(currentSeason);
  }, [currentSeason]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

  const filteredTournaments = useMemo(() => {
    if (selectedCategories.size === 0) return allTournaments;
    return allTournaments.filter(t => selectedCategories.has(t.category as TournamentCategory));
  }, [allTournaments, selectedCategories]);

  const seasonTournamentHistory = useMemo(() => {
    return tournamentHistory.filter(h => h.season === seasonFilter);
  }, [tournamentHistory, seasonFilter]);

  const seasonPlayerHistory = useMemo(() => {
    return player.seasonHistory.filter(s => s.season === seasonFilter);
  }, [player.seasonHistory, seasonFilter]);

  const availableSeasons = useMemo(() => {
    const seasons = new Set<number>();
    seasons.add(currentSeason);
    tournamentHistory.forEach(h => seasons.add(h.season));
    player.seasonHistory.forEach(s => seasons.add(s.season));
    return Array.from(seasons).sort();
  }, [currentSeason, tournamentHistory, player.seasonHistory]);

  const isCurrentSeason = seasonFilter === currentSeason;

  const toggleCategory = (cat: TournamentCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearCategories = () => setSelectedCategories(new Set());

  const filterLabel = selectedCategories.size === 0
    ? 'All Tournaments'
    : selectedCategories.size === 1
      ? Array.from(selectedCategories)[0]
      : `${selectedCategories.size} selected`;

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

          {/* Multi-select category filter */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-card/50 text-sm text-foreground hover:border-primary/40 transition-colors min-w-[180px] justify-between"
            >
              <span className="truncate">{filterLabel}</span>
              <div className="flex items-center gap-1 shrink-0">
                {selectedCategories.size > 0 && (
                  <span
                    className="text-muted-foreground hover:text-foreground p-0.5"
                    onClick={e => { e.stopPropagation(); clearCategories(); }}
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border/50 rounded-lg shadow-xl min-w-[200px] py-1 max-h-72 overflow-y-auto">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/30 transition-colors"
                  onClick={clearCategories}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedCategories.size === 0 ? 'bg-primary border-primary' : 'border-border'}`}>
                    {selectedCategories.size === 0 && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  <span className="text-foreground">All Tournaments</span>
                </button>
                {ALL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/30 transition-colors"
                    onClick={() => toggleCategory(cat)}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedCategories.has(cat) ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selectedCategories.has(cat) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    <span className="text-foreground">{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
                          {playerResult && (
                            <span className={`font-medium ${playerResult.round === 'Winner' ? 'text-primary' : 'text-muted-foreground'}`}>
                              ({playerResult.round})
                            </span>
                          )}
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
