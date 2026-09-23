import React, { useState } from 'react';
import { CareerPlayer, Sponsor, SponsorCategory, AVAILABLE_SPONSORS } from '@/data/careerData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, DollarSign, Trophy, Plane, Lock, Zap, Battery } from 'lucide-react';

const CATEGORY_ICONS: Record<SponsorCategory, string> = {
  Equipment: '🎾',
  Apparel: '👕',
  Technology: '💻',
  Beverage: '🥤',
  Financial: '💳',
  Travel: '✈️',
  Watch: '⌚',
  Automotive: '🚗',
};

const ALL_CATEGORIES: SponsorCategory[] = ['Equipment', 'Apparel', 'Technology', 'Beverage', 'Financial', 'Travel', 'Watch', 'Automotive'];

interface Props {
  player: CareerPlayer;
  onSign: (sponsor: Sponsor) => void;
  onCancel: (sponsorId: string) => void;
}

const CareerSponsors: React.FC<Props> = ({ player, onSign, onCancel }) => {
  const [activeCategory, setActiveCategory] = useState<SponsorCategory>('Equipment');
  const activeSponsorIds = new Set(player.sponsors.map(s => s.sponsor.id));
  const activeCategoryIds = new Set(player.sponsors.map(s => s.sponsor.category));

  const handleSign = (sponsor: Sponsor) => {
    if (player.officialRanking > sponsor.minRanking) {
      toast.error(`You need to be ranked #${sponsor.minRanking} or better to sign with ${sponsor.name}`);
      return;
    }
    if (activeCategoryIds.has(sponsor.category)) {
      toast.error(`You already have a ${sponsor.category} sponsor. Cancel it first.`);
      return;
    }
    onSign(sponsor);
    toast.success(`Signed with ${sponsor.name}!`);
  };

  const filteredSponsors = AVAILABLE_SPONSORS.filter(s => s.category === activeCategory);
  const categoryActive = player.sponsors.find(s => s.sponsor.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Active Sponsors */}
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-3">🤝 Active Sponsors</h2>
        {player.sponsors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sponsors. Sign deals below to earn income!</p>
        ) : (
          <div className="space-y-3">
            {player.sponsors.map(s => (
              <div key={s.sponsor.id} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[s.sponsor.category as SponsorCategory]}</span>
                      <div>
                        <span className="font-medium text-foreground">{s.sponsor.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{s.sponsor.category}</span>
                      </div>
                    </div>
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
                  {s.sponsor.weeklyFatigueIncrease && <span className="flex items-center gap-1 text-orange-400"><Zap className="w-3 h-3" />+{s.sponsor.weeklyFatigueIncrease} fatigue/wk</span>}
                  {s.sponsor.weeklyEnergyDrain && <span className="flex items-center gap-1 text-red-400"><Battery className="w-3 h-3" />-{s.sponsor.weeklyEnergyDrain} energy/wk</span>}
                  {s.sponsor.trainingEfficiencyPenalty && <span className="text-red-400">-{Math.round(s.sponsor.trainingEfficiencyPenalty * 100)}% training</span>}
                  <span className="text-muted-foreground">{s.weeksRemaining}w left · Earned: ${s.totalEarned.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-3">📋 Available Sponsors</h2>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ALL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const hasDeal = activeCategoryIds.has(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : hasDeal
                    ? 'bg-green-500/10 text-green-400 border-green-500/30'
                    : 'bg-secondary/30 text-muted-foreground border-border/40 hover:border-primary/40'
                }`}
              >
                {CATEGORY_ICONS[cat]} {cat}
                {hasDeal && <Check className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>

        {/* Category slot status */}
        {categoryActive ? (
          <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
            ✓ Active deal: <span className="font-medium">{categoryActive.sponsor.name}</span> — {categoryActive.weeksRemaining}w remaining
          </div>
        ) : (
          <div className="mb-3 px-3 py-2 rounded-lg bg-secondary/20 border border-border/30 text-xs text-muted-foreground">
            No {activeCategory} sponsor — sign one below
          </div>
        )}

        {/* Sponsor list for selected category */}
        <div className="space-y-3">
          {filteredSponsors.map(sponsor => {
            const isActive = activeSponsorIds.has(sponsor.id);
            const isEligible = player.officialRanking <= sponsor.minRanking;
            const categoryBlocked = !isActive && activeCategoryIds.has(sponsor.category);

            return (
              <div key={sponsor.id} className={`p-3 rounded-lg border transition-all ${
                isActive ? 'bg-green-500/5 border-green-500/30' :
                categoryBlocked ? 'bg-muted/10 border-border/20 opacity-40' :
                isEligible ? 'bg-secondary/20 border-border/50 hover:border-primary/30' :
                'bg-muted/20 border-border/20 opacity-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{CATEGORY_ICONS[sponsor.category]}</span>
                      <span className="font-medium text-foreground">{sponsor.name}</span>
                      {isActive && <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Active</Badge>}
                      {!isEligible && <Badge variant="outline" className="text-[10px] text-destructive"><Lock className="w-3 h-3 mr-1" />Rank #{sponsor.minRanking}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{sponsor.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                      <span className="text-green-400">${sponsor.weeklyIncome}/wk</span>
                      {sponsor.winBonus > 0 && <span className="text-accent">${sponsor.winBonus}/win</span>}
                      {sponsor.titleBonus > 0 && <span className="text-primary">${sponsor.titleBonus.toLocaleString()}/title</span>}
                      {sponsor.travelDiscount > 0 && <span className="text-blue-400">-{Math.round(sponsor.travelDiscount * 100)}% travel</span>}
                      {sponsor.weeklyFatigueIncrease && <span className="text-orange-400">+{sponsor.weeklyFatigueIncrease} fatigue/wk</span>}
                      {sponsor.weeklyEnergyDrain && <span className="text-red-400">-{sponsor.weeklyEnergyDrain} energy/wk</span>}
                      {sponsor.trainingEfficiencyPenalty && <span className="text-red-400">-{Math.round(sponsor.trainingEfficiencyPenalty * 100)}% training</span>}
                      <span className="text-muted-foreground">{sponsor.duration}w contract</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={isActive || !isEligible || categoryBlocked}
                    onClick={() => handleSign(sponsor)}
                    className="ml-3 shrink-0"
                  >
                    {isActive ? 'Active' : categoryBlocked ? 'Taken' : 'Sign'}
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
