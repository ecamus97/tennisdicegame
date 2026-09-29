import React, { useEffect, useRef, useState } from "react";
import { PointLog, Shot, Vec2 } from "@/lib/pointSimulation";

interface TennisCourt2DProps {
  point: PointLog;
  player1Name: string;
  player2Name: string;
  /** Which physical player (1 or 2) is serving this point - purely for labeling/coloring. */
  serverIsPlayer1: boolean;
  /** 1 = normal speed, 2 = fast, Infinity (or <=0) = skip straight to onComplete with no animation. */
  speedMultiplier: number;
  onComplete: () => void;
  /** Fired the instant the point's outcome is decided (when the final caption appears) - BEFORE
   * the completion delay that leads to onComplete. Lets the parent flip the scoreboard from the
   * pre-point score to the post-point score in sync with the outcome being revealed, instead of
   * jumping the number the moment the point starts playing. */
  onPointResolved?: () => void;
  /** True when the current server's assigned end (per the real "change ends" rule) is the top of
   * the court instead of the bottom. All shot geometry is computed server-at-bottom internally, so
   * this just mirrors the rendering vertically - it never changes the simulation itself. */
  flipped?: boolean;
}

const DEFAULT_SERVER_POS: Vec2 = { x: 0.5, y: 0.06 };
const DEFAULT_RECEIVER_POS: Vec2 = { x: 0.5, y: 0.94 };

// How fast the ball actually travels for each type of shot, relative to a neutral groundstroke.
// >1 = faster (shorter duration), <1 = slower (longer duration) - e.g. a smash or serve should
// whip across the court noticeably quicker than a lofted lob or a delicately touched drop shot.
const STYLE_SPEED_FACTOR: Record<Shot["style"], number> = {
  serve: 1.3,
  firstServeFault: 1.3,
  smash: 1.55,
  passingShot: 1.2,
  downTheLine: 1.1,
  return: 1.05,
  approach: 1.05,
  crosscourt: 1.0,
  lob: 0.55,
  dropShot: 0.5,
};

function durationForShot(shot: Shot, speedMultiplier: number): number {
  const dist = Math.hypot(shot.to.x - shot.from.x, shot.to.y - shot.from.y);
  const base = 260 + dist * 480 + shot.arcHeight * 200;
  const styleFactor = STYLE_SPEED_FACTOR[shot.style] ?? 1;
  return Math.max(90, base / (speedMultiplier * styleFactor));
}

const shotStyleLabel: Record<Shot["style"], string> = {
  serve: "Saque",
  firstServeFault: "Falta (1er saque)",
  return: "Resto",
  crosscourt: "Cruzado",
  downTheLine: "Paralelo",
  lob: "Globo",
  dropShot: "Dejada",
  approach: "Approach",
  passingShot: "Passing shot",
  smash: "Smash",
};

