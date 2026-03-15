import React from 'react';
import { CareerPlayer } from '@/data/careerData';
import { getSurfaceEmoji } from '@/data/players';

interface Props {
  player: CareerPlayer;
  currentSeason: number;
}

const CareerResults: React.FC<Props> = ({ player, currentSeason }) => {
  const seasonEntries = player.seasonHistory.filter(e => e.season === currentSeason);
  const totalPoints = seasonEntries.reduce((s, e) => s + e.pointsEarned, 0);
  const totalMoney = seasonEntries.reduce((s, e) => s + e.moneyEarned, 0);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">🏆 Season {currentSeason} Results</h2>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground">W/L</div>
            <div className="text-lg font-display font-bold text-foreground">{player.stats.wins}-{player.stats.losses}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground">Titles</div>
            <div className="text-lg font-display font-bold text-primary">{player.stats.titlesWon}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground">Points</div>
            <div className="text-lg font-display font-bold text-accent">{totalPoints.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <div className="text-xs text-muted-foreground">Earnings</div>
            <div className="text-lg font-display font-bold text-green-400">${totalMoney.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-3">Tournament History</h3>
        {seasonEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tournaments played this season</p>
        ) : (
          <div className="space-y-1.5">
            {seasonEntries.slice().reverse().map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span>{getSurfaceEmoji(e.surface)}</span>
                  <span className="text-foreground truncate">{e.tournamentName}</span>
                  <span className="text-muted-foreground shrink-0">W{e.week}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className={`font-medium ${e.round === 'Winner' ? 'text-primary' : 'text-foreground'}`}>{e.round}</span>
                  <span className="text-accent">+{e.pointsEarned}</span>
                  <span className="text-green-400">${e.moneyEarned.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Surface breakdown */}
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-3">Surface Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['Hard', 'Clay', 'Grass'] as const).map(surface => (
            <div key={surface} className="p-3 rounded-lg bg-secondary/30 text-center">
              <div className="text-lg mb-1">{getSurfaceEmoji(surface)}</div>
              <div className="text-xs text-muted-foreground">{surface}</div>
              <div className="text-sm font-medium text-foreground">
                {player.stats.surfaceWins[surface]}-{player.stats.surfaceLosses[surface]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerResults;
