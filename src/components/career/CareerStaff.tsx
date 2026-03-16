import React from 'react';
import { CareerPlayer, StaffMember, AVAILABLE_STAFF } from '@/data/careerData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, DollarSign, Zap, Heart, Shield, Brain } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  onHire: (member: StaffMember) => void;
  onFire: (memberId: string) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  coach: <Brain className="w-4 h-4" />,
  fitness: <Zap className="w-4 h-4" />,
  physio: <Heart className="w-4 h-4" />,
  mental: <Shield className="w-4 h-4" />,
};

const roleLabels: Record<string, string> = {
  coach: 'Coach',
  fitness: 'Fitness',
  physio: 'Physio',
  mental: 'Mental',
};

const qualityColors: Record<string, string> = {
  basic: 'text-muted-foreground',
  pro: 'text-blue-400',
  elite: 'text-primary',
};

const CareerStaff: React.FC<Props> = ({ player, onHire, onFire }) => {
  const activeRoles = new Set(player.staff.map(s => s.member.role));
  const activeIds = new Set(player.staff.map(s => s.member.id));

  const handleHire = (member: StaffMember) => {
    if (activeRoles.has(member.role)) {
      toast.error(`You already have a ${roleLabels[member.role]}. Fire them first.`);
      return;
    }
    onHire(member);
    toast.success(`Hired ${member.name}!`);
  };

  const weeklyCost = player.staff.reduce((sum, s) => sum + s.member.weeklyCost, 0);

  return (
    <div className="space-y-4">
      {/* Active Staff */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-foreground">👥 Your Staff</h2>
          {weeklyCost > 0 && <span className="text-xs text-destructive">Weekly cost: ${weeklyCost.toLocaleString()}</span>}
        </div>
        {player.staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff hired. Hire specialists below to improve training, recovery, and injury prevention.</p>
        ) : (
          <div className="space-y-3">
            {player.staff.map(s => (
              <div key={s.member.id} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      {roleIcons[s.member.role]}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{s.member.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{roleLabels[s.member.role]}</Badge>
                        <span className={qualityColors[s.member.quality]}>{s.member.quality.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-destructive">${s.member.weeklyCost.toLocaleString()}/w</span>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { onFire(s.member.id); toast.info(`${s.member.name} has been let go.`); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  {s.member.effects.trainingEfficiency && s.member.effects.trainingEfficiency > 1 && (
                    <span className="text-green-400">Training ×{s.member.effects.trainingEfficiency}</span>
                  )}
                  {s.member.effects.recoveryBonus && <span className="text-blue-400">Recovery +{s.member.effects.recoveryBonus}</span>}
                  {s.member.effects.fatigueReduction && <span className="text-cyan-400">Fatigue -{s.member.effects.fatigueReduction}</span>}
                  {s.member.effects.injuryPrevention && <span className="text-purple-400">Injury prevention {Math.round((s.member.effects.injuryPrevention || 0) * 100)}%</span>}
                  {s.member.effects.mentalBonus && <span className="text-yellow-400">Mental +{s.member.effects.mentalBonus}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Staff by Role */}
      {(['coach', 'fitness', 'physio', 'mental'] as const).map(role => (
        <div key={role} className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            {roleIcons[role]} {roleLabels[role]} Options
            {activeRoles.has(role) && <Badge variant="outline" className="text-[10px] text-green-400"><Check className="w-3 h-3 mr-1" />Hired</Badge>}
          </h3>
          <div className="space-y-2">
            {AVAILABLE_STAFF.filter(s => s.role === role).map(member => {
              const isActive = activeIds.has(member.id);
              const roleOccupied = activeRoles.has(role) && !isActive;

              return (
                <div key={member.id} className={`p-3 rounded-lg border transition-all ${isActive ? 'bg-primary/5 border-primary/30' : roleOccupied ? 'opacity-50 bg-muted/20 border-border/20' : 'bg-secondary/20 border-border/50 hover:border-primary/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{member.name}</span>
                        <span className={`text-xs font-medium ${qualityColors[member.quality]}`}>{member.quality.toUpperCase()}</span>
                        {isActive && <Badge variant="outline" className="text-[10px] text-green-400">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{member.description}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                        <span className="text-destructive">${member.weeklyCost.toLocaleString()}/week</span>
                        {member.effects.trainingEfficiency && member.effects.trainingEfficiency > 1 && <span className="text-green-400">Training ×{member.effects.trainingEfficiency}</span>}
                        {member.effects.recoveryBonus && <span className="text-blue-400">Recovery +{member.effects.recoveryBonus}</span>}
                        {member.effects.fatigueReduction && <span className="text-cyan-400">Fatigue -{member.effects.fatigueReduction}</span>}
                        {member.effects.injuryPrevention && <span className="text-purple-400">Injury prev. {Math.round(member.effects.injuryPrevention * 100)}%</span>}
                        {member.effects.mentalBonus && <span className="text-yellow-400">Mental +{member.effects.mentalBonus}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isActive || roleOccupied}
                      onClick={() => handleHire(member)}
                      className="ml-3"
                    >
                      Hire
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CareerStaff;
