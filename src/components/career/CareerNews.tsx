import React, { useState } from 'react';
import { NewsItem } from '@/data/careerData';
import { Newspaper, Trophy, TrendingUp, Star, Globe, X, MapPin, Calendar, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  newsItems: NewsItem[];
  currentWeek: number;
  currentSeason: number;
}

const TYPE_ICON = {
  tournament: Trophy,
  ranking: TrendingUp,
  career: Star,
  general: Globe,
};

const TYPE_COLOR = {
  tournament: 'text-amber-400',
  ranking: 'text-blue-400',
  career: 'text-green-400',
  general: 'text-muted-foreground',
};

const TYPE_BG = {
  tournament: 'bg-amber-500/10 border-amber-500/20',
  ranking: 'bg-blue-500/10 border-blue-500/20',
  career: 'bg-green-500/10 border-green-500/20',
  general: 'bg-secondary/20 border-border/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Grand Slam': 'text-amber-400 bg-amber-500/15',
  'Masters 1000': 'text-sky-400 bg-sky-500/15',
  'ATP 500': 'text-violet-400 bg-violet-500/15',
  'ATP 250': 'text-emerald-400 bg-emerald-500/15',
  'ATP Finals': 'text-rose-400 bg-rose-500/15',
};

function NewsDetailDialog({ item, open, onClose }: { item: NewsItem | null; open: boolean; onClose: () => void }) {
  if (!item) return null;
  const Icon = TYPE_ICON[item.type];
  const color = TYPE_COLOR[item.type];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${color}`}>
            <Icon className="w-4 h-4" />
            {item.type === 'tournament' ? 'Tournament Result' :
             item.type === 'ranking' ? 'Rankings Update' :
             item.type === 'career' ? 'Your Career' : 'News'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="font-semibold text-foreground leading-snug">{item.headline}</p>

          {/* Tournament detail */}
          {item.type === 'tournament' && item.tournamentName && (
            <div className="space-y-3">
              {/* Tournament info */}
              <div className={`rounded-lg p-3 border ${TYPE_BG[item.type]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">{item.tournamentName}</span>
                  {item.tournamentCategory && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.tournamentCategory] || 'text-muted-foreground bg-secondary/30'}`}>
                      {item.tournamentCategory}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.tournamentCity && item.tournamentCountry && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.tournamentCity}, {item.tournamentCountry}
                    </span>
                  )}
                  {item.tournamentSurface && (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {item.tournamentSurface}
                    </span>
                  )}
                </div>
              </div>

              {/* Final result */}
              {item.winnerName && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Final Result</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                      <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <div className="font-semibold text-sm text-foreground">{item.winnerName}</div>
                      <div className="text-[10px] text-muted-foreground">Winner</div>
                      {item.winnerNewRanking && (
                        <div className="text-xs text-amber-400 mt-1">Now #{item.winnerNewRanking}</div>
                      )}
                    </div>
                    {item.runnerUpName && (
                      <div className="rounded-lg bg-secondary/20 border border-border/30 p-3 text-center">
                        <div className="w-4 h-4 mx-auto mb-1 text-slate-400 text-center font-bold">2</div>
                        <div className="font-semibold text-sm text-foreground">{item.runnerUpName}</div>
                        <div className="text-[10px] text-muted-foreground">Runner-up</div>
                        {item.runnerUpNewRanking && (
                          <div className="text-xs text-muted-foreground mt-1">#{item.runnerUpNewRanking}</div>
                        )}
                      </div>
                    )}
                  </div>
                  {item.pointsAwarded && (
                    <div className="text-xs text-center text-muted-foreground">
                      {item.pointsAwarded.toLocaleString()} ranking points awarded to winner
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ranking detail */}
          {(item.type === 'ranking' || item.type === 'career') && item.rankBefore !== undefined && item.rankAfter !== undefined && (
            <div className={`rounded-lg p-3 border ${TYPE_BG[item.type]}`}>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Before</div>
                  <div className="text-2xl font-display font-bold text-muted-foreground">#{item.rankBefore}</div>
                </div>
                <TrendingUp className={`w-5 h-5 ${item.rankAfter < item.rankBefore ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">After</div>
                  <div className={`text-2xl font-display font-bold ${item.rankAfter < item.rankBefore ? 'text-green-400' : 'text-red-400'}`}>
                    #{item.rankAfter}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Change</div>
                  <div className={`text-xl font-bold ${item.rankAfter < item.rankBefore ? 'text-green-400' : 'text-red-400'}`}>
                    {item.rankAfter < item.rankBefore ? '+' : ''}{item.rankBefore - item.rankAfter}
                  </div>
                </div>
              </div>
            </div>
          )}

          {item.body && (
            <p className="text-sm text-foreground/90 leading-relaxed">{item.body}</p>
          )}
          {item.detail && !item.body && (
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          )}

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Season {item.season} · Week {item.week}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CareerNews: React.FC<Props> = ({ newsItems, currentWeek, currentSeason }) => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const thisWeek = newsItems.filter(n => n.week === currentWeek && n.season === currentSeason);
  const recent = newsItems.filter(n => !(n.week === currentWeek && n.season === currentSeason)).slice(0, 10);

  const openNews = (item: NewsItem) => {
    setSelectedNews(item);
    setDialogOpen(true);
  };

  if (newsItems.length === 0) {
    return (
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-2">
          <Newspaper className="w-4 h-4 text-primary" /> News
        </h3>
        <p className="text-xs text-muted-foreground">Advance to the next week to see tennis news.</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-primary" /> Tennis News
        </h3>
        <div className="space-y-2">
          {thisWeek.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">This Week</p>
              {thisWeek.map(item => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => openNews(item)}
                    className={`w-full text-left flex items-start gap-2 p-2 rounded-lg border transition-all hover:brightness-125 cursor-pointer ${TYPE_BG[item.type]}`}
                  >
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TYPE_COLOR[item.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{item.headline}</p>
                      {item.detail && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.detail}</p>}
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0 self-center">→</span>
                  </button>
                );
              })}
            </>
          )}
          {recent.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">Recent</p>
              {recent.map(item => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <button
                    key={item.id}
                    onClick={() => openNews(item)}
                    className="w-full text-left flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0 hover:bg-secondary/10 rounded transition-all cursor-pointer px-1"
                  >
                    <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${TYPE_COLOR[item.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground leading-snug truncate">{item.headline}</p>
                      <p className="text-[10px] text-muted-foreground">S{item.season} W{item.week}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      <NewsDetailDialog
        item={selectedNews}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default CareerNews;
