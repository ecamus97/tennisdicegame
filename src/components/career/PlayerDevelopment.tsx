import React from 'react';
import { CareerPlayer, CareerAttributes, ATTRIBUTE_MAX, getDPCost, powerScoreToFictionalRanking } from '@/data/careerData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  onSpendDP: (attribute: keyof CareerAttributes, points: number) => void;
}

const ATTR_LABELS: { key: keyof CareerAttributes; label: string; icon: string }[] = [
  { key: 'serve', label: 'Serve', icon: '🎾' },
  { key: 'return', label: 'Return', icon: '🏓' },
  { key: 'rally', label: 'Rally', icon: '🔄' },
  { key: 'mentality', label: 'Mentality', icon: '🧠' },
  { key: 'physical', label: 'Physical', icon: '💪' },
  { key: 'consistency', label: 'Consistency', icon: '📊' },
  { key: 'pressure', label: 'Pressure', icon: '🎯' },
  { key: 'recovery', label: 'Recovery', icon: '🧘' },
  { key: 'surfaceHard', label: 'Hard Court', icon: '🔵' },
  { key: 'surfaceClay', label: 'Clay Court', icon: '🟤' },
  { key: 'surfaceGrass', label: 'Grass Court', icon: '🟢' },
];

const PlayerDevelopment: React.FC<Props> = ({ player, onSpendDP }) => {
  const fictionalRank = powerScoreToFictionalRanking(player.fictionalRankingScore);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">🌟 Player Development</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Level</div>
              <div className="text-lg font-display font-bold text-foreground">{player.level}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Dev Points</div>
              <div className="text-lg font-display font-bold text-primary">{player.developmentPoints}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Power Score</div>
              <div className="text-lg font-display font-bold text-accent">{player.fictionalRankingScore}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Fictional Rank</div>
              <div className="text-lg font-display font-bold text-green-400">#{fictionalRank}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>XP Progress</span>
            <span>{player.xp}/{player.xpToNextLevel}</span>
          </div>
          <Progress value={(player.xp / player.xpToNextLevel) * 100} className="h-2" />
        </div>

        <div className="mb-4 p-3 rounded-lg bg-secondary/30">
          <p className="text-xs text-muted-foreground">
            Improving attributes increases your Power Score, which lowers your Fictional Ranking number (better player = lower rank).
            A new player starts around #{powerScoreToFictionalRanking(25)}. Elite players reach the top 20.
          </p>
        </div>

        <div className="space-y-3">
          {ATTR_LABELS.map(({ key, label, icon }) => {
            const value = player.attributes[key];
            const cost = getDPCost(value);
            const canUpgrade = player.developmentPoints >= cost && value < ATTRIBUTE_MAX;

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-6 text-center">{icon}</span>
                <span className="text-sm text-foreground w-24">{label}</span>
                <div className="flex-1">
                  <Progress value={(value / ATTRIBUTE_MAX) * 100} className="h-3" />
                </div>
                <span className="text-sm font-mono font-medium text-foreground w-8 text-right">{value}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  disabled={!canUpgrade}
                  onClick={() => onSpendDP(key, 1)}
                  title={`Cost: ${cost} DP`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] text-muted-foreground w-10">{cost} DP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerDevelopment;
