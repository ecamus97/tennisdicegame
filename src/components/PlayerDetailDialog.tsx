import React, { useState, useEffect } from "react";
import { Player } from "@/data/players";
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
import { Trophy, TrendingUp, Zap, Heart } from "lucide-react";

interface PlayerDetailDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateFictionalRanking: (playerId: number, newRanking: number) => void;
}

const PlayerDetailDialog: React.FC<PlayerDetailDialogProps> = ({
  player,
  open,
  onOpenChange,
  onUpdateFictionalRanking,
}) => {
  const [editingRanking, setEditingRanking] = useState<number>(1);

  useEffect(() => {
    if (player) {
      setEditingRanking(player.fictionalRanking);
    }
  }, [player]);

  if (!player) return null;

  const handleSave = () => {
    const ranking = Math.max(1, Math.min(150, editingRanking));
    onUpdateFictionalRanking(player.id, ranking);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{player.countryCode}</span>
            {player.name}
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

          {/* Fictional Ranking Editor */}
          <div className="glass-card p-4 space-y-3 border-2 border-primary/30">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="w-4 h-4" />
              <span className="font-semibold text-sm">Power Boost System</span>
            </div>
            
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
              <p className="text-xs text-muted-foreground">
                Fictional ranking affects match advantage calculations.
              </p>
            </div>

            {/* Advantage Preview */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Advantage vs Official:</span>
              <Badge className={advantage.color}>{advantage.level}</Badge>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            Save Fictional Ranking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDetailDialog;
