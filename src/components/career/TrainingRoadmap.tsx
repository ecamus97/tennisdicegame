import React, { useState } from 'react';
import { CareerPlayer, WeeklyPlanEntry, TRAINING_OPTIONS, TrainingType } from '@/data/careerData';
import { Tournament, getCategoryColor, getSurfaceEmoji } from '@/data/players';
import { Calendar, Dumbbell, Moon, Trophy, X, Check } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  currentWeek: number;
  currentSeason: number;
  allTournaments: Tournament[];
  onUpdatePlan: (plan: WeeklyPlanEntry[]) => void;
}

const TYPE_CONFIG = {
  tournament: { icon: Trophy, label: 'Tournament', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  training: { icon: Dumbbell, label: 'Training', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  rest: { icon: Moon, label: 'Rest', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  unplanned: { icon: Calendar, label: 'Open', color: 'bg-secondary/30 text-muted-foreground border-border/40' },
};

// 52 weeks distributed across 12 months — 4 months get 5 weeks, rest get 4
const MONTHS: { name: string; weeks: number[] }[] = [
  { name: 'January',   weeks: [1, 2, 3, 4, 5] },
  { name: 'February',  weeks: [6, 7, 8, 9] },
  { name: 'March',     weeks: [10, 11, 12, 13] },
  { name: 'April',     weeks: [14, 15, 16, 17] },
  { name: 'May',       weeks: [18, 19, 20, 21, 22] },
  { name: 'June',      weeks: [23, 24, 25, 26] },
  { name: 'July',      weeks: [27, 28, 29, 30] },
  { name: 'August',    weeks: [31, 32, 33, 34, 35] },
  { name: 'September', weeks: [36, 37, 38, 39] },
  { name: 'October',   weeks: [40, 41, 42, 43] },
  { name: 'November',  weeks: [44, 45, 46, 47, 48] },
  { name: 'December',  weeks: [49, 50, 51, 52] },
];

const TrainingRoadmap: React.FC<Props> = ({ player, currentWeek, allTournaments, onUpdatePlan }) => {
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

  const getPlanForWeek = (week: number): WeeklyPlanEntry =>
    player.weeklyPlan.find(p => p.week === week) || { week, type: 'unplanned' };

  const updateWeekPlan = (week: number, type: WeeklyPlanEntry['type'], tournamentId?: string, trainingType?: string) => {
    const existing = player.weeklyPlan.filter(p => p.week !== week);
    onUpdatePlan([...existing, { week, type, tournamentId, trainingType }]);
  };

  const clearWeek = (week: number) => {
    onUpdatePlan(player.weeklyPlan.filter(p => p.week !== week));
    if (editingWeek === week) setEditingWeek(null);
  };

  const editingPlan = editingWeek !== null ? getPlanForWeek(editingWeek) : null;
  const editingTournaments = editingWeek !== null ? allTournaments.filter(t => t.week === editingWeek) : [];

  // Stats
  const planned = player.weeklyPlan.filter(p => p.type !== 'unplanned');
  const tournamentCount = planned.filter(p => p.type === 'tournament').length;
  const trainingCount = planned.filter(p => p.type === 'training').length;
  const restCount = planned.filter(p => p.type === 'rest').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Season Roadmap
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Plan your season week by week — optional, you can always deviate</p>
          </div>
          <div className="flex items-center gap-2 text-xs hidden sm:flex">
            <span className="px-2 py-1 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30">{tournamentCount} tournaments</span>
            <span className="px-2 py-1 rounded border bg-blue-500/20 text-blue-400 border-blue-500/30">{trainingCount} training</span>
            <span className="px-2 py-1 rounded border bg-purple-500/20 text-purple-400 border-purple-500/30">{restCount} rest</span>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <span key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${cfg.color}`}>
                <Icon className="w-3 h-3" />{cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Monthly sections */}
      {MONTHS.map(month => (
        <div key={month.name} className="glass-card p-4">
          <h4 className="font-display font-semibold text-foreground text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            {month.name}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {month.weeks.map(week => {
              const plan = getPlanForWeek(week);
              const isCurrent = week === currentWeek;
              const isPast = week < currentWeek;
              const weekTournaments = allTournaments.filter(t => t.week === week);
              const cfg = TYPE_CONFIG[plan.type];
              const Icon = cfg.icon;
              const plannedTournament = plan.tournamentId ? allTournaments.find(t => t.id === plan.tournamentId) : null;
              const trainingOption = plan.trainingType ? TRAINING_OPTIONS.find(o => o.type === plan.trainingType) : null;
              const isEditing = editingWeek === week;

              return (
                <div
                  key={week}
                  onClick={() => !isPast && setEditingWeek(isEditing ? null : week)}
                  className={`relative rounded-lg p-3 cursor-pointer transition-all border ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                  } ${isPast ? 'opacity-40 cursor-default' : 'hover:brightness-125'} ${
                    isEditing ? 'border-primary/60 brightness-110' : cfg.color
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                      W{week}
                    </span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Planned action label */}
                  <div className="text-[11px] font-medium leading-tight">
                    {plan.type === 'tournament' && plannedTournament
                      ? <span className="truncate block">{plannedTournament.name}</span>
                      : plan.type === 'tournament'
                        ? 'Tournament'
                        : plan.type === 'training'
                          ? <span className="truncate block">{trainingOption ? `${trainingOption.icon} ${trainingOption.label.replace(' Training', '')}` : 'Training'}</span>
                          : plan.type === 'rest'
                            ? 'Rest'
                            : <span className="opacity-50">Open</span>
                    }
                  </div>

                  {/* Available tournaments count */}
                  {weekTournaments.length > 0 && plan.type === 'unplanned' && (
                    <div className="text-[10px] text-muted-foreground mt-1 opacity-70">
                      {weekTournaments.length} tournament{weekTournaments.length > 1 ? 's' : ''}
                    </div>
                  )}
                  {plannedTournament && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 opacity-70">
                      {getSurfaceEmoji(plannedTournament.surface)} {plannedTournament.surface}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                      <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">NOW</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Editing panel — floating sticky */}
      {editingWeek !== null && editingPlan && (
        <div className="sticky bottom-4 z-30">
          <div className="glass-card p-4 border border-primary/40 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">
                Week {editingWeek} — {MONTHS.find(m => m.weeks.includes(editingWeek))?.name}
              </span>
              <button onClick={() => setEditingWeek(null)}>
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {/* Action type buttons */}
            <div className="flex gap-2 flex-wrap mb-3">
              {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][])
                .filter(([k]) => k !== 'unplanned')
                .map(([type, cfg]) => {
                  const Icon = cfg.icon;
                  const isSelected = editingPlan.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        updateWeekPlan(editingWeek, type, type === 'tournament' ? editingPlan.tournamentId : undefined, type === 'training' ? (editingPlan.trainingType || 'serve') : undefined);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all ${
                        isSelected ? cfg.color + ' font-semibold' : 'bg-secondary/30 text-muted-foreground border-border/30 hover:border-primary/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              <button
                onClick={() => clearWeek(editingWeek)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border bg-secondary/30 text-muted-foreground border-border/30 hover:border-destructive/30 hover:text-destructive transition-all ml-auto"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            {/* Training type picker */}
            {editingPlan.type === 'training' && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground mb-2">Select training focus:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {TRAINING_OPTIONS.map(o => {
                    const isSelected = editingPlan.trainingType === o.type;
                    return (
                      <button
                        key={o.type}
                        onClick={() => updateWeekPlan(editingWeek, 'training', undefined, o.type)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                            : 'bg-secondary/20 border-border/30 text-foreground hover:border-primary/30'
                        }`}
                      >
                        <span className="text-base leading-none">{o.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{o.label.replace(' Training', '')}</div>
                          <div className="text-muted-foreground">${o.moneyCost.toLocaleString()}</div>
                        </div>
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tournament picker */}
            {editingPlan.type === 'tournament' && editingTournaments.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground mb-2">Select tournament for this week:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingTournaments.map(t => {
                    const isSelected = editingPlan.tournamentId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateWeekPlan(editingWeek, 'tournament', t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-secondary/20 border-border/30 text-foreground hover:border-primary/30'
                        }`}
                      >
                        <span className={`shrink-0 ${getCategoryColor(t.category)} !text-[9px]`}>{t.category}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-muted-foreground">{getSurfaceEmoji(t.surface)} {t.city}, {t.country}</div>
                        </div>
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {editingPlan.type === 'tournament' && editingTournaments.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No tournaments scheduled for week {editingWeek}.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingRoadmap;
