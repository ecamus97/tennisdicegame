import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, UserMinus, UserPlus, Medal } from 'lucide-react';

interface SeasonSummaryData {
  season: number;
  topRanking: { name: string; points: number }[];
  grandSlamWinners: { tournament: string; winner: string }[];
  masters1000Winners: { tournament: string; winner: string }[];
  retiredPlayers: string[];
  newPlayers: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: SeasonSummaryData;
}

const SeasonSummaryDialog: React.FC<Props> = ({ open, onClose, data }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-primary" />
            Season {data.season} Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Grand Slam Winners */}
          {data.grandSlamWinners.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Medal className="w-4 h-4 text-primary" /> Grand Slam Champions
              </h3>
              <div className="space-y-1">
                {data.grandSlamWinners.map((gs, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded bg-secondary/30">
                    <span className="text-muted-foreground">{gs.tournament}</span>
                    <span className="font-medium text-foreground">{gs.winner}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Masters 1000 Winners */}
          {data.masters1000Winners.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-accent" /> Masters 1000 Champions
              </h3>
              <div className="grid grid-cols-2 gap-1">
                {data.masters1000Winners.map((m, i) => (
                  <div key={i} className="text-xs p-1.5 rounded bg-secondary/20">
                    <span className="text-muted-foreground">{m.tournament}: </span>
                    <span className="font-medium text-foreground">{m.winner}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Rankings */}
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Year-End Top 10
            </h3>
            <div className="space-y-1">
              {data.topRanking.slice(0, 10).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-1.5 rounded bg-secondary/30">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-500/30 text-yellow-400' :
                    i === 1 ? 'bg-gray-400/30 text-gray-300' :
                    i === 2 ? 'bg-orange-500/30 text-orange-400' :
                    'bg-muted text-muted-foreground'
                  }`}>{i + 1}</span>
                  <span className="flex-1 font-medium text-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.points.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Retired Players */}
          {data.retiredPlayers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <UserMinus className="w-4 h-4 text-red-400" /> Retired Players
              </h3>
              <div className="flex flex-wrap gap-1">
                {data.retiredPlayers.map((name, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">{name}</span>
                ))}
              </div>
            </div>
          )}

          {/* New Players */}
          {data.newPlayers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <UserPlus className="w-4 h-4 text-green-400" /> New Players
              </h3>
              <div className="flex flex-wrap gap-1">
                {data.newPlayers.map((name, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          Start Season {data.season + 1}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SeasonSummaryDialog;
