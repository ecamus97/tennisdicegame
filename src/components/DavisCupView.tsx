import React, { useEffect, useState } from "react";
import { Player } from "@/data/players";
import { MatchResult, playMatch } from "@/lib/matchEngine";
import { Trophy, Users, Play, ChevronRight, ChevronDown, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// ========== Types ==========

export interface DavisCupCountry {
  countryCode: string;
  country: string;
  player1Id: number;
  player2Id: number;
  countryRanking: number;
}

export interface DavisCupSeriesMatch {
  id: string;
  player1Id: number;
  player2Id: number;
  player1PartnerId?: number;
  player2PartnerId?: number;
  isDoubles: boolean;
  result?: MatchResult;
  matchNumber: number;
  country1Won?: boolean;
}

export interface DavisCupSeries {
  id: string;
  country1Code: string;
  country2Code: string;
  matches: DavisCupSeriesMatch[];
  country1Wins: number;
  country2Wins: number;
  winner?: string;
}

export interface DavisCupGroup {
  name: string;
  countryCodes: string[];
  series: DavisCupSeries[];
}

export interface DavisCupState {
  countries: DavisCupCountry[];
  groups: DavisCupGroup[];
  quarterFinals: DavisCupSeries[];
  semiFinals: DavisCupSeries[];
  final?: DavisCupSeries;
  phase: "groups" | "quarters" | "semis" | "final" | "complete";
}

// ========== Helpers ==========

const createDoublesPlayer = (p1: Player, p2: Player): Player => ({
  ...p1,
  id: -(p1.id * 1000 + p2.id),
  name: `${p1.name.split(' ').pop()}/${p2.name.split(' ').pop()}`,
  fictionalRanking: Math.round((p1.fictionalRanking + p2.fictionalRanking) / 2),
  officialRanking: Math.round((p1.officialRanking + p2.officialRanking) / 2),
});

const qualifyCountries = (players: Player[]): DavisCupCountry[] => {
  const byCountry = new Map<string, Player[]>();
  players.forEach(p => {
    if (!byCountry.has(p.countryCode)) byCountry.set(p.countryCode, []);
    byCountry.get(p.countryCode)!.push(p);
  });

  const countries: DavisCupCountry[] = [];
  byCountry.forEach((countryPlayers, code) => {
    if (countryPlayers.length >= 2) {
      const sorted = [...countryPlayers].sort((a, b) => a.officialRanking - b.officialRanking);
      countries.push({
        countryCode: code,
        country: sorted[0].country,
        player1Id: sorted[0].id,
        player2Id: sorted[1].id,
        countryRanking: sorted[0].officialRanking,
      });
    }
  });

  return countries.sort((a, b) => a.countryRanking - b.countryRanking).slice(0, 16);
};

const createSeriesMatches = (c1: DavisCupCountry, c2: DavisCupCountry, seriesId: string): DavisCupSeriesMatch[] => [
  { id: `${seriesId}-1`, player1Id: c1.player1Id, player2Id: c2.player2Id, isDoubles: false, matchNumber: 1 },
  { id: `${seriesId}-2`, player1Id: c1.player2Id, player2Id: c2.player1Id, isDoubles: false, matchNumber: 2 },
  { id: `${seriesId}-3`, player1Id: c1.player1Id, player2Id: c2.player1Id, player1PartnerId: c1.player2Id, player2PartnerId: c2.player2Id, isDoubles: true, matchNumber: 3 },
  { id: `${seriesId}-4`, player1Id: c1.player2Id, player2Id: c2.player2Id, isDoubles: false, matchNumber: 4 },
  { id: `${seriesId}-5`, player1Id: c1.player1Id, player2Id: c2.player1Id, isDoubles: false, matchNumber: 5 },
];

const createSeries = (c1: DavisCupCountry, c2: DavisCupCountry, seriesId: string): DavisCupSeries => ({
  id: seriesId,
  country1Code: c1.countryCode,
  country2Code: c2.countryCode,
  matches: createSeriesMatches(c1, c2, seriesId),
  country1Wins: 0,
  country2Wins: 0,
});

const createGroups = (countries: DavisCupCountry[]): DavisCupGroup[] => {
  const groups: DavisCupGroup[] = [
    { name: "A", countryCodes: [], series: [] },
    { name: "B", countryCodes: [], series: [] },
    { name: "C", countryCodes: [], series: [] },
    { name: "D", countryCodes: [], series: [] },
  ];

  for (let pot = 0; pot < 4; pot++) {
    const potCountries = countries.slice(pot * 4, (pot + 1) * 4);
    for (let i = potCountries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [potCountries[i], potCountries[j]] = [potCountries[j], potCountries[i]];
    }
    potCountries.forEach((country, idx) => {
      groups[idx].countryCodes.push(country.countryCode);
    });
  }

  groups.forEach(group => {
    const codes = group.countryCodes;
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const c1 = countries.find(c => c.countryCode === codes[i])!;
        const c2 = countries.find(c => c.countryCode === codes[j])!;
        group.series.push(createSeries(c1, c2, `G${group.name}-${codes[i]}-${codes[j]}`));
      }
    }
  });

  return groups;
};

