import React, { useEffect, useState } from "react";
import { Player } from "@/data/players";
import { MatchResult } from "@/lib/matchEngine";
import { Trophy, Users, Play, ChevronRight, ChevronDown, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DavisCupSeasonState, DavisCupTie, DavisCupSeriesMatch,
  generateYear1Season, updateTieMatchResult, simulateTie, advanceFinalEight,
  DAVIS_CUP_FEB_WEEK, DAVIS_CUP_SEPT_WEEK, DAVIS_CUP_FINAL8_WEEK,
} from "@/data/davisCupData";

export type { DavisCupSeasonState, DavisCupTie } from "@/data/davisCupData";

export const applyDavisCupMatchResult = (
  season: DavisCupSeasonState,
  tieId: string,
  matchId: string,
  country1Won: boolean,
  result: MatchResult,
): DavisCupSeasonState => {
  const updated = replaceTie(season, tieId, t => updateTieMatchResult(t, matchId, country1Won, result));
  return advanceFinalEight(updated);
};

interface DavisCupViewProps {
  players: Player[];
  season: DavisCupSeasonState | null;
  currentWeek: number;
  onSeasonChange: (season: DavisCupSeasonState) => void;
  onMatchClick: (player1: Player, player2: Player, matchId: string, tieId: string) => void;
  onComplete: () => void;
}

const createDoublesPlayer = (p1: Player, p2: Player): Player => ({
  ...p1,
  id: -(p1.id * 1000 + p2.id),
  name: `${p1.name.split(' ').pop()}/${p2.name.split(' ').pop()}`,
  fictionalRanking: Math.round((p1.fictionalRanking + p2.fictionalRanking) / 2),
  officialRanking: Math.round((p1.officialRanking + p2.officialRanking) / 2),
});

const findTieCollection = (season: DavisCupSeasonState, tieId: string): "qualifiersR1" | "worldGroupIRound1" | "worldGroupIRound2" | "worldGroupIIRound2" | "qualifiersR2" | "qf" | "sf" | "final" | null => {
  if (season.qualifiersR1.some(t => t.id === tieId)) return "qualifiersR1";
  if (season.worldGroupIRound1.some(t => t.id === tieId)) return "worldGroupIRound1";
  if (season.worldGroupIRound2.some(t => t.id === tieId)) return "worldGroupIRound2";
  if (season.worldGroupIIRound2.some(t => t.id === tieId)) return "worldGroupIIRound2";
  if (season.qualifiersR2.some(t => t.id === tieId)) return "qualifiersR2";
  if (season.finalEight.quarterFinals.some(t => t.id === tieId)) return "qf";
  if (season.finalEight.semiFinals.some(t => t.id === tieId)) return "sf";
  if (season.finalEight.final?.id === tieId) return "final";
  return null;
};

const replaceTie = (season: DavisCupSeasonState, tieId: string, updater: (t: DavisCupTie) => DavisCupTie): DavisCupSeasonState => {
  const coll = findTieCollection(season, tieId);
  if (!coll) return season;
  const mapList = (list: DavisCupTie[]) => list.map(t => t.id === tieId ? updater(t) : t);
  switch (coll) {
    case "qualifiersR1": return { ...season, qualifiersR1: mapList(season.qualifiersR1) };
    case "worldGroupIRound1": return { ...season, worldGroupIRound1: mapList(season.worldGroupIRound1) };
    case "worldGroupIRound2": return { ...season, worldGroupIRound2: mapList(season.worldGroupIRound2) };
    case "worldGroupIIRound2": return { ...season, worldGroupIIRound2: mapList(season.worldGroupIIRound2) };
    case "qualifiersR2": return { ...season, qualifiersR2: mapList(season.qualifiersR2) };
    case "qf": return { ...season, finalEight: { ...season.finalEight, quarterFinals: mapList(season.finalEight.quarterFinals) } };
    case "sf": return { ...season, finalEight: { ...season.finalEight, semiFinals: mapList(season.finalEight.semiFinals) } };
    case "final": return { ...season, finalEight: { ...season.finalEight, final: season.finalEight.final ? updater(season.finalEight.final) : undefined } };
  }
};

const findTie = (season: DavisCupSeasonState, tieId: string): DavisCupTie | undefined => {
  const coll = findTieCollection(season, tieId);
  if (!coll) return undefined;
  switch (coll) {
    case "qualifiersR1": return season.qualifiersR1.find(t => t.id === tieId);
    case "worldGroupIRound1": return season.worldGroupIRound1.find(t => t.id === tieId);
    case "worldGroupIRound2": return season.worldGroupIRound2.find(t => t.id === tieId);
    case "worldGroupIIRound2": return season.worldGroupIIRound2.find(t => t.id === tieId);
    case "qualifiersR2": return season.qualifiersR2.find(t => t.id === tieId);
    case "qf": return season.finalEight.quarterFinals.find(t => t.id === tieId);
    case "sf": return season.finalEight.semiFinals.find(t => t.id === tieId);
    case "final": return season.finalEight.final;
  }
};

