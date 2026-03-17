import React, { useState, useMemo } from 'react';
import { CareerPlayer, TrainingType, TRAINING_OPTIONS, PRIZE_MONEY, CITY_DATA, calculateTravelDistance, getTravelCost, getTravelFatigue, powerScoreToFictionalRanking } from '@/data/careerData';
import { Tournament, Surface, getSurfaceEmoji, getCategoryColor } from '@/data/players';
import { getCareerEligibleCategories, canEnterAsWildCard } from '@/lib/tournamentEntryLogic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MapPin, Plane, Dumbbell, BedDouble, Trophy, TrendingUp, Heart, Zap, Activity,
  AlertTriangle, Calendar, Play, FastForward
} from 'lucide-react';

interface Props {
  player: CareerPlayer;
  currentWeek: number;
  currentSeason: number;
  weeklyActionTaken: boolean;
  onEnterTournament: (tournamentId: string) => void;
  onQuickSimTournament: (tournamentId: string) => void;
  onTrain: (type: TrainingType, surface?: Surface) => void;
  onRest: () => void;
  completedTournaments: string[];
  allTournaments: Tournament[];
}

const CareerDashboard: React.FC<Props> = ({
  player, currentWeek, currentSeason, weeklyActionTaken,
  onEnterTournament, onQuickSimTournament, onTrain, onRest, completedTournaments, allTournaments,
}) => {
  const [selectedTraining, setSelectedTraining] = useState<TrainingType>('serve');
  const [surfaceTarget, setSurfaceTarget] = useState<Surface>('Hard');

  // Get eligible categories for the player's ranking
  const eligibleCategories = useMemo(() => getCareerEligibleCategories(player.officialRanking), [player.officialRanking]);

  const weekTournaments = useMemo(() => {
    const all = allTournaments.filter(t => t.week === currentWeek && !['Davis Cup', 'Laver Cup', 'ATP Finals'].includes(t.category));
    // Filter to only eligible tournaments or wild card eligible
    return all.filter(t => 
      eligibleCategories.includes(t.category) || canEnterAsWildCard(player.countryCode, t.country)
    );
  }, [currentWeek, allTournaments, eligibleCategories, player.countryCode]);

  const fictionalRank = powerScoreToFictionalRanking(player.fictionalRankingScore);

  const handleTrain = () => {
    const option = TRAINING_OPTIONS.find(t => t.type === selectedTraining);
    if (!option) return;
    if (player.money < option.moneyCost) { toast.error('Not enough money for training!'); return; }
    onTrain(selectedTraining, selectedTraining === 'surface' ? surfaceTarget : undefined);
    toast.success(`Training completed: ${option.label}`);
  };

  const handleRest = () => { onRest(); toast.success('You rested this week. Energy restored!'); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Status Bar */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground text-lg">
              {player.firstName} {player.lastName}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{player.countryCode}</Badge>
              <Badge variant="outline" className="text-xs">Age {player.age}</Badge>
              <Badge variant="outline" className="text-xs">{player.hand}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-secondary/30">
              <div className="text-xs text-muted-foreground">Official Rank</div>
              <div className="text-xl font-display font-bold text-foreground">#{player.officialRanking}</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <div className="text-xs text-muted-foreground">Fictional Rank</div>
              <div className="text-xl font-display font-bold text-primary">#{fictionalRank}</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <div className="text-xs text-muted-foreground">Live Points</div>
              <div className="text-xl font-display font-bold text-accent">{player.livePoints.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30">
              <div className="text-xs text-muted-foreground">Level {player.level}</div>
              <Progress value={(player.xp / player.xpToNextLevel) * 100} className="h-2 mt-1" />
              <div className="text-[10px] text-muted-foreground mt-1">{player.xp}/{player.xpToNextLevel} XP</div>
            </div>
          </div>

          {/* Physical bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> Energy</span>
                <span className={player.energy > 50 ? 'text-green-400' : player.energy > 25 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(player.energy)}%
                </span>
              </div>
              <Progress value={player.energy} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1"><Activity className="w-3 h-3" /> Fatigue</span>
                <span className={player.fatigue < 40 ? 'text-green-400' : player.fatigue < 70 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(player.fatigue)}%
                </span>
              </div>
              <Progress value={player.fatigue} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Form</span>
                <span className={player.form > 0 ? 'text-green-400' : player.form < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                  {player.form > 0 ? '+' : ''}{player.form}
                </span>
              </div>
              <Progress value={50 + player.form * 2.5} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1"><Plane className="w-3 h-3" /> Travel</span>
                <span className={player.travelFatigue < 30 ? 'text-green-400' : player.travelFatigue < 60 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(player.travelFatigue)}%
                </span>
              </div>
              <Progress value={player.travelFatigue} className="h-2" />
            </div>
          </div>

          {player.injured && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{player.injuryType} — {player.injuryWeeksRemaining} week(s) remaining</span>
            </div>
          )}
        </div>

        {/* Weekly Action */}
        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Week {currentWeek} — Choose Your Action
          </h3>

          {weeklyActionTaken ? (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
              <p className="text-sm text-primary font-medium">✅ Action completed this week</p>
              <p className="text-xs text-muted-foreground mt-1">Advance to next week to continue</p>
            </div>
          ) : player.injured ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
              <p className="text-sm text-destructive">🤕 You're injured and can't compete</p>
              <Button size="sm" variant="secondary" onClick={handleRest} className="mt-2">
                <BedDouble className="w-4 h-4 mr-1" /> Rest & Recover
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tournaments */}
              {weekTournaments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Available Tournaments
                  </h4>
                  <div className="space-y-2">
                    {weekTournaments.map(t => {
                      const isCompleted = completedTournaments.includes(t.id);
                      const distance = calculateTravelDistance(player.currentCity, t.city);
                      const cost = getTravelCost(distance);
                      const cityData = CITY_DATA[t.city];
                      const fatigue = getTravelFatigue(distance, player.currentContinent, cityData?.continent || 'Europe');
                      const prize = PRIZE_MONEY[t.category];

                      return (
                        <div key={t.id} className={`p-3 rounded-lg border transition-all ${isCompleted ? 'bg-muted/30 border-border/30 opacity-60' : 'bg-secondary/20 border-border/50 hover:border-primary/30'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={getCategoryColor(t.category) + ' !text-[10px]'}>{t.category}</span>
                                <span className="font-medium text-sm text-foreground">{t.name}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.city}, {t.country}</span>
                                <span>{getSurfaceEmoji(t.surface)} {t.surface}</span>
                                <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{Math.round(distance)} km</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="text-destructive">Travel: ${cost.toLocaleString()}</span>
                                <span className="text-yellow-400">Fatigue: +{fatigue}</span>
                                <span className="text-accent">Winner: ${prize?.winner.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <Button
                                size="sm"
                                disabled={isCompleted || weeklyActionTaken}
                                onClick={() => onEnterTournament(t.id)}
                                className="gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Play
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={isCompleted || weeklyActionTaken}
                                onClick={() => {
                                  onQuickSimTournament(t.id);
                                  toast.info(`Simulating ${t.name}...`);
                                }}
                                className="gap-1"
                              >
                                <FastForward className="w-3 h-3" />
                                Sim
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {weekTournaments.length === 0 && (
                <div className="p-4 rounded-lg bg-secondary/20 text-center">
                  <p className="text-sm text-muted-foreground">No tournaments this week</p>
                </div>
              )}

              {/* Training */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5" /> Training
                </h4>
                <div className="flex items-center gap-2">
                  <Select value={selectedTraining} onValueChange={v => setSelectedTraining(v as TrainingType)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRAINING_OPTIONS.map(o => (
                        <SelectItem key={o.type} value={o.type}>
                          {o.icon} {o.label} (${o.moneyCost.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTraining === 'surface' && (
                    <Select value={surfaceTarget} onValueChange={v => setSurfaceTarget(v as Surface)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="Clay">Clay</SelectItem>
                        <SelectItem value="Grass">Grass</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button size="sm" variant="secondary" onClick={handleTrain} disabled={weeklyActionTaken}>Train</Button>
                </div>
              </div>

              {/* Rest */}
              <Button variant="outline" className="w-full gap-2" onClick={handleRest} disabled={weeklyActionTaken}>
                <BedDouble className="w-4 h-4" /> Rest This Week
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">📊 Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">W/L</span><span className="text-foreground">{player.stats.wins}-{player.stats.losses}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Titles</span><span className="text-foreground">{player.stats.titlesWon}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tournaments</span><span className="text-foreground">{player.stats.tournamentsPlayed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Best Ranking</span><span className="text-foreground">#{player.stats.bestRanking}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Dev Points</span><span className="text-primary">{player.developmentPoints}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Money</span><span className="text-accent">${player.money.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Official Pts</span><span className="text-foreground">{player.officialPoints.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">📍 Location</h3>
          <div className="text-sm">
            <p className="text-foreground">{player.currentCity}, {player.currentCountry}</p>
            <p className="text-xs text-muted-foreground">{player.currentContinent}</p>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">🔥 Momentum</h3>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`h-3 flex-1 rounded-sm ${i < player.momentum ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{player.momentum}/10</p>
        </div>

        {/* Active Sponsors */}
        {player.sponsors.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-display font-semibold text-foreground mb-3">🤝 Sponsors</h3>
            <div className="space-y-1.5">
              {player.sponsors.map(s => (
                <div key={s.sponsor.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.sponsor.name}</span>
                  <span className="text-muted-foreground">{s.weeksRemaining}w left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results */}
        <div className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">📋 Recent</h3>
          {player.seasonHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tournaments played yet</p>
          ) : (
            <div className="space-y-1.5">
              {player.seasonHistory.slice(-5).reverse().map((e, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate flex-1">{e.tournamentName}</span>
                  <span className={`ml-2 font-medium ${e.round === 'Winner' ? 'text-primary' : 'text-muted-foreground'}`}>{e.round}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerDashboard;
