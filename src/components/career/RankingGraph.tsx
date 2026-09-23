import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RankingEntry {
  week: number;
  season: number;
  ranking: number;
}

interface Props {
  rankingHistory: RankingEntry[];
  currentRanking: number;
  bestRanking: number;
}

const RankingGraph: React.FC<Props> = ({ rankingHistory, currentRanking, bestRanking }) => {
  const data = useMemo(() => {
    if (rankingHistory.length === 0) return [];
    return rankingHistory.slice(-52); // Last season
  }, [rankingHistory]);

  if (data.length < 2) {
    return (
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Ranking Evolution
        </h3>
        <p className="text-xs text-muted-foreground text-center py-8">Play more tournaments to see your ranking evolution.</p>
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const maxRank = Math.max(...data.map(d => d.ranking)) + 10;
  const minRank = Math.max(1, Math.min(...data.map(d => d.ranking)) - 5);

  // Note: lower ranking = better, so we invert Y axis
  const toX = (i: number) => padL + (i / (data.length - 1)) * (width - padL - padR);
  const toY = (rank: number) => padT + ((rank - minRank) / (maxRank - minRank)) * (height - padT - padB);

  const points = data.map((d, i) => `${toX(i)},${toY(d.ranking)}`).join(' ');
  const areaPoints = `${toX(0)},${height - padB} ${points} ${toX(data.length - 1)},${height - padB}`;

  const isImproving = data.length >= 2 && data[data.length - 1].ranking < data[0].ranking;

  // Y axis ticks
  const yTicks: number[] = [];
  const step = Math.ceil((maxRank - minRank) / 4);
  for (let r = minRank; r <= maxRank; r += step) {
    yTicks.push(r);
  }

  const trend = data.length >= 2 ? data[0].ranking - data[data.length - 1].ranking : 0;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          {isImproving ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
          Ranking Evolution
        </h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Best: <span className="text-amber-400 font-medium">#{bestRanking}</span></span>
          <span>Current: <span className="text-primary font-medium">#{currentRanking}</span></span>
          {trend !== 0 && (
            <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)} positions
            </span>
          )}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '280px' }}>
          {/* Grid lines */}
          {yTicks.map(r => (
            <g key={r}>
              <line
                x1={padL} y1={toY(r)}
                x2={width - padR} y2={toY(r)}
                stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"
              />
              <text
                x={padL - 4} y={toY(r) + 4}
                textAnchor="end" fontSize="9" fill="currentColor" opacity="0.5"
              >
                #{r}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <polygon
            points={areaPoints}
            fill={isImproving ? "rgb(74,222,128)" : "rgb(239,68,68)"}
            fillOpacity="0.08"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={isImproving ? "rgb(74,222,128)" : "rgb(239,68,68)"}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Data points - show every few */}
          {data.filter((_, i) => i % Math.ceil(data.length / 12) === 0 || i === data.length - 1).map((d) => {
            const origI = data.indexOf(d);
            return (
              <circle
                key={origI}
                cx={toX(origI)} cy={toY(d.ranking)}
                r="3"
                fill={isImproving ? "rgb(74,222,128)" : "rgb(239,68,68)"}
              />
            );
          })}

          {/* X axis labels - weeks */}
          {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d) => {
            const origI = data.indexOf(d);
            return (
              <text
                key={origI}
                x={toX(origI)} y={height - 4}
                textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.5"
              >
                S{d.season}W{d.week}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">Last {data.length} weeks tracked</p>
    </div>
  );
};

export default RankingGraph;
