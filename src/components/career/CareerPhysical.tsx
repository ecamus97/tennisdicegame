import React from 'react';
import { CareerPlayer } from '@/data/careerData';
import { Progress } from '@/components/ui/progress';
import { Heart, Zap, Activity, Plane, Dumbbell, AlertTriangle, Users } from 'lucide-react';

interface Props {
  player: CareerPlayer;
}

const CareerPhysical: React.FC<Props> = ({ player }) => {
  const bars = [
    { label: 'Energy', value: player.energy, icon: <Zap className="w-4 h-4" />, good: true },
    { label: 'Fatigue', value: player.fatigue, icon: <Activity className="w-4 h-4" />, good: false },
    { label: 'Travel Fatigue', value: player.travelFatigue, icon: <Plane className="w-4 h-4" />, good: false },
    { label: 'Match Load', value: Math.min(100, player.matchLoad * 10), icon: <Dumbbell className="w-4 h-4" />, good: false },
    { label: 'Recovery', value: player.attributes.recovery, icon: <Heart className="w-4 h-4" />, good: true },
  ];

  const getColor = (value: number, good: boolean) => {
    if (good) return value > 60 ? 'text-green-400' : value > 30 ? 'text-yellow-400' : 'text-red-400';
    return value < 30 ? 'text-green-400' : value < 60 ? 'text-yellow-400' : 'text-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">❤️ Physical Status</h2>
        <div className="space-y-4">
          {bars.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-foreground flex items-center gap-2">{b.icon} {b.label}</span>
                <span className={`text-sm font-medium ${getColor(b.value, b.good)}`}>{Math.round(b.value)}%</span>
              </div>
              <Progress value={b.value} className="h-3" />
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-xs text-muted-foreground">Consecutive Weeks Playing</div>
            <div className="text-lg font-display font-bold text-foreground">{player.consecutiveWeeksPlaying}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-xs text-muted-foreground">Weeks Since Rest</div>
            <div className="text-lg font-display font-bold text-foreground">{player.weeksSinceRest}</div>
          </div>
        </div>
      </div>

      {/* Staff Physical Effects */}
      {player.staff.length > 0 && (() => {
        const fatigueRed = player.staff.reduce((s, m) => s + (m.member.effects.fatigueReduction || 0), 0);
        const recoveryBon = player.staff.reduce((s, m) => s + (m.member.effects.recoveryBonus || 0), 0);
        const physicalPerWk = player.staff.reduce((s, m) => s + (m.member.effects.weeklyPhysical || 0), 0);
        const hasAny = fatigueRed > 0 || recoveryBon > 0 || physicalPerWk > 0;
        if (!hasAny) return null;
        return (
          <div className="glass-card p-4">
            <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Staff Physical Benefits
            </h3>
            <div className="space-y-2">
              {fatigueRed > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fatigue reduction / week</span>
                  <span className="text-green-400 font-medium">−{fatigueRed} pts</span>
                </div>
              )}
              {recoveryBon > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recovery bonus (Rest weeks)</span>
                  <span className="text-green-400 font-medium">+{recoveryBon} pts</span>
                </div>
              )}
              {physicalPerWk > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Physical attribute / week</span>
                  <span className="text-blue-400 font-medium">+{physicalPerWk} pts/wk</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Applied automatically each week when advancing.</p>
          </div>
        );
      })()}

      {player.injured && (
        <div className="glass-card p-4 border-destructive/30">
          <h3 className="font-display font-semibold text-destructive mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Current Injury
          </h3>
          <p className="text-sm text-foreground">{player.injuryType}</p>
          <p className="text-xs text-muted-foreground">{player.injuryWeeksRemaining} week(s) remaining</p>
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-3">🏥 Injury History</h3>
        {player.injuryHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground">No injuries recorded</p>
        ) : (
          <div className="space-y-1.5">
            {player.injuryHistory.slice().reverse().map((inj, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20">
                <span className="text-foreground">{inj.type}</span>
                <div className="flex gap-2 text-muted-foreground">
                  <span>{inj.duration}w</span>
                  <span>S{inj.season} W{inj.week}</span>
                  <span>{inj.cause}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerPhysical;