// ========== State Update ==========

export const updateDavisCupMatchResult = (
  state: DavisCupState,
  seriesId: string,
  matchId: string,
  country1Won: boolean,
  result: MatchResult
): DavisCupState => {
  const updateSeries = (s: DavisCupSeries): DavisCupSeries => {
    if (s.id !== seriesId) return s;

    const updatedMatches = s.matches.map(m =>
      m.id === matchId ? { ...m, result, country1Won } : m
    );

    const newC1Wins = s.country1Wins + (country1Won ? 1 : 0);
    const newC2Wins = s.country2Wins + (country1Won ? 0 : 1);

    return {
      ...s,
      matches: updatedMatches,
      country1Wins: newC1Wins,
      country2Wins: newC2Wins,
      winner: newC1Wins >= 3 ? s.country1Code : newC2Wins >= 3 ? s.country2Code : undefined,
    };
  };

  return {
    ...state,
    groups: state.groups.map(g => ({
      ...g,
      series: g.series.map(updateSeries),
    })),
    quarterFinals: state.quarterFinals.map(updateSeries),
    semiFinals: state.semiFinals.map(updateSeries),
    final: state.final ? updateSeries(state.final) : undefined,
  };
};

// ========== Standings ==========

interface GroupStanding {
  countryCode: string;
  country: string;
  seriesWon: number;
  seriesLost: number;
  matchesWon: number;
  matchesLost: number;
}

const calculateGroupStandings = (group: DavisCupGroup, countries: DavisCupCountry[]): GroupStanding[] => {
  const standings = group.countryCodes.map(code => {
    const country = countries.find(c => c.countryCode === code)!;
    let seriesWon = 0, seriesLost = 0, matchesWon = 0, matchesLost = 0;

    group.series.forEach(s => {
      if (s.country1Code !== code && s.country2Code !== code) return;
      const isCountry1 = s.country1Code === code;

      if (s.winner === code) seriesWon++;
      else if (s.winner) seriesLost++;

      matchesWon += isCountry1 ? s.country1Wins : s.country2Wins;
      matchesLost += isCountry1 ? s.country2Wins : s.country1Wins;
    });

    return { countryCode: code, country: country.country, seriesWon, seriesLost, matchesWon, matchesLost };
  });

  return standings.sort((a, b) => {
    if (b.seriesWon !== a.seriesWon) return b.seriesWon - a.seriesWon;
    return b.matchesWon - a.matchesWon;
  });
};

// ========== Component ==========

interface DavisCupViewProps {
  players: Player[];
  state: DavisCupState | null;
  onStateChange: (state: DavisCupState) => void;
  onMatchClick: (player1: Player, player2: Player, matchId: string, seriesId: string) => void;
  onComplete: () => void;
}