const DavisCupView: React.FC<DavisCupViewProps> = ({ players, season, currentWeek, onSeasonChange, onMatchClick, onComplete }) => {
  const [expandedTie, setExpandedTie] = useState<string | null>(null);
  const prevChampionRef = React.useRef<string | undefined>(undefined);

  const getPlayer = (id: number): Player | undefined => players.find(p => p.id === id);

  useEffect(() => {
    if (!season && currentWeek === DAVIS_CUP_FEB_WEEK) {
      onSeasonChange(generateYear1Season(players));
    }
  }, [season, currentWeek, players, onSeasonChange]);

  useEffect(() => {
    if (season?.history.champion && season.history.champion !== prevChampionRef.current) {
      prevChampionRef.current = season.history.champion;
      onComplete();
    }
  }, [season?.history.champion, onComplete]);

  if (!season) {
    return (
      <div className="glass-card p-6 text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Cargando Copa Davis...</p>
      </div>
    );
  }

  const country = (code: string) => season.countries[code];

  const handleMatchClick = (tie: DavisCupTie, match: DavisCupSeriesMatch) => {
    if (match.result || tie.winnerCode || tie.isBye) return;
    let p1: Player, p2: Player;
    if (match.isDoubles) {
      const p1a = getPlayer(match.player1Id)!, p1b = getPlayer(match.player1PartnerId!)!;
      const p2a = getPlayer(match.player2Id)!, p2b = getPlayer(match.player2PartnerId!)!;
      p1 = createDoublesPlayer(p1a, p1b);
      p2 = createDoublesPlayer(p2a, p2b);
    } else {
      p1 = getPlayer(match.player1Id)!;
      p2 = getPlayer(match.player2Id)!;
    }
    onMatchClick(p1, p2, match.id, tie.id);
  };

  const simTie = (tie: DavisCupTie) => {
    if (tie.winnerCode || tie.isBye) return;
    const resolved = simulateTie(tie, getPlayer);
    let updated = replaceTie(season, tie.id, () => resolved);
    updated = advanceFinalEight(updated);
    onSeasonChange(updated);
  };

  const renderMatch = (match: DavisCupSeriesMatch, tie: DavisCupTie) => {
    const isDecided = !!tie.winnerCode;
    const canPlay = !match.result && !isDecided && !tie.isBye;
    let p1Name: string, p2Name: string;
    if (match.isDoubles) {
      const p1a = getPlayer(match.player1Id), p1b = getPlayer(match.player1PartnerId!);
      const p2a = getPlayer(match.player2Id), p2b = getPlayer(match.player2PartnerId!);
      p1Name = `${p1a?.name.split(' ').pop()}/${p1b?.name.split(' ').pop()}`;
      p2Name = `${p2a?.name.split(' ').pop()}/${p2b?.name.split(' ').pop()}`;
    } else {
      p1Name = getPlayer(match.player1Id)?.name || "?";
      p2Name = getPlayer(match.player2Id)?.name || "?";
    }
    return (
      <div
        key={match.id}
        className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${canPlay ? "cursor-pointer hover:bg-primary/10 bg-secondary/20" : "bg-secondary/10"} ${isDecided && !match.result ? "opacity-40" : ""}`}
        onClick={() => canPlay && handleMatchClick(tie, match)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">M{match.matchNumber}</span>
            {match.isDoubles && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">DBL</Badge>}
          </div>
          <div className={`truncate ${match.country1Won === true ? "text-primary font-semibold" : ""}`}>{p1Name}</div>
          <div className={`truncate ${match.country1Won === false ? "text-primary font-semibold" : ""}`}>{p2Name}</div>
        </div>
        <div className="ml-2 min-w-[50px] text-right">
          {match.result ? (
            <div className="text-xs font-mono">
              {match.result.sets.map((set, i) => <span key={i} className="ml-1">{set.player1Games}-{set.player2Games}</span>)}
            </div>
          ) : canPlay ? <Play className="w-4 h-4 text-primary" /> : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </div>
    );
  };

  const renderTie = (tie: DavisCupTie) => {
    const isExpanded = expandedTie === tie.id;
    const c1 = country(tie.country1Code);
    const c2 = country(tie.country2Code);
    if (!c1 || !c2) return null;

    return (
      <div key={tie.id} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setExpandedTie(isExpanded ? null : tie.id)}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{c1.country}{c1.insufficientPlayers && <span className="text-[10px] text-muted-foreground ml-1">(sin roster)</span>}</span>
              <span className={`text-lg font-bold ${tie.winnerCode === c1.countryCode ? "text-primary" : ""}`}>{tie.series.country1Wins}</span>
              <span className="text-muted-foreground">-</span>
              <span className={`text-lg font-bold ${tie.winnerCode === c2.countryCode ? "text-primary" : ""}`}>{tie.series.country2Wins}</span>
              <span className="font-semibold text-sm">{c2.country}{c2.insufficientPlayers && <span className="text-[10px] text-muted-foreground ml-1">(sin roster)</span>}</span>
            </div>
            {tie.isBye && <Badge variant="outline" className="text-[10px]">Walkover</Badge>}
            {tie.winnerCode && !tie.isBye && <Badge variant="secondary" className="text-[10px]">{country(tie.winnerCode)?.country} avanza</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!tie.winnerCode && !tie.isBye && (
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={(e) => { e.stopPropagation(); simTie(tie); }}>
                <Zap className="w-3 h-3" /> Sim
              </Button>
            )}
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
        {isExpanded && !tie.isBye && (
          <div className="border-t border-border/30 p-3 space-y-1">
            {tie.series.matches.map(match => renderMatch(match, tie))}
          </div>
        )}
      </div>
    );
  };

  const renderTierSection = (title: string, ties: DavisCupTie[]) => {
    if (ties.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="font-display font-semibold text-sm text-muted-foreground">{title}</h4>
        <div className="space-y-2">{ties.map(renderTie)}</div>
      </div>
    );
  };

  const renderFinalEight = () => {
    const fe = season.finalEight;
    return (
      <div className="space-y-6 pr-4">
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Cuartos de Final</h3>
          {fe.quarterFinals.map(renderTie)}
        </div>
        {fe.semiFinals.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Semifinales</h3>
            {fe.semiFinals.map(renderTie)}
          </div>
        )}
        {fe.final && (
          <div className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 space-y-3">
            <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-display text-xl font-bold text-center">Final</h3>
            {renderTie(fe.final)}
          </div>
        )}
        {season.history.champion && (
          <div className="glass-card p-6 text-center bg-gradient-to-r from-green-500/20 to-green-500/5">
            <Trophy className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Campeón de la Copa Davis</p>
            <h3 className="font-display text-2xl font-bold text-primary">{country(season.history.champion)?.country}</h3>
          </div>
        )}
      </div>
    );
  };

  const weekLabel =
    currentWeek === DAVIS_CUP_FEB_WEEK ? "Qualifiers R1 · World Group I Playoff · Febrero" :
    currentWeek === DAVIS_CUP_SEPT_WEEK ? "Qualifiers R2 · World Group I & II Playoff · Septiembre" :
    currentWeek === DAVIS_CUP_FINAL8_WEEK ? "Final Eight · Bologna, Italia · Noviembre" : "";

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 bg-gradient-to-r from-green-500/10 to-transparent">
        <Badge className="mb-2 bg-green-500/20 text-green-600 border-green-500/30">Davis Cup</Badge>
        <h2 className="font-display text-2xl font-bold">Copa Davis — Temporada {season.season}</h2>
        <p className="text-sm text-muted-foreground">{weekLabel}</p>
      </div>

      <ScrollArea className="h-[500px]">
        {currentWeek === DAVIS_CUP_FEB_WEEK && (
          <div className="space-y-6 pr-4">
            {renderTierSection("Qualifiers R1", season.qualifiersR1)}
            {renderTierSection("World Group I Playoff", season.worldGroupIRound1)}
            {season.worldGroupIIPool.length > 0 && (
              <div className="glass-card p-3">
                <h4 className="font-display font-semibold text-sm text-muted-foreground mb-2">World Group II — no juega en febrero</h4>
                <p className="text-xs text-muted-foreground">
                  Estos {season.worldGroupIIPool.length} países esperan a septiembre para enfrentar a los perdedores de World Group I:{" "}
                  {season.worldGroupIIPool.map(c => season.countries[c]?.country).filter(Boolean).join(", ")}.
                </p>
              </div>
            )}
          </div>
        )}
        {currentWeek === DAVIS_CUP_SEPT_WEEK && (
          <div className="space-y-6 pr-4">
            {renderTierSection("Qualifiers R2", season.qualifiersR2)}
            {renderTierSection("World Group I Playoff", season.worldGroupIRound2)}
            {renderTierSection("World Group II Playoff", season.worldGroupIIRound2)}
          </div>
        )}
        {currentWeek === DAVIS_CUP_FINAL8_WEEK && renderFinalEight()}
      </ScrollArea>
    </div>
  );
};

export default DavisCupView;
