import React, { useEffect, useRef, useState } from "react";
import { PointLog, Shot, Vec2 } from "@/lib/pointSimulation";
import { Surface } from "@/data/players";

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
  /** Court surface, used purely for coloring the broadcast-style court. */
  surface?: Surface;
  /** True for tournaments played under a roof - overrides the surface's usual coloring with a
   * dark grey indoor-arena look, regardless of Hard/Clay/Grass. */
  indoor?: boolean;
  /** Text shown on the ad-strip banners ringing the court, e.g. "ATP World Tour · Vienna". */
  bannerLabel?: string;
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

// Broadcast court color theme per surface, plus a dedicated dark-grey indoor look that overrides
// whatever the underlying (still Hard/Clay/Grass) surface is - indoor is a roof, not a bounce type.
const SURFACE_THEME: Record<Surface, { court: string; courtIn: string; line: string; stand: string }> = {
  Hard: { court: "#1c6ba8", courtIn: "#2f86c9", line: "#f4f8fb", stand: "#0d2338" },
  Clay: { court: "#a2531f", courtIn: "#c1652a", line: "#f6e7d8", stand: "#3a2014" },
  Grass: { court: "#2c7a3a", courtIn: "#3c9a4c", line: "#f4f8fb", stand: "#0f2415" },
};
const INDOOR_THEME = { court: "#33383f", courtIn: "#3d434b", line: "#eef1f4", stand: "#15171b" };