const DavisCupView: React.FC<DavisCupViewProps> = ({
  players,
  state,
  onStateChange,
  onMatchClick,
  onComplete,
}) => {
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  const getPlayer = (id: number): Player | undefined => players.find(p => p.id === id);

  // Initialize
  useEffect(() => {
    if (!state) {
      const countries = qualifyCountries(players);
      if (countries.length >= 16) {
        const groups = createGroups(countries);
        onStateChange({
          countries,
          groups,
          quarterFinals: [],
          semiFinals: [],
          phase: "groups",
        });
      }
    }
  }, [state, players, onStateChange]);

  if (!state) {
    return (
      <div className="glass-card p-6 text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading Davis Cup draw...</p>
      </div>
    );
  }

  const handleMatchClick = (series: DavisCupSeries, match: DavisCupSeriesMatch) => {
    if (match.result || series.winner) return;

    let p1: Player, p2: Player;
    if (match.isDoubles) {
      const p1a = getPlayer(match.player1Id)!;
      const p1b = getPlayer(match.player1PartnerId!)!;
      const p2a = getPlayer(match.player2Id)!;
      const p2b = getPlayer(match.player2PartnerId!)!;
      p1 = createDoublesPlayer(p1a, p1b);
      p2 = createDoublesPlayer(p2a, p2b);
    } else {
      p1 = getPlayer(match.player1Id)!;
      p2 = getPlayer(match.player2Id)!;
    }

    onMatchClick(p1, p2, match.id, series.id);
  };

  const findSeries = (s: DavisCupState, seriesId: string): DavisCupSeries | undefined => {
    for (const g of s.groups) {
      const found = g.series.find(sr => sr.id === seriesId);
      if (found) return found;
    }
    return s.quarterFinals.find(sr => sr.id === seriesId) ||
      s.semiFinals.find(sr => sr.id === seriesId) ||
      (s.final?.id === seriesId ? s.final : undefined);
  };

  const simulateSeries = (series: DavisCupSeries) => {
    if (series.winner) return;

    let currentState = { ...state };

    for (const match of series.matches) {
      if (match.result) continue;
      const currentSeries = findSeries(currentState, series.id);
      if (currentSeries?.winner) break;

      let p1: Player, p2: Player;
      if (match.isDoubles) {
        const p1a = getPlayer(match.player1Id)!;
        const p1b = getPlayer(match.player1PartnerId!)!;
        const p2a = getPlayer(match.player2Id)!;
        const p2b = getPlayer(match.player2PartnerId!)!;
        p1 = createDoublesPlayer(p1a, p1b);
        p2 = createDoublesPlayer(p2a, p2b);
      } else {
        p1 = getPlayer(match.player1Id)!;
        p2 = getPlayer(match.player2Id)!;
      }

      const result = playMatch(p1, p2, 3);
      const country1Won = result.winner.id === p1.id;
      currentState = updateDavisCupMatchResult(currentState, series.id, match.id, country1Won, result);
    }

    onStateChange(currentState);
  };

  const allGroupsComplete = state.groups.every(g => g.series.every(s => s.winner));
  const allQFComplete = state.quarterFinals.length > 0 && state.quarterFinals.every(s => s.winner);
  const allSFComplete = state.semiFinals.length > 0 && state.semiFinals.every(s => s.winner);

  const handleAdvanceToQuarters = () => {
    if (!allGroupsComplete) return;
    const groupStandings = state.groups.map(g => calculateGroupStandings(g, state.countries));
    const firsts = groupStandings.map(s => s[0]);
    const seconds = groupStandings.map(s => s[1]);
    const getCountry = (code: string) => state.countries.find(c => c.countryCode === code)!;

    const qf: DavisCupSeries[] = [
      createSeries(getCountry(firsts[0].countryCode), getCountry(seconds[1].countryCode), "QF-1"),
      createSeries(getCountry(firsts[2].countryCode), getCountry(seconds[3].countryCode), "QF-2"),
      createSeries(getCountry(firsts[1].countryCode), getCountry(seconds[0].countryCode), "QF-3"),
      createSeries(getCountry(firsts[3].countryCode), getCountry(seconds[2].countryCode), "QF-4"),
    ];

    onStateChange({ ...state, phase: "quarters", quarterFinals: qf });
  };

  const handleAdvanceToSemis = () => {
    if (!allQFComplete) return;
    const getCountry = (code: string) => state.countries.find(c => c.countryCode === code)!;
    const sf: DavisCupSeries[] = [
      createSeries(getCountry(state.quarterFinals[0].winner!), getCountry(state.quarterFinals[1].winner!), "SF-1"),
      createSeries(getCountry(state.quarterFinals[2].winner!), getCountry(state.quarterFinals[3].winner!), "SF-2"),
    ];
    onStateChange({ ...state, phase: "semis", semiFinals: sf });
  };

  const handleAdvanceToFinal = () => {
    if (!allSFComplete) return;
    const getCountry = (code: string) => state.countries.find(c => c.countryCode === code)!;
    const final = createSeries(getCountry(state.semiFinals[0].winner!), getCountry(state.semiFinals[1].winner!), "FINAL");
    onStateChange({ ...state, phase: "final", final });
  };

  const handleComplete = () => {
    if (!state.final?.winner) return;
    onStateChange({ ...state, phase: "complete" });
    onComplete();
  };

  // ========== Render Helpers ==========

  const renderMatch = (match: DavisCupSeriesMatch, series: DavisCupSeries) => {
    const isSeriesDecided = !!series.winner;
    const canPlay = !match.result && !isSeriesDecided;

    let p1Name: string, p2Name: string;
    if (match.isDoubles) {
      const p1a = getPlayer(match.player1Id);
      const p1b = getPlayer(match.player1PartnerId!);
      const p2a = getPlayer(match.player2Id);
      const p2b = getPlayer(match.player2PartnerId!);
      p1Name = `${p1a?.name.split(' ').pop()}/${p1b?.name.split(' ').pop()}`;
      p2Name = `${p2a?.name.split(' ').pop()}/${p2b?.name.split(' ').pop()}`;
    } else {
      p1Name = getPlayer(match.player1Id)?.name || "?";
      p2Name = getPlayer(match.player2Id)?.name || "?";
    }

    return (
      <div
        key={match.id}
        className={`
          flex items-center justify-between p-2 rounded-lg text-sm transition-colors
          ${canPlay ? "cursor-pointer hover:bg-primary/10 bg-secondary/20" : "bg-secondary/10"}
          ${isSeriesDecided && !match.result ? "opacity-40" : ""}
        `}
        onClick={() => canPlay && handleMatchClick(series, match)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">M{match.matchNumber}</span>
            {match.isDoubles && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">DBL</Badge>}
          </div>
          <div className={`truncate ${match.country1Won === true ? "text-primary font-semibold" : ""}`}>
            {p1Name}
          </div>
          <div className={`truncate ${match.country1Won === false ? "text-primary font-semibold" : ""}`}>
            {p2Name}
          </div>
        </div>

        <div className="ml-2 min-w-[50px] text-right">
          {match.result ? (
            <div className="text-xs font-mono">
              {match.result.sets.map((set, i) => (
                <span key={i} className="ml-1">{set.player1Games}-{set.player2Games}</span>
              ))}
            </div>
          ) : canPlay ? (
            <Play className="w-4 h-4 text-primary" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
    );
  };

  const renderSeries = (series: DavisCupSeries) => {
    const isExpanded = expandedSeries === series.id;
    const c1 = state.countries.find(c => c.countryCode === series.country1Code)!;
    const c2 = state.countries.find(c => c.countryCode === series.country2Code)!;

    return (
      <div key={series.id} className="glass-card overflow-hidden">
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
          onClick={() => setExpandedSeries(isExpanded ? null : series.id)}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{c1.country}</span>
              <span className={`text-lg font-bold ${series.winner === c1.countryCode ? "text-primary" : ""}`}>
                {series.country1Wins}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={`text-lg font-bold ${series.winner === c2.countryCode ? "text-primary" : ""}`}>
                {series.country2Wins}
              </span>
              <span className="font-semibold text-sm">{c2.country}</span>
            </div>
            {series.winner && (
              <Badge variant="secondary" className="text-[10px]">
                {state.countries.find(c => c.countryCode === series.winner)?.country} wins
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!series.winner && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs h-7"
                onClick={(e) => { e.stopPropagation(); simulateSeries(series); }}
              >
                <Zap className="w-3 h-3" />
                Sim
              </Button>
            )}
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-border/30 p-3 space-y-1">
            {series.matches.map(match => renderMatch(match, series))}
          </div>
        )}
      </div>
    );
  };

  const renderGroupStandings = (group: DavisCupGroup) => {
    const standings = calculateGroupStandings(group, state.countries);

    return (
      <div className="glass-card overflow-hidden">
        <div className="bg-primary/10 px-3 py-2 border-b border-border/50">
          <h4 className="font-display font-semibold text-sm">Group {group.name}</h4>
        </div>
        <div className="divide-y divide-border/30">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
            <span>Country</span>
            <span className="w-8 text-center">W</span>
            <span className="w-8 text-center">L</span>
            <span className="w-16 text-center">Matches</span>
          </div>
          {standings.map((s, idx) => (
            <div key={s.countryCode} className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-sm ${idx < 2 ? "bg-primary/5" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx < 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {idx + 1}
                </span>
                <span className="font-medium">{s.countryCode}</span>
                <span className="text-xs text-muted-foreground truncate">{s.country}</span>
              </div>
              <span className="w-8 text-center font-semibold text-primary">{s.seriesWon}</span>
              <span className="w-8 text-center text-muted-foreground">{s.seriesLost}</span>
              <span className="w-16 text-center text-muted-foreground">{s.matchesWon}-{s.matchesLost}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========== Main Render ==========

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <Badge className="mb-2 bg-green-500/20 text-green-600 border-green-500/30">Davis Cup</Badge>
            <h2 className="font-display text-2xl font-bold">Davis Cup Finals</h2>
            <p className="text-sm text-muted-foreground">Málaga, Spain • 16 countries • Best of 5 matches per series</p>
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {(["groups", "quarters", "semis", "final"] as const).map((phase, idx) => (
          <React.Fragment key={phase}>
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${state.phase === phase ? "bg-primary text-primary-foreground" :
                (["groups", "quarters", "semis", "final"] as const).indexOf(state.phase as any) > idx || state.phase === "complete"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"}
            `}>
              {phase === "groups" ? "Groups" : phase === "quarters" ? "QF" : phase === "semis" ? "SF" : "Final"}
            </div>
            {idx < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>

      <ScrollArea className="h-[500px]">
        {/* Group Stage */}
        {state.phase === "groups" && (
          <div className="space-y-6 pr-4">
            {state.groups.map(group => (
              <div key={group.name} className="space-y-3">
                {renderGroupStandings(group)}
                <div className="space-y-2">
                  {group.series.map(series => renderSeries(series))}
                </div>
              </div>
            ))}

            {allGroupsComplete && (
              <Button onClick={handleAdvanceToQuarters} className="w-full gap-2">
                Advance to Quarter-Finals
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Quarter-Finals */}
        {state.phase === "quarters" && (
          <div className="space-y-4 pr-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Quarter-Finals
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="text-xs text-muted-foreground text-center">1A vs 2B • 1C vs 2D • 1B vs 2A • 1D vs 2C</div>
              {state.quarterFinals.map(series => renderSeries(series))}
            </div>

            {allQFComplete && (
              <Button onClick={handleAdvanceToSemis} className="w-full gap-2">
                Advance to Semi-Finals
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Semi-Finals */}
        {state.phase === "semis" && (
          <div className="space-y-4 pr-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Semi-Finals
            </h3>
            {state.semiFinals.map(series => renderSeries(series))}

            {allSFComplete && (
              <Button onClick={handleAdvanceToFinal} className="w-full gap-2">
                Advance to Final
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Final */}
        {(state.phase === "final" || state.phase === "complete") && state.final && (
          <div className="space-y-4 pr-4">
            <div className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-green-500/5">
              <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-display text-xl font-bold text-center mb-4">Davis Cup Final</h3>
              {renderSeries(state.final)}
            </div>

            {state.final.winner && state.phase !== "complete" && (
              <Button onClick={handleComplete} className="w-full gap-2">
                <Award className="w-4 h-4" />
                Complete Davis Cup
              </Button>
            )}

            {state.phase === "complete" && (
              <div className="glass-card p-6 text-center bg-gradient-to-r from-green-500/20 to-green-500/5">
                <Trophy className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Davis Cup Champions</p>
                <h3 className="font-display text-2xl font-bold text-primary">
                  {state.countries.find(c => c.countryCode === state.final!.winner)?.country}
                </h3>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DavisCupView;
