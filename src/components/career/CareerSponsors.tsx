import React from 'react';
import { CareerPlayer, Sponsor, AVAILABLE_SPONSORS } from '@/data/careerData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, DollarSign, Trophy, Plane, Lock } from 'lucide-react';

interface Props {
  player: CareerPlayer;
  onSign: (sponsor: Sponsor) => void;
  onCancel: (sponsorId: string) => void;
}

const CareerSponsors: React.FC<Props> = ({ player, onSign, onCancel }) => {
  const activeSponsorIds = new Set(player.sponsors.map(s => s.sponsor.id));

  const handleSign = (sponsor: Sponsor) => {
    if (player.officialRanking > sponsor.minRanking) {
      toast.error(`You need to be ranked #${sponsor.minRanking} or better to sign with ${sponsor.name}`);
      return;
    }
    onSign(sponsor);
    toast.success(`Signed with ${sponsor.name}!`);
  };

  return (
    <div className="space-y-4">
      {/* Active Sponsors */}
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">🤝 Active Sponsors</h2>
        {player.sponsors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sponsors. Sign deals below to earn income!</p>
        ) : (
          <div className="space-y-3">
            {player.sponsors.map(s => (
              <div key={s.sponsor.id} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{s.sponsor.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.sponsor.description}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { onCancel(s.sponsor.id); toast.info(`Contract with ${s.sponsor.name} cancelled.`); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />${s.sponsor.weeklyIncome}/week</span>
                  {s.sponsor.winBonus > 0 && <span className="flex items-center gap-1 text-accent"><Trophy className="w-3 h-3" />${s.sponsor.winBonus}/win</span>}
                  {s.sponsor.travelDiscount > 0 && <span className="flex items-center gap-1 text-blue-400"><Plane className="w-3 h-3" />-{Math.round(s.sponsor.travelDiscount * 100)}% travel</span>}
                  <span className="text-muted-foreground">{s.weeksRemaining} weeks remaining</span>
                  <span className="text-muted-foreground">Earned: ${s.totalEarned.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Sponsors */}
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">📋 Available Sponsors</h2>
        <div className="space-y-3">
          {AVAILABLE_SPONSORS.map(sponsor => {
            const isActive = activeSponsorIds.has(sponsor.id);
            const isEligible = player.officialRanking <= sponsor.minRanking;

            return (
              <div key={sponsor.id} className={`p-3 rounded-lg border transition-all ${isActive ? 'bg-primary/5 border-primary/30 opacity-60' : isEligible ? 'bg-secondary/20 border-border/50 hover:border-primary/30' : 'bg-muted/20 border-border/20 opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{sponsor.name}</span>
                      {isActive && <Badge variant="outline" className="text-[10px]"><Check className="w-3 h-3 mr-1" />Active</Badge>}
                      {!isEligible && <Badge variant="outline" className="text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1" />Rank #{sponsor.minRanking} required</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{sponsor.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      <span className="text-green-400">${sponsor.weeklyIncome}/week</span>
                      {sponsor.winBonus > 0 && <span className="text-accent">${sponsor.winBonus}/win</span>}
                      {sponsor.titleBonus > 0 && <span className="text-primary">${sponsor.titleBonus.toLocaleString()}/title</span>}
                      {sponsor.travelDiscount > 0 && <span className="text-blue-400">-{Math.round(sponsor.travelDiscount * 100)}% travel</span>}
                      <span className="text-muted-foreground">{sponsor.duration} weeks</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={isActive || !isEligible}
                    onClick={() => handleSign(sponsor)}
                    className="ml-3"
                  >
                    Sign
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CareerSponsors;
