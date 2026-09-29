import React, { useEffect, useRef, useState } from "react";
import { Player, Surface } from "@/data/players";
import { MatchResult } from "@/lib/matchEngine";
import { simulateVisualMatch, VisualMatchResult, PointLog } from "@/lib/pointSimulation";
import TennisCourt2D from "./court/TennisCourt2D";
import { Button } from "@/components/ui/button";
import { Play, Pause, FastForward, Gauge, Trophy } from "lucide-react";

interface VisualMatchSimulatorProps {
  player1: Player;
  player2: Player;
  bestOf?: 3 | 5;
  onMatchComplete?: (result: MatchResult) => void;
  initialServerId?: number;
  surface?: Surface;
  h2hRecord?: { wins: number; losses: number };
  /** Short place name for the court's broadcast banner, e.g. "Vienna" or "Roland Garros". */
  tournamentLocation?: string;
  /** True for tournaments played under a roof (Basel, Vienna, Paris Masters, ATP Finals...) - a
   * purely cosmetic flag that tints the court dark grey regardless of its Hard/Clay/Grass surface. */
  indoor?: boolean;
}

const VisualMatchSimulator: React.FC<VisualMatchSimulatorProps> = ({
  player1, player2, bestOf = 3, onMatchComplete, surface, h2hRecord, tournamentLocation, indoor,
}) => {
  const [matchResult, setMatchResult] = useState<VisualMatchResult>(() => simulateVisualMatch(player1, player2, bestOf, surface));
  const [setIdx, setSetIdx] = useState(0);
  const [gameIdx, setGameIdx] = useState(0);
  const [pointIdx, setPointIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [matchComplete, setMatchComplete] = useState(false);
  const [reportedComplete, setReportedComplete] = useState(false);
  // Whether the CURRENT point's outcome has actually been revealed on court yet. Until it has,
  // the scoreboard should keep showing the score from BEFORE this point (not jump straight to the
  // result the instant the point starts playing) - see currentPoint.preServerLabel/preReceiverLabel.
  const [pointResolved, setPointResolved] = useState(false);

  // Reset whenever the actual matchup changes (new modal instance for a different match).
  useEffect(() => {
    setMatchResult(simulateVisualMatch(player1, player2, bestOf, surface));
    setSetIdx(0);
    setGameIdx(0);
    setPointIdx(0);
    setIsPlaying(true);
    setMatchComplete(false);
    setReportedComplete(false);
    setPointResolved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player1.id, player2.id, bestOf, surface]);

  // A new point is loading - the scoreboard should start each one showing the pre-point score again.
  useEffect(() => {
    setPointResolved(false);
  }, [setIdx, gameIdx, pointIdx]);

  const currentSetLog = matchResult.setLogs[setIdx];
  const currentGameLog = currentSetLog?.games[gameIdx];
  const currentPoint: PointLog | undefined = currentGameLog?.points[pointIdx];

  // Running games/sets tally derived from how far playback has progressed (not the final result),
  // so the scoreboard fills in point by point like a real broadcast rather than showing the end state.
  const setsWonSoFar = { player1: 0, player2: 0 };
  for (let s = 0; s < setIdx; s++) {
    const sc = matchResult.setLogs[s].setScore;
    if (sc.player1Games > sc.player2Games) setsWonSoFar.player1++; else setsWonSoFar.player2++;
  }
  const gamesWonSoFar = { player1: 0, player2: 0 };
  if (currentSetLog) {
    for (let g = 0; g < gameIdx; g++) {
      const gl = currentSetLog.games[g];
      const serverIsPlayer1 = gl.points[0]?.serverId === player1.id;
      const player1WonGame = gl.serverWonGame === serverIsPlayer1;
      if (player1WonGame) gamesWonSoFar.player1++; else gamesWonSoFar.player2++;
    }
  }
  const isTiebreak = currentGameLog?.isTiebreak ?? false;

  const advance = () => {
    if (!currentGameLog || !currentSetLog) return;

    if (pointIdx + 1 < currentGameLog.points.length) {
      setPointIdx(pointIdx + 1);
      return;
    }
    // game finished
    if (gameIdx + 1 < currentSetLog.games.length) {
      setGameIdx(gameIdx + 1);
      setPointIdx(0);
      return;
    }
    // set finished
    if (setIdx + 1 < matchResult.setLogs.length) {
      setSetIdx(setIdx + 1);
      setGameIdx(0);
      setPointIdx(0);
      return;
    }
    // match finished
    setMatchComplete(true);
  };

  useEffect(() => {
    if (matchComplete && !reportedComplete) {
      setReportedComplete(true);
      onMatchComplete?.(matchResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchComplete]);

  const skipToEnd = () => {
    setIsPlaying(false);
    setMatchComplete(true);
  };

  const serverIsPlayer1 = currentPoint ? currentPoint.serverId === player1.id : true;
  // The court view is always rendered server-at-bottom internally; "flipped" mirrors it vertically
  // whenever the CURRENT server's real assigned end (per the change-of-ends rule) is the top instead.
  const flipped = currentPoint ? serverIsPlayer1 !== currentPoint.player1DefendsBottomEnd : false;

  // Briefly flag when the players have just switched ends, so the change is noticeable rather than
  // just quietly happening in the background.
  const [showSideSwitch, setShowSideSwitch] = useState(false);
  const lastFlipRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (!currentPoint) return;
    if (lastFlipRef.current !== null && lastFlipRef.current !== flipped) {
      setShowSideSwitch(true);
      const t = window.setTimeout(() => setShowSideSwitch(false), 2200);
      lastFlipRef.current = flipped;
      return () => window.clearTimeout(t);
    }
    lastFlipRef.current = flipped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIdx, gameIdx, flipped]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">
          {matchComplete ? "Partido terminado" : "Modo 2D en vivo"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Al mejor de {bestOf} sets {isTiebreak && !matchComplete && "• TIEBREAK"}
        </p>
        {showSideSwitch && !matchComplete && (
          <p className="text-xs text-primary font-medium mt-1 animate-slide-up">🔄 Cambio de lado</p>
        )}
      </div>

      {h2hRecord && (
        <div className="text-center text-xs text-muted-foreground bg-secondary/20 rounded px-3 py-1.5">
          {h2hRecord.wins === 0 && h2hRecord.losses === 0
            ? <span className="opacity-60">H2H: Sin enfrentamientos previos</span>
            : <>
                H2H: <span className="text-green-400 font-medium">{h2hRecord.wins}G</span> - <span className="text-red-400 font-medium">{h2hRecord.losses}P</span>
                <span className="ml-2 opacity-60">({h2hRecord.wins + h2hRecord.losses} partidos)</span>
              </>
          }
        </div>
      )}

      {/* Score display - broadcast-style: a colored dot marks the server (name itself stays plain
          weight), the games score in the current set is the big primary number, and the in-game
          points sit underneath as a smaller secondary line. */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-center">
          <div className="flex items-center justify-center gap-1.5 min-w-0">
            {!matchComplete && serverIsPlayer1 && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#3b82f6" }} aria-hidden="true" />
            )}
            <div className="min-w-0">
              <div className="text-sm truncate">{player1.name}</div>
              <div className="text-xs text-muted-foreground">{player1.countryCode}</div>
            </div>
          </div>

          <div className="space-y-0.5">
            {!matchComplete && (
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Set {setIdx + 1}{isTiebreak && " · Tiebreak"} · Sets {setsWonSoFar.player1}-{setsWonSoFar.player2}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-2xl font-display font-bold">
              {matchComplete ? (
                <>
                  <span className={matchResult.player1Sets > matchResult.player2Sets ? "text-primary" : ""}>
                    {matchResult.player1Sets}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={matchResult.player2Sets > matchResult.player1Sets ? "text-primary" : ""}>
                    {matchResult.player2Sets}
                  </span>
                </>
              ) : (
                <>
                  <span>{gamesWonSoFar.player1}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{gamesWonSoFar.player2}</span>
                </>
              )}
            </div>

            {!matchComplete && currentPoint && (() => {
              const serverPts = pointResolved ? currentPoint.serverLabel : currentPoint.preServerLabel;
              const receiverPts = pointResolved ? currentPoint.receiverLabel : currentPoint.preReceiverLabel;
              return (
                <div className="flex items-center justify-center gap-1.5 text-sm font-display text-muted-foreground">
                  <span>{serverIsPlayer1 ? serverPts : receiverPts}</span>
                  <span>-</span>
                  <span>{serverIsPlayer1 ? receiverPts : serverPts}</span>
                </div>
              );
            })()}

            {matchComplete && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {matchResult.sets.map((set, i) => (
                  <span key={i}>
                    {set.player1Games}-{set.player2Games}
                    {set.tiebreak && <sup>({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})</sup>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 min-w-0">
            <div className="min-w-0">
              <div className="text-sm truncate">{player2.name}</div>
              <div className="text-xs text-muted-foreground">{player2.countryCode}</div>
            </div>
            {!matchComplete && !serverIsPlayer1 && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#f97316" }} aria-hidden="true" />
            )}
          </div>
        </div>

        {!matchComplete && (currentPoint?.isMatchPoint || currentPoint?.isSetPoint || currentPoint?.isBreakPoint || currentPoint?.isGamePoint) && (
          <div className="text-center mt-2 text-xs text-muted-foreground">
            {currentPoint?.isMatchPoint && <span className="text-destructive font-semibold">MATCH POINT</span>}
            {!currentPoint?.isMatchPoint && currentPoint?.isSetPoint && <span className="text-primary font-semibold">SET POINT</span>}
            {!currentPoint?.isMatchPoint && !currentPoint?.isSetPoint && currentPoint?.isBreakPoint && <span className="text-destructive font-semibold">BREAK POINT</span>}
            {!currentPoint?.isMatchPoint && !currentPoint?.isSetPoint && !currentPoint?.isBreakPoint && currentPoint?.isGamePoint && <span className="text-primary font-semibold">GAME POINT</span>}
          </div>
        )}
      </div>

      {/* Court */}
      {!matchComplete && currentPoint && (
        <TennisCourt2D
          key={`${setIdx}-${gameIdx}-${pointIdx}`}
          point={currentPoint}
          player1Name={player1.name}
          player2Name={player2.name}
          serverIsPlayer1={serverIsPlayer1}
          speedMultiplier={isPlaying ? speed : 0}
          onComplete={advance}
          onPointResolved={() => setPointResolved(true)}
          flipped={flipped}
          surface={surface}
          indoor={indoor}
          bannerLabel={tournamentLocation ? `ATP World Tour · ${tournamentLocation}` : "ATP World Tour"}
        />
      )}

      {matchComplete && (
        <div className="text-center animate-bounce-in">
          <div className="text-lg font-display flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-primary font-bold">{matchResult.winner.name}</span> gana!
          </div>
          <div className="text-xl font-display font-bold mt-1">
            {matchResult.sets.map((set, i) => (
              <span key={i} className="mx-1">
                {set.player1Games}-{set.player2Games}
                {set.tiebreak && <sup>({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})</sup>}
              </span>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground">{player1.name.split(" ").pop()}</div>
              <div>Aces: {matchResult.stats.player1.aces} • Winners: {matchResult.stats.player1.winners}</div>
              <div>Dobles faltas: {matchResult.stats.player1.doubleFaults} • Errores no forz.: {matchResult.stats.player1.unforcedErrors}</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{player2.name.split(" ").pop()}</div>
              <div>Aces: {matchResult.stats.player2.aces} • Winners: {matchResult.stats.player2.winners}</div>
              <div>Dobles faltas: {matchResult.stats.player2.doubleFaults} • Errores no forz.: {matchResult.stats.player2.unforcedErrors}</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {!matchComplete && (
        <div className="flex justify-center gap-2 flex-wrap">
          <Button onClick={() => setIsPlaying(p => !p)} variant={isPlaying ? "outline" : "default"} className="gap-2">
            {isPlaying ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Reanudar</>}
          </Button>
          <Button onClick={() => setSpeed(s => (s === 1 ? 2 : 1))} variant="outline" className="gap-2">
            <Gauge className="w-4 h-4" />
            {speed === 1 ? "1x" : "2x"}
          </Button>
          <Button onClick={skipToEnd} variant="secondary" className="gap-2">
            <FastForward className="w-4 h-4" />
            Saltar al resultado
          </Button>
        </div>
      )}
    </div>
  );
};

export default VisualMatchSimulator;