const TennisCourt2D: React.FC<TennisCourt2DProps> = ({
  point, player1Name, player2Name, serverIsPlayer1, speedMultiplier, onComplete, onPointResolved, flipped = false,
}) => {
  const toSvg = (v: Vec2) => ({ x: v.x * 100, y: flipped ? v.y * 100 : (1 - v.y) * 100 });
  const { shots, outcome } = point;

  const [ballPos, setBallPos] = useState<Vec2>(shots[0]?.from ?? DEFAULT_SERVER_POS);
  const [ballTransitionMs, setBallTransitionMs] = useState(0);
  const [serverPos, setServerPos] = useState<Vec2>(DEFAULT_SERVER_POS);
  const [receiverPos, setReceiverPos] = useState<Vec2>(DEFAULT_RECEIVER_POS);
  const [posTransitionMs, setPosTransitionMs] = useState(0);
  const [caption, setCaption] = useState("");
  const [finalCaption, setFinalCaption] = useState<string | null>(null);
  const [ballLift, setBallLift] = useState(0);

  const timeoutsRef = useRef<number[]>([]);
  const rafRef = useRef<number>();

  useEffect(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (!shots.length) {
      onComplete();
      return;
    }

    setFinalCaption(null);
    setCaption("");
    setBallLift(0);
    setBallTransitionMs(0);
    setPosTransitionMs(0);
    setBallPos(shots[0].from);
    setServerPos(shots[0].hitterSide === "server" ? shots[0].from : DEFAULT_SERVER_POS);
    setReceiverPos(shots[0].hitterSide === "receiver" ? shots[0].from : DEFAULT_RECEIVER_POS);

    // Paused - stay frozen on the point's opening frame; no timers, no onComplete, until resumed
    // (a positive, finite speedMultiplier) re-runs this effect and plays the point from the top.
    if (!Number.isFinite(speedMultiplier) || speedMultiplier <= 0) {
      return;
    }

    let cancelled = false;

    const playShot = (idx: number) => {
      if (cancelled) return;
      if (idx >= shots.length) {
        setCaption("");
        setFinalCaption(outcome.label);
        onPointResolved?.();
        const t = window.setTimeout(() => { if (!cancelled) onComplete(); }, Math.max(500, 900 / speedMultiplier));
        timeoutsRef.current.push(t);
        return;
      }

      const shot = shots[idx];
      const duration = durationForShot(shot, speedMultiplier);
      setCaption(shot.isFinal ? "" : shotStyleLabel[shot.style]);

      rafRef.current = requestAnimationFrame(() => {
        if (cancelled) return;
        setPosTransitionMs(duration);
        setBallTransitionMs(duration);
        setBallPos(shot.to);
        setBallLift(shot.arcHeight);
        if (shot.hitterSide === "server") {
          setReceiverPos(shot.chaserTargetPos);
          setServerPos(shot.hitterRestPos);
        } else {
          setServerPos(shot.chaserTargetPos);
          setReceiverPos(shot.hitterRestPos);
        }
      });

      const t = window.setTimeout(() => {
        if (cancelled) return;
        setBallLift(0);

        // A missed first serve does NOT end the point - the server gets a second serve from
        // (roughly) the same spot. Snap the ball and server back there instantly, hold on a
        // "Segundo saque" caption for a beat, THEN play the next shot. Without this the ball would
        // otherwise animate straight from wherever the fault landed (out of bounds) into the next
        // serve's target, which reads as the players starting to rally out of nowhere.
        if (shot.style === "firstServeFault" && idx + 1 < shots.length) {
          const nextFrom = shots[idx + 1].from;
          setBallTransitionMs(0);
          setPosTransitionMs(0);
          setBallPos(nextFrom);
          setServerPos(nextFrom);
          setCaption("Segundo saque");
          const pauseMs = Math.max(260, 380 / speedMultiplier);
          const t2 = window.setTimeout(() => { if (!cancelled) playShot(idx + 1); }, pauseMs);
          timeoutsRef.current.push(t2);
          return;
        }

        playShot(idx + 1);
      }, duration + 30);
      timeoutsRef.current.push(t);
    };

    const kickoff = requestAnimationFrame(() => playShot(0));

    return () => {
      cancelled = true;
      cancelAnimationFrame(kickoff);
      timeoutsRef.current.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shots, speedMultiplier]);

  const ballSvg = toSvg(ballPos);
  const serverSvg = toSvg(serverPos);
  const receiverSvg = toSvg(receiverPos);
  const ballLiftPx = ballLift * 14; // purely visual vertical "hop" for lobs/drop shots

  const serverName = serverIsPlayer1 ? player1Name : player2Name;
  const receiverName = serverIsPlayer1 ? player2Name : player1Name;
  // Label placement follows whichever edge of the SVG a marker is actually near, not a fixed
  // "server=bottom" assumption - once ends switch (flipped=true) the server can be the one at top.
  const labelY = (svgY: number) => (svgY < 50 ? Math.max(svgY - 5, -10) : Math.min(svgY + 8, 112));

  return (
    <div className="relative w-full aspect-[3/4] max-h-[420px] mx-auto rounded-lg overflow-hidden select-none">
      <svg viewBox="-14 -14 128 128" className="w-full h-full">
        {/* grass background with a simple mowing-stripe pattern */}
        <defs>
          <pattern id="stripes" width="100" height="12.5" patternUnits="userSpaceOnUse">
            <rect width="100" height="12.5" fill="#2f7d3a" />
            <rect width="100" height="6.25" fill="#347f40" />
          </pattern>
        </defs>
        <rect x="-14" y="-14" width="128" height="128" fill="url(#stripes)" />

        {/* court lines */}
        <g stroke="white" strokeWidth="0.8" fill="none" opacity="0.95">
          <rect x="0" y="0" width="100" height="100" />
          <line x1="0" y1="50" x2="100" y2="50" strokeWidth="1.2" />
          <line x1="0" y1="32" x2="100" y2="32" />
          <line x1="0" y1="68" x2="100" y2="68" />
          <line x1="50" y1="32" x2="50" y2="68" />
          <line x1="50" y1="0" x2="50" y2="3" />
          <line x1="50" y1="97" x2="50" y2="100" />
        </g>
        {/* net */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="1.5,1" />

        {/* receiver */}
        <g transform={`translate(${receiverSvg.x}, ${receiverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms linear` }}>
          <circle r="3.2" fill={serverIsPlayer1 ? "#f97316" : "#3b82f6"} stroke="white" strokeWidth="0.5" />
        </g>
        <text x={receiverSvg.x} y={labelY(receiverSvg.y)} textAnchor="middle" fontSize="4" fill="white" style={{ transition: `x ${posTransitionMs}ms linear` }}>
          {receiverName}
        </text>

        {/* server */}
        <g transform={`translate(${serverSvg.x}, ${serverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms linear` }}>
          <circle r="3.2" fill={serverIsPlayer1 ? "#3b82f6" : "#f97316"} stroke="white" strokeWidth="0.5" />
        </g>
        <text x={serverSvg.x} y={labelY(serverSvg.y)} textAnchor="middle" fontSize="4" fill="white" style={{ transition: `x ${posTransitionMs}ms linear` }}>
          {serverName}
        </text>

        {/* ball */}
        <g style={{ transition: `transform ${ballTransitionMs}ms ease-out` }} transform={`translate(${ballSvg.x}, ${ballSvg.y - ballLiftPx})`}>
          <circle r="1.6" fill="#facc15" stroke="#854d0e" strokeWidth="0.3" />
        </g>
      </svg>

      {caption && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded-full border border-border">
          {caption}
        </div>
      )}
      {finalCaption && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center px-4">
          <div className="bg-primary text-primary-foreground text-sm sm:text-base font-display font-semibold px-4 py-2 rounded-lg shadow-lg text-center animate-slide-up">
            {finalCaption}
          </div>
        </div>
      )}
    </div>
  );
};

export default TennisCourt2D;
