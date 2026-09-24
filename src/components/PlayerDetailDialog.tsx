import React, { useState, useEffect } from "react";
import { Player, Surface, SurfaceAffinity } from "@/data/players";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Trophy, TrendingUp, Zap, Heart, BarChart3, Flame, Activity } from "lucide-react";

interface PlayerDetailDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateFictionalRanking: (playerId: number, newRanking: number) => void;
  onUpdateSurfaceAffinity?: (playerId: number, affinity: SurfaceAffinity) => void;
  getH2HPair?: (id1: number, id2: number) => { p1Wins: number; p2Wins: number };
  allPlayers?: Player[];
  readOnly?: boolean;
}

const surfaceColors: Record<Surface, string> = {
  Hard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Clay: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Grass: "bg-green-500/20 text-green-400 border-green-500/30",
};

const surfaceLabels: Record<number, string> = {
  [-2]: "Muy débil",
  [-1]: "Débil",
  [0]: "Neutral",
  [1]: "Fuerte",
  [2]: "Especialista",
};

const PlayerDetailDialog: React.FC<PlayerDetailDialogProps> = ({
  player,
  open,
  onOpenChange,
  onUpdateFictionalRanking,
  onUpdateSurfaceAffinity,
  getH2HPair,
  allPlayers,
  readOnly = false,
}) => {
  const [editingRanking, setEditingRanking] = useState<number>(1);
  const [editingAffinity, setEditingAffinity] = useState<SurfaceAffinity>({ Hard: 0, Clay: 0, Grass: 0 });

  useEffect(() => {
    if (player) {
      setEditingRanking(player.fictionalRanking);
      setEditingAffinity(player.surfaceAffinity || { Hard: 0, Clay: 0, Grass: 0 });
    }
  }, [player]);

  if (!player) return null;

  const rawStats = player.stats || {};
  const stats = {
    wins: 0, losses: 0,
    surfaceWins: { Hard: 0, Clay: 0, Grass: 0 },
    surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 },
    currentStreak: 0, bestWinStreak: 0, titles: 0,
    ...rawStats,
    // career mode uses titlesWon instead of titles
    titles: (rawStats as { titles?: number; titlesWon?: number }).titles ?? (rawStats as { titlesWon?: number }).titlesWon ?? 0,
  };
  const totalMatches = stats.wins + stats.losses;
  const winPct = totalMatches > 0 ? ((stats.wins / totalMatches) * 100).toFixed(1) : "—";
  const fatigue = Math.round(player.fatigue ?? 0);
  const fatigueColor = fatigue >= 70 ? "bg-red-500/20 text-red-400 border-red-500/30"
    : fatigue >= 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    : "bg-green-500/20 text-green-400 border-green-500/30";
  const fatigueLabel = fatigue >= 70 ? "Muy cansado" : fatigue >= 40 ? "Algo cansado" : "Descansado";

  const handleSave = () => {
    const ranking = Math.max(1, Math.min(150, editingRanking));
    onUpdateFictionalRanking(player.id, ranking);
    onUpdateSurfaceAffinity?.(player.id, editingAffinity);
    onOpenChange(false);
  };

  const getAdvantagePreview = () => {
    const diff = Math.abs(player.officialRanking - editingRanking);
    if (diff >= 64) return { level: "Dominant", color: "bg-destructive" };
    if (diff >= 32) return { level: "Clear", color: "bg-accent" };
    if (diff >= 16) return { level: "Small", color: "bg-primary" };
    return { level: "None", color: "bg-muted" };
  };

  const advantage = getAdvantagePreview();

  const getSurfaceWinPct = (surface: Surface) => {
    const w = stats.surfaceWins[surface] || 0;
    const l = stats.surfaceLosses[surface] || 0;
    const t = w + l;
    return t > 0 ? `${((w / t) * 100).toFixed(0)}%` : "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{player.countryCode}</span>
            {player.name}
            {player.age && <span className="text-sm font-normal text-muted-foreground">· {player.age} yrs</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex gap-2 flex-wrap">
            {player.injured && (
              <Badge variant="destructive" className="gap-1">
                <Heart className="w-3 h-3" />
                Injured ({player.injuryWeeksRemaining} weeks)
              </Badge>
            )}
            <Badge className={`gap-1 ${fatigueColor}`} title="Fatiga acumulada — afecta la probabilidad de que se anote a los próximos torneos">
              <Activity className="w-3 h-3" />
              Fatiga {fatigue}% · {fatigueLabel}
            </Badge>
            {stats.titles > 0 && (
              <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Trophy className="w-3 h-3" />
                {stats.titles} título{stats.titles > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-display font-bold text-foreground">
                #{player.officialRanking}
              </div>
              <div className="text-xs text-muted-foreground">Official Rank</div>
            </div>
            <div className="glass-card p-3 text-center">
              <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-2xl font-display font-bold text-foreground">
                {player.livePoints.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Live Points</div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Estadísticas</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">{stats.wins}</div>
                <div className="text-xs text-muted-foreground">Victorias</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{stats.losses}</div>
                <div className="text-xs text-muted-foreground">Derrotas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{winPct}%</div>
                <div className="text-xs text-muted-foreground">Win %</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-muted-foreground">Racha:</span>
                <span className={`font-medium ${stats.currentStreak > 0 ? "text-green-400" : stats.currentStreak < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {stats.currentStreak > 0 ? `W${stats.currentStreak}` : stats.currentStreak < 0 ? `L${Math.abs(stats.currentStreak)}` : "—"}
                </span>
              </div>
              <div className="text-muted-foreground">
                Mejor racha: <span className="text-foreground font-medium">W{stats.bestWinStreak}</span>
              </div>
            </div>
            {/* Surface Win % */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              {(["Hard", "Clay", "Grass"] as Surface[]).map(s => (
                <div key={s} className={`rounded-md p-2 text-center border ${surfaceColors[s]}`}>
                  <div className="text-xs font-medium">{s}</div>
                  <div className="text-sm font-bold">{getSurfaceWinPct(s)}</div>
                  <div className="text-[10px] opacity-70">{stats.surfaceWins[s] || 0}W-{stats.surfaceLosses[s] || 0}L</div>
                </div>
              ))}
            </div>
          </div>

          {/* Surface Affinity */}
          <div className="glass-card p-4 space-y-3 border-2 border-accent/30">
            <span className="font-semibold text-sm text-foreground">🎾 Afinidad por Superficie</span>
            {(["Hard", "Clay", "Grass"] as Surface[]).map(surface => (
              <div key={surface} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{surface}</Label>
                  <span className={`text-xs px-2 py-0.5 rounded ${surfaceColors[surface]}`}>
                    {surfaceLabels[editingAffinity[surface]] || "Neutral"}
                  </span>
                </div>
                {!readOnly ? (
                  <>
                    <Slider
                      min={-2}
                      max={2}
                      step={1}
                      value={[editingAffinity[surface]]}
                      onValueChange={([v]) => setEditingAffinity(prev => ({ ...prev, [surface]: v }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Muy débil</span>
                      <span>Especialista</span>
                    </div>
                  </>
                ) : (
                  <div className="h-2 rounded-full bg-muted/40 relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent border-2 border-background"
                      style={{ left: `${((editingAffinity[surface] + 2) / 4) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  </div>
                )}
              </div>
            ))}
            {readOnly && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                Mejora con Develop Points en Player Development
              </p>
            )}
          </div>

          {/* Points Breakdown */}
          <div className="glass-card p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Official Points (52-week)</span>
              <span className="font-medium text-foreground">{player.points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">This Year (Live)</span>
              <span className="font-medium text-primary">{player.livePoints.toLocaleString()}</span>
            </div>
          </div>

          {/* H2H Section */}
          {getH2HPair && allPlayers && (() => {
            const rivals = allPlayers
              .filter(p => p.id !== player.id && p.officialRanking <= 50)
              .map(opp => {
                const h2h = getH2HPair(player.id, opp.id);
                return { opp, wins: h2h.p1Wins, losses: h2h.p2Wins, total: h2h.p1Wins + h2h.p2Wins };
              })
              .filter(r => r.total > 0)
              .sort((a, b) => b.total - a.total)
              .slice(0, 8);

            if (rivals.length === 0) return (
              <div className="glass-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Head-to-Head</span>
                </div>
                <p className="text-xs text-muted-foreground">No H2H data yet — records build as matches are simulated each week.</p>
              </div>
            );

            return (
              <div className="glass-card p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Head-to-Head</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">vs top 50 players</span>
                </div>
                <div className="space-y-1">
                  {rivals.map(r => {
                    const winPct = r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0;
                    return (
                      <div key={r.opp.id} className="flex items-center gap-2 py-1 border-b border-border/20 last:border-0">
                        <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0">#{r.opp.officialRanking}</span>
                        <span className="text-xs text-foreground flex-1 truncate">{r.opp.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-bold text-green-400">{r.wins}</span>
                          <span className="text-[10px] text-muted-foreground">-</span>
                          <span className="text-xs font-bold text-red-400">{r.losses}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">({winPct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Fictional Ranking / Power Boost */}
          <div className="glass-card p-4 space-y-3 border-2 border-primary/30">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-4 h-4" />
              <span className="font-semibold text-sm">Power Boost System</span>
            </div>

            {readOnly ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fictional Ranking</span>
                <span className="text-lg font-display font-bold text-primary">#{player.fictionalRanking}</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fictional-ranking">Fictional Ranking</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fictional-ranking"
                      type="number"
                      min={1}
                      max={150}
                      value={editingRanking}
                      onChange={(e) => setEditingRanking(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRanking(player.officialRanking)}
                    >
                      Reset to Official
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Advantage vs Official:</span>
                  <Badge className={advantage.color}>{advantage.level}</Badge>
                </div>
              </>
            )}

            {readOnly && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">Advantage vs Official:</span>
                <Badge className={advantage.color}>{advantage.level}</Badge>
              </div>
            )}
          </div>

          {/* Save Button — only for editable (non-career) players */}
          {!readOnly && (
            <Button onClick={handleSave} className="w-full gap-2">
              <Zap className="w-4 h-4" />
              Guardar Cambios
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDetailDialog;
