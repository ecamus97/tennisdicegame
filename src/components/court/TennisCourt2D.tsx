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
// The outer "court" shade is the decorative doubles alley; "courtIn" is the brighter singles/play
// area, kept clearly lighter so the alley reads as its own lane rather than blending into it.
const SURFACE_THEME: Record<Surface, { court: string; courtIn: string; line: string }> = {
  Hard: { court: "#155e97", courtIn: "#3390d6", line: "#f7fafc" },
  Clay: { court: "#8f4419", courtIn: "#cc6b2c", line: "#f8ecdf" },
  Grass: { court: "#255f2f", courtIn: "#419e50", line: "#f7fafc" },
};
const INDOOR_THEME = { court: "#26292f", courtIn: "#454b54", line: "#f0f2f5" };

// The stadium stands and ad-strip always use this fixed broadcast-neutral palette, independent of
// court surface, so the "arena" framing stays consistent whichever surface is being played on.
const STAND_FAR = "#0a0d12"; // edge of the stands, furthest from the court
const STAND_NEAR = "#1a2230"; // edge closest to the court, just behind the ad-strip
const STAND_SEAM = "#05070a"; // crisp seam separating the stand band from the ad-strip

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
  // A brief bounce mark at the last shot's actual landing spot - "in" (bright ring) for a winner,
  // "out" (red ring) for a wide/long error, so it's visually obvious where the ball actually hit
  // instead of only being explained by the caption text.
  const [bounceMark, setBounceMark] = useState<{ pos: Vec2; kind: "in" | "out" } | null>(null);

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
    setBounceMark(null);
    setBallPos(shots[0].from);
    // shots[0] is always the serve, so its "from" is the server's real, correctly-diagonal starting
    // spot for this point (deuce/ad side of the T). The receiver's ready position should mirror that
    // diagonally too (a real returner stands roughly opposite the server, not dead-center) - snapping
    // to a fixed DEFAULT_RECEIVER_POS here was the bug that made the whole setup look "not diagonal"
    // even though the server's own position was already correct.
    setServerPos(shots[0].hitterSide === "server" ? shots[0].from : DEFAULT_SERVER_POS);
    setReceiverPos(
      shots[0].hitterSide === "receiver"
        ? shots[0].from
        : { x: 1 - shots[0].from.x, y: DEFAULT_RECEIVER_POS.y }
    );

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
        // Net misses land just short of the net (still technically in bounds) so they don't get a
        // bounce mark - only a genuine winner (in) or a wide/long error (out) does.
        const lastShot = shots[shots.length - 1];
        if (lastShot && outcome.type === "winner") {
          setBounceMark({ pos: lastShot.to, kind: "in" });
        } else if (lastShot && outcome.missType && outcome.missType !== "net") {
          setBounceMark({ pos: lastShot.to, kind: "out" });
        }
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
  // Labels are always nudged toward the net (center) rather than toward the baseline, so they never
  // stray into the stands/ad-strip margin that now surrounds the court.
  const labelY = (svgY: number) => (svgY < 50 ? Math.min(svgY + 6, 46) : Math.max(svgY - 6, 54));

  // The tag is wrapped in its own <g transform="translate(...)"> using the SAME CSS transition as
  // the player's circle group below, instead of animating the foreignObject's x/y attributes
  // directly (those are plain SVG attributes, not CSS properties, so they can't be transitioned and
  // would otherwise snap to the new spot instantly - which is what made the tag look like it moved
  // ahead of the circle it's supposed to be glued to).
  const nameTag = (x: number, y: number, name: string, color: string, isServing: boolean, key: string) => (
    <g key={key} transform={`translate(${x}, ${y})`} style={{ transition: `transform ${posTransitionMs}ms ease-out` }}>
      <foreignObject x="-16" y="-3.6" width="32" height="7.2" style={{ overflow: "visible", pointerEvents: "none" }}>
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
    </g>
  );

  return (
    <div className="relative w-full aspect-[3/4] max-h-[420px] mx-auto rounded-lg overflow-hidden select-none shadow-inner">
      <svg viewBox="-14 -14 128 128" className="w-full h-full" style={{ background: theme.stand }}>
        <defs>
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
          <radialGradient id="p1Gradient" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="p2Gradient" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          <linearGradient id="standTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STAND_FAR} />
            <stop offset="100%" stopColor={STAND_NEAR} />
          </linearGradient>
          <linearGradient id="standBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STAND_NEAR} />
            <stop offset="100%" stopColor={STAND_FAR} />
          </linearGradient>
          <pattern id="seatRows" width="128" height="1.6" patternUnits="userSpaceOnUse">
            <rect width="128" height="0.8" fill="#ffffff" opacity="0.045" />
          </pattern>
        </defs>

        {/* stadium stands, filling the margin outside the doubles court, with faint seat-row
            banding so they read as tiered seating instead of a flat rectangle */}
        <rect x="-14" y="-14" width="128" height="14" fill="url(#standTop)" />
        <rect x="-14" y="-14" width="128" height="14" fill="url(#seatRows)" />
        <rect x="-14" y="100" width="128" height="14" fill="url(#standBottom)" />
        <rect x="-14" y="100" width="128" height="14" fill="url(#seatRows)" />
        {/* crisp seam separating the stands from the ad-strip banner */}
        <line x1="-14" y1="-3.6" x2="114" y2="-3.6" stroke={STAND_SEAM} strokeWidth="0.4" />
        <line x1="-14" y1="103.6" x2="114" y2="103.6" stroke={STAND_SEAM} strokeWidth="0.4" />

        {/* ad-strip banners ringing the court, sitting between the stands and the court itself */}
        <rect x="-14" y="-3.6" width="128" height="3.6" fill="#0b0f14" />
        <rect x="-14" y="-3.6" width="128" height="3.6" fill="url(#seatRows)" opacity="0.5" />
        <text x="50" y="-1" textAnchor="middle" fontSize="2.1" fontWeight="700" letterSpacing="0.4"
          fill="#d7e94a" style={{ textTransform: "uppercase" }}>
          {bannerLabel}
        </text>
        <rect x="-14" y="100" width="128" height="3.6" fill="#0b0f14" />
        <rect x="-14" y="100" width="128" height="3.6" fill="url(#seatRows)" opacity="0.5" />
        <text x="50" y="102.6" textAnchor="middle" fontSize="2.1" fontWeight="700" letterSpacing="0.4"
          fill="#d7e94a" style={{ textTransform: "uppercase" }}>
          {bannerLabel}
        </text>

        {/* doubles-width court surface (the decorative alley) with the brighter singles/play area
            inset on top of it, plus a bright doubles sideline so the alley clearly reads as a lane */}
        <rect x="-8" y="0" width="116" height="100" fill={theme.court} />
        <rect x="0" y="0" width="100" height="100" fill={theme.courtIn} />
        <rect x="-8" y="0" width="116" height="100" fill="none" stroke={theme.line} strokeWidth="0.5" opacity="0.8" />

        {/* court lines */}
        <g stroke={theme.line} strokeWidth="0.8" fill="none" opacity="0.95">
          <rect x="0" y="0" width="100" height="100" />
          <line x1="-8" y1="50" x2="108" y2="50" strokeWidth="1.1" opacity="0.6" />
          <line x1="0" y1="32" x2="100" y2="32" />
          <line x1="0" y1="68" x2="100" y2="68" />
          <line x1="50" y1="32" x2="50" y2="68" />
          <line x1="50" y1="0" x2="50" y2="3" />
          <line x1="50" y1="97" x2="50" y2="100" />
        </g>

        {/* net: checkered mesh band across the full doubles width, with a bright top cord and posts */}
        <rect x="-8" y="48.9" width="116" height="2.2" fill="url(#netMesh)" stroke={theme.line} strokeWidth="0.2" />
        <line x1="-8" y1="48.9" x2="108" y2="48.9" stroke={theme.line} strokeWidth="0.5" opacity="0.9" />
        <rect x="-8.7" y="48.2" width="1.4" height="3.6" rx="0.3" fill="#14171c" stroke="#000" strokeWidth="0.1" />
        <rect x="107.3" y="48.2" width="1.4" height="3.6" rx="0.3" fill="#14171c" stroke="#000" strokeWidth="0.1" />

        {/* receiver */}
        <g transform={`translate(${receiverSvg.x}, ${receiverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms ease-out` }}>
          <ellipse cx="0" cy="1.4" rx="3.1" ry="1.1" fill="#000" opacity="0.28" />
          <circle r="3.2" fill={serverIsPlayer1 ? "url(#p2Gradient)" : "url(#p1Gradient)"} stroke="white" strokeWidth="0.5" />
        </g>
        {nameTag(receiverSvg.x, labelY(receiverSvg.y), receiverName, receiverColor, false, "receiver-tag")}

        {/* server */}
        <g transform={`translate(${serverSvg.x}, ${serverSvg.y})`} style={{ transition: `transform ${posTransitionMs}ms ease-out` }}>
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

        {/* bounce mark - a quick expanding ring at the actual landing spot of the final shot, so a
            winner or a wide/long error is visibly marked instead of only explained by the caption */}
        {bounceMark && (() => {
          const p = toSvg(bounceMark.pos);
          const color = bounceMark.kind === "out" ? "#ef4444" : "#f5f7fa";
          return (
            <g key={`${bounceMark.pos.x}-${bounceMark.pos.y}-${bounceMark.kind}`}>
              <circle cx={p.x} cy={p.y} r="0.6" fill="none" stroke={color} strokeWidth="0.7" opacity="0.9">
                <animate attributeName="r" from="0.6" to="4.5" dur="0.7s" fill="freeze" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.7s" fill="freeze" />
              </circle>
              <circle cx={p.x} cy={p.y} r="0.5" fill={color} opacity="0.8">
                <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze" />
              </circle>
            </g>
          );
        })()}
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
