import React from 'react';
import { CareerPlayer } from '@/data/careerData';
import { Check, Circle } from 'lucide-react';

interface Props {
  player: CareerPlayer;
}

const CareerObjectives: React.FC<Props> = ({ player }) => {
  const completed = player.objectives.filter(o => o.completed);
  const pending = player.objectives.filter(o => !o.completed);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">🎯 Career Objectives</h2>
        <div className="text-sm text-muted-foreground mb-4">
          {completed.length}/{player.objectives.length} completed
        </div>

        <div className="space-y-2">
          {pending.map(obj => (
            <div key={obj.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30">
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{obj.title}</div>
                <div className="text-xs text-muted-foreground">{obj.description}</div>
              </div>
              <div className="text-right shrink-0">
                {obj.reward.dp && <div className="text-[10px] text-primary">+{obj.reward.dp} DP</div>}
                {obj.reward.xp && <div className="text-[10px] text-accent">+{obj.reward.xp} XP</div>}
                {obj.reward.money && <div className="text-[10px] text-green-400">+${obj.reward.money.toLocaleString()}</div>}
              </div>
            </div>
          ))}
        </div>

        {completed.length > 0 && (
          <>
            <h3 className="font-display font-semibold text-foreground mt-6 mb-3">✅ Completed</h3>
            <div className="space-y-2">
              {completed.map(obj => (
                <div key={obj.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{obj.title}</div>
                    <div className="text-xs text-muted-foreground">{obj.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CareerObjectives;