const TennisCourt2D: React.FC<TennisCourt2DProps> = ({
  point, player1Name, player2Name, serverIsPlayer1, speedMultiplier, onComplete, onPointResolved,
  flipped = false, surface = "Hard", indoor = false, bannerLabel = "ATP World Tour",
}) => {
  const toSvg = (v: Vec2) => ({ x: v.x * 100, y: flipped ? v.y * 100 : (1 - v.y) * 100 });
  const { shots, outcome } = point;
  const theme = indoor ? INDOOR_THEME : SURFACE_THEME[surface];

  const [ballPos, setBallPos] = useState<Vec2>(shots[0]?.from ?? DEFAULT_SERVER_POS);
  const [ballTransitionMs, setBallTransitionMs] = useState(0);
  const [serverPos, setServerPos] = useState<Vec2>(DEFAULT_SERVER_POS);
  const [receiverPos, setReceiverPos] = useState<Vec2>(DEFAULT_RECEIVER_POS);
  const [posTransitionMs, setPosTransitionMs] = useState(0);
  const [caption, setCaption] = useState("");
  const [finalCaption, setFinalCaption] = useState<string | null>(null);
  const [ballLift, setBallLift] = useState(0);
  const [showTrail, setShowTrail] = useState(false);

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
    setShowTrail(false);
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
        setShowTrail(false);
        setFinalCaption(outcome.label);
        onPointResolved?.();
        const t = window.setTimeout(() => { if (!cancelled) onComplete(); }, Math.max(500, 900 / speedMultiplier));
        timeoutsRef.current.push(t);
        return;
      }

      const shot = shots[idx];
      const duration = durationForShot(shot, speedMultiplier);
      setCaption(shot.isFinal ? "" : shotStyleLabel[shot.style]);
      // Fast, flat shots get a brief comet trail; lobs/drop shots (slow, floaty) don't need one.
      setShowTrail(duration < 260 && shot.style !== "lob" && shot.style !== "dropShot");

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
        setShowTrail(false);

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
  // Ground shadow shrinks and fades the higher the ball is lifted, so a lofted lob visibly
  // separates from the court instead of looking glued to it.
  const shadowScale = Math.max(0.35, 1 - ballLift * 0.6);
  const shadowOpacity = Math.max(0.12, 0.4 - ballLift * 0.22);

  const serverName = serverIsPlayer1 ? player1Name : player2Name;
  const receiverName = serverIsPlayer1 ? player2Name : player1Name;
  const serverColor = serverIsPlayer1 ? "#3b82f6" : "#f97316";
  const receiverColor = serverIsPlayer1 ? "#f97316" : "#3b82f6";
  // Label placement follows whichever edge of the SVG a marker is actually near, not a fixed
  // "server=bottom" assumption - once ends switch (flipped=true) the server can be the one at top.
  const labelY = (svgY: number) => (svgY < 50 ? Math.max(svgY - 9, -12) : Math.min(svgY + 6, 108));

  const nameTag = (x: number, y: number, name: string, color: string, isServing: boolean, key: string) => (
    <foreignObject key={key} x={x - 16} y={y - 3.6} width="32" height="7.2" style={{ overflow: "visible", pointerEvents: "none" }}>
      <div
        // eslint-disable-next-line react/no-unknown-property
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1px",
          margin: "0 auto",
          width: "fit-content",
          maxWidth: "32px",
          padding: "0.6px 2.4px",
          borderRadius: "3.2px",
          background: "rgba(9, 12, 16, 0.72)",
          color: "#f5f7fa",
          fontSize: "3.4px",
          lineHeight: 1.5,
          fontWeight: 600,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          transition: `left ${posTransitionMs}ms linear, top ${posTransitionMs}ms linear`,
        }}
      >
        {isServing && (
          <span
            style={{
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              background: color,
              display: "inline-block",
              flexShrink: 0,
              boxShadow: `0 0 1.5px ${color}`,
            }}
          />
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      </div>
    </foreignObject>
  );

  return (
    <div className="relative w-full aspect-[3/4] max-h-[420px] mx-auto rounded-lg overflow-hidden select-none shadow-inner">
      <svg viewBox="-14 -14 128 128" className="w-full h-full" style={{ background: theme.stand }}>
        <defs>
          <linearGradient id="standTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.stand} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.stand} stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="standBottom" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={theme.stand} stopOpacity="1" />
            <stop offset="100%" stopColor={theme.stand} stopOpacity="0.35" />
          </linearGradient>
          <pattern id="netMesh" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" fill="#e7ebef" opacity="0.18" />
            <rect width="1" height="1" fill="#0a0e12" opacity="0.22" />
            <rect x="1" y="1" width="1" height="1" fill="#0a0e12" opacity="0.22" />
          </pattern>
          <radialGradient id="ballGradient" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="55%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          <radialGradient id="p1Gradient" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
          <radialGradient id="p2Gradient" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
        </defs>

        {/* stadium stands, filling the margin outside the doubles court */}
        <rect x="-14" y="-14" width="128" height="14" fill="url(#standTop)" />
        <rect x="-14" y="100" width="128" height="14" fill="url(#standBottom)" />
        {[-11, -8.5, -6].map((y) => (
          <line key={`sr-t-${y}`} x1="-14" y1={y} x2="114" y2={y} stroke="#000" strokeOpacity="0.15" strokeWidth="0.4" />
        ))}
        {[103, 105.5, 108].map((y) => (
          <line key={`sr-b-${y}`} x1="-14" y1={y} x2="114" y2={y} stroke="#000" strokeOpacity="0.15" strokeWidth="0.4" />
        ))}

        {/* ad-strip banners ringing the court */}
        <rect x="-14" y="-3.6" width="128" height="3.6" fill="#0b0f14" />
        <text x="50" y="-1" textAnchor="middle" fontSize="2.1" fontWeight="700" letterSpacing="0.4"
          fill="#d7e94a" style={{ textTransform: "uppercase" }}>
          {bannerLabel}
        </text>
        <rect x="-14" y="100" width="128" height="3.6" fill="#0b0f14" />
        <text x="50" y="102.6" textAnchor="middle" fontSize="2.1" fontWeight="700" letterSpacing="0.4"
          fill="#d7e94a" style={{ textTransform: "uppercase" }}>
          {bannerLabel}
        </text>

        {/* doubles-width court surface, with the singles/serving area in a slightly brighter shade */}
        <rect x="-8" y="0" width="116" height="100" fill={theme.court} />
        <rect x="0" y="0" width="100" height="100" fill={theme.courtIn} />

        {/* court lines */}
        <g stroke={theme.line} strokeWidth="0.8" fill="none" opacity="0.95">
          <rect x="-8" y="0" width="116" height="100" />
          <rect x="0" y="0" width="100" height="100" />
          <line x1="-8" y1="50" x2="108" y2="50" strokeWidth="1.1" opacity="0.6" />
          <line x1="0" y1="32" x2="100" y2="32" />
          <line x1="0" y1="68" x2="100" y2="68" />
          <line x1="50" y1="32" x2="50" y2="68" />
          <line x1="50" y1="0" x2="50" y2="3" />
          <line x1="50" y1="97" x2="50" y2="100" />
        </g>

        {/* net: checkered mesh band across the full doubles width, with post markers */}
        <rect x="-8" y="49.1" width="116" height="1.8" fill="url(#netMesh)" stroke={theme.line} strokeWidth="0.3" />
        <rect x="-8.6" y="48.6" width="1.2" height="2.8" rx="0.3" fill="#20242b" />
        <rect x="107.4" y="48.6" width="1.2" height="2.8" rx="0.3" fill="#20242b" />

        {/* receiver */}
        <g transform={`translate(${receiverSvg.x}, ${receiverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms linear` }}>
          <ellipse cx="0" cy="1.4" rx="3.1" ry="1.1" fill="#000" opacity="0.28" />
          <circle r="3.2" fill={serverIsPlayer1 ? "url(#p2Gradient)" : "url(#p1Gradient)"} stroke="white" strokeWidth="0.5" />
        </g>
        {nameTag(receiverSvg.x, labelY(receiverSvg.y), receiverName, receiverColor, false, "receiver-tag")}

        {/* server */}
        <g transform={`translate(${serverSvg.x}, ${serverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms linear` }}>
          <ellipse cx="0" cy="1.4" rx="3.1" ry="1.1" fill="#000" opacity="0.28" />
          <circle r="3.2" fill={serverIsPlayer1 ? "url(#p1Gradient)" : "url(#p2Gradient)"} stroke="white" strokeWidth="0.5" />
        </g>
        {nameTag(serverSvg.x, labelY(serverSvg.y), serverName, serverColor, true, "server-tag")}

        {/* ball ground shadow - shrinks and fades as the ball lifts off the court */}
        <ellipse
          cx={ballSvg.x} cy={ballSvg.y} rx={1.8 * shadowScale} ry={0.7 * shadowScale}
          fill="#000" opacity={shadowOpacity}
          style={{ transition: `cx ${ballTransitionMs}ms ease-out, cy ${ballTransitionMs}ms ease-out` }}
        />

        {/* comet trail - a faint, slower-moving echo of the ball on fast, flat shots */}
        {showTrail && (
          <g
            style={{ transition: `transform ${ballTransitionMs * 1.5}ms ease-out`, opacity: 0.4 }}
            transform={`translate(${ballSvg.x}, ${ballSvg.y - ballLiftPx})`}
          >
            <circle r="1.1" fill="#facc15" />
          </g>
        )}

        {/* ball */}
        <g style={{ transition: `transform ${ballTransitionMs}ms ease-out` }} transform={`translate(${ballSvg.x}, ${ballSvg.y - ballLiftPx})`}>
          <circle r="1.6" fill="url(#ballGradient)" stroke="#854d0e" strokeWidth="0.3" />
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
