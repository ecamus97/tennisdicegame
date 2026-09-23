import React from 'react';
import { CareerPlayer, CareerAttributes, ATTRIBUTE_MAX, getDPCost, powerScoreToFictionalRanking, getEffectiveFictionalRanking } from '@/data/careerData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Users } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  onSpendDP: (attribute: keyof CareerAttributes, points: number) => void;
}

const STAFF_WEEKLY_EFFECTS: Partial<Record<keyof CareerAttributes, string>> = {
  serve: 'weeklyServe',
  return: 'weeklyReturn',
  rally: 'weeklyRally',
  mentality: 'weeklyMentality',
  physical: 'weeklyPhysical',
  consistency: 'weeklyConsistency',
  pressure: 'weeklyPressure',
  recovery: 'weeklyRecovery',
};

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
  const effectiveRank = getEffectiveFictionalRanking(player);
  const rankDiff = fictionalRank - effectiveRank; // positive = currently better than base

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
              <div className="flex items-center justify-end gap-1">
                <div className="text-lg font-display font-bold text-green-400">#{fictionalRank}</div>
                {rankDiff !== 0 && <span className={rankDiff > 0 ? 'text-green-400 text-xs' : 'text-red-400 text-xs'} title={`Effective rank with form/fatigue: #${effectiveRank}`}>{rankDiff > 0 ? '↑' : '↓'}</span>}
              </div>
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

        {/* Staff Development Effects */}
        {player.staff.length > 0 && (() => {
          const trainingMult = player.staff.reduce((m, s) => m * (s.member.effects.trainingEfficiency || 1), 1);
          const sponsorPenalty = player.sponsors.reduce((p, s) => p + (s.sponsor.trainingEfficiencyPenalty || 0), 0);
          const effectiveMult = trainingMult * Math.max(0.5, 1 - sponsorPenalty);
          const weeklyBonuses = Object.entries(STAFF_WEEKLY_EFFECTS).map(([attr, effectKey]) => {
            const total = player.staff.reduce((sum, s) => sum + ((s.member.effects as any)[effectKey] || 0), 0);
            return { attr, total };
          }).filter(b => b.total > 0);
          const hasAny = effectiveMult > 1 || weeklyBonuses.length > 0;
          if (!hasAny) return null;
          const ATTR_NAMES: Record<string, string> = { serve: 'Serve', return: 'Return', rally: 'Rally', mentality: 'Mentality', physical: 'Physical', consistency: 'Consistency', pressure: 'Pressure', recovery: 'Recovery' };
          return (
            <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Staff Development Effects</span>
              </div>
              <div className="space-y-1">
                {effectiveMult > 1 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Training efficiency</span>
                    <span className="text-green-400 font-medium">× {effectiveMult.toFixed(2)} on all sessions</span>
                  </div>
                )}
                {sponsorPenalty > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sponsor penalty</span>
                    <span className="text-red-400 font-medium">−{Math.round(sponsorPenalty * 100)}% efficiency</span>
                  </div>
                )}
                {weeklyBonuses.map(b => (
                  <div key={b.attr} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{ATTR_NAMES[b.attr] || b.attr} / week (auto)</span>
                    <span className="text-blue-400 font-medium">+{b.total} pts/wk</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
                {(() => {
                  const effectKey = STAFF_WEEKLY_EFFECTS[key];
                  if (!effectKey) return null;
                  const bonus = player.staff.reduce((sum, s) => sum + ((s.member.effects as any)[effectKey] || 0), 0);
                  if (!bonus) return null;
                  return <span className="text-[10px] text-blue-400 ml-1">+{bonus}/wk</span>;
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerDevelopment;
