/**
 * Point-by-point tennis simulation engine that powers the 2D visual match mode
 * (see VisualMatchSimulator.tsx / TennisCourt2D.tsx). This is a parallel engine to
 * matchEngine.ts's dice-based one - it keeps the same overall spirit (the better player,
 * per fictionalRanking + surfaceAffinity, is proportionally more likely to win) but resolves
 * every single point as a small rally with a from/to ball path so it can be animated on a
 * 2D court, and classifies each point into the outcome types a real tennis stat sheet has:
 * ace, double fault, winner, unforced error, forced error - each with a shot style/miss
 * direction for the on-screen caption.
 *
 * Everything is pre-computed up front into a SetLog[] the moment a match starts (deterministic
 * given Math.random()), so the visual player just plays back a fixed script at whatever speed
 * the user picks - there's no need to simulate in real time tied to animation frames.
 */

import { Player, Surface } from "@/data/players";
import { getEffectiveRankingDiff, MatchResult, SetScore } from "@/lib/matchEngine";

// ---------- Geometry ----------

export interface Vec2 { x: number; y: number; }

export type Side = "server" | "receiver";

export type ShotStyle =
  | "serve" | "return" | "crosscourt" | "downTheLine" | "lob" | "dropShot" | "approach" | "passingShot" | "smash";

export type PointOutcomeType = "ace" | "doubleFault" | "winner" | "unforcedError" | "forcedError";
export type MissType = "net" | "wide" | "long";

export interface Shot {
  shotNumber: number;
  hitterSide: Side;
  style: ShotStyle;
  from: Vec2;
  to: Vec2;
  /** 0 (flat, fast) to 1 (high arc, e.g. a lob) - purely for animation flavor. */
  arcHeight: number;
  isFinal: boolean;
  /** Where the hitter settles right after this shot (for the court view to move their marker). */
  hitterRestPos: Vec2;
  /** Where the OTHER player moves to in order to reach/chase this shot (clamped into court bounds
   * even when `to` itself lands out - it's their best-effort reach position). */
  chaserTargetPos: Vec2;
}

export interface PointOutcome {
  type: PointOutcomeType;
  missType?: MissType;
  winnerSide: Side;
  label: string;
}

export interface PointLog {
  shots: Shot[];
  outcome: PointOutcome;
  /** The actual player id serving THIS point - tracked per-point (not per-game) because serve
   * rotates mid-tiebreak, so the game-level "server" isn't always accurate for every point in it. */
  serverId: number;
  serverLabel: string;
  receiverLabel: string;
  isBreakPoint: boolean;
  isGamePoint: boolean;
  isSetPoint: boolean;
  isMatchPoint: boolean;
}

export interface GameLog {
  points: PointLog[];
  serverWonGame: boolean;
  wasBreak: boolean;
  isTiebreak: boolean;
  serverPlayerId: number;
}

export interface SetLog {
  games: GameLog[];
  setScore: SetScore;
}

export interface MatchPointStats {
  aces: number;
  doubleFaults: number;
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  pointsWon: number;
}

export interface VisualMatchResult extends MatchResult {
  setLogs: SetLog[];
  stats: { player1: MatchPointStats; player2: MatchPointStats };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const randRange = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function weightedPick<T extends string>(options: [T, number][]): T {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of options) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return options[options.length - 1][0];
}

// ---------- Probability model ----------

/** Chance the server wins a given point, before factoring out aces/double faults. */
function getServerPointWinProbability(server: Player, receiver: Player, surface?: Surface): number {
  const rankingDiff = getEffectiveRankingDiff(server, receiver, surface); // + means server is the better player
  const clamped = clamp(rankingDiff, -220, 220);
  const BASE = 0.62; // real-tennis-like baseline serve advantage before skill is factored in
  const skillFactor = clamped / 500;
  return clamp(BASE + skillFactor, 0.36, 0.9);
}

function getAceChance(server: Player, receiver: Player, surface?: Surface): number {
  const rankingDiff = getEffectiveRankingDiff(server, receiver, surface);
  const norm = clamp(rankingDiff / 200, -1, 1);
  const surfaceBonus = surface === "Grass" ? 0.02 : surface === "Clay" ? -0.015 : 0;
  return clamp(0.06 + norm * 0.05 + surfaceBonus, 0.02, 0.2);
}

function getDoubleFaultChance(server: Player, receiver: Player, surface?: Surface): number {
  const rankingDiff = getEffectiveRankingDiff(server, receiver, surface);
  const norm = clamp(rankingDiff / 200, -1, 1);
  return clamp(0.05 - norm * 0.02, 0.015, 0.08);
}

// ---------- Court geometry helpers ----------
// Normalized court: x in [0,1] (sideline to sideline), y in [0,1] (server baseline 0 -> net 0.5 -> receiver baseline 1).

const RALLY_STYLES: ShotStyle[] = ["crosscourt", "downTheLine", "lob", "dropShot", "approach"];
const WINNER_STYLES: ShotStyle[] = ["crosscourt", "downTheLine", "passingShot", "dropShot", "lob", "smash"];

const styleLabelEs: Record<ShotStyle, string> = {
  serve: "saque",
  return: "resto",
  crosscourt: "cruzado",
  downTheLine: "paralelo",
  lob: "globo",
  dropShot: "dejada",
  approach: "approach",
  passingShot: "passing shot",
  smash: "smash",
};

const missLabelEs: Record<MissType, string> = {
  net: "a la red",
  wide: "ancha",
  long: "larga",
};

function arcHeightFor(style: ShotStyle): number {
  switch (style) {
    case "lob": return 0.95;
    case "dropShot": return 0.1;
    case "serve": return 0.35;
    case "smash": return 0.5;
    default: return randRange(0.3, 0.55);
  }
}

/** A landing spot that is legitimately in play on `side`'s half of the court. */
function inPlayTarget(side: Side): Vec2 {
  if (side === "server") {
    return { x: randRange(0.08, 0.92), y: randRange(0.06, 0.46) };
  }
  return { x: randRange(0.08, 0.92), y: randRange(0.54, 0.94) };
}

function serveTarget(): Vec2 {
  // Lands just past the net into a service box.
  return { x: randRange(0.15, 0.85), y: randRange(0.52, 0.66) };
}

/** A near-the-line/corner spot on `side`'s half - used for a winner the opponent can't reach. */
function winnerTarget(side: Side, style: ShotStyle): Vec2 {
  const xEdge = Math.random() < 0.5 ? randRange(0.02, 0.12) : randRange(0.88, 0.98);
  if (style === "dropShot") {
    return { x: randRange(0.2, 0.8), y: side === "server" ? randRange(0.06, 0.16) : randRange(0.84, 0.94) };
  }
  if (style === "lob") {
    return { x: randRange(0.2, 0.8), y: side === "server" ? randRange(0.02, 0.08) : randRange(0.92, 0.98) };
  }
  return { x: xEdge, y: side === "server" ? randRange(0.1, 0.4) : randRange(0.6, 0.9) };
}

/** Where a missed shot ends up, given the type of miss and which side it was heading toward. */
function missTarget(headingToSide: Side, missType: MissType): Vec2 {
  if (missType === "net") {
    // Doesn't cross - lands just short of the net, on the HITTER's own side (the opposite of headingToSide).
    const hitterSide: Side = headingToSide === "server" ? "receiver" : "server";
    return { x: randRange(0.1, 0.9), y: hitterSide === "server" ? randRange(0.46, 0.5) : randRange(0.5, 0.54) };
  }
  if (missType === "wide") {
    const wideX = Math.random() < 0.5 ? randRange(-0.12, -0.02) : randRange(1.02, 1.12);
    return { x: wideX, y: headingToSide === "server" ? randRange(0.1, 0.4) : randRange(0.6, 0.9) };
  }
  // long
  return { x: randRange(0.15, 0.85), y: headingToSide === "server" ? randRange(-0.1, -0.02) : randRange(1.02, 1.1) };
}

function opposite(side: Side): Side {
  return side === "server" ? "receiver" : "server";
}

// ---------- Single point simulation ----------

function buildAcePoint(server: Player): { shots: Shot[]; outcome: PointOutcome } {
  const from: Vec2 = { x: randRange(0.3, 0.7), y: 0.02 };
  const to = winnerTarget("receiver", "serve");
  const shots: Shot[] = [{
    shotNumber: 1, hitterSide: "server", style: "serve", from, to, arcHeight: 0.3, isFinal: true,
    hitterRestPos: from, chaserTargetPos: { x: clamp(to.x, 0.05, 0.95), y: clamp(to.y, 0.55, 0.95) },
  }];
  return {
    shots,
    outcome: { type: "ace", winnerSide: "server", label: `¡ACE de ${server.name}!` },
  };
}

function buildDoubleFaultPoint(server: Player): { shots: Shot[]; outcome: PointOutcome } {
  const from: Vec2 = { x: randRange(0.3, 0.7), y: 0.02 };
  const missType: MissType = pick<MissType>(["net", "wide", "long"]);
  const to = missTarget("receiver", missType);
  const shots: Shot[] = [{
    shotNumber: 1, hitterSide: "server", style: "serve", from, to, arcHeight: 0.3, isFinal: true,
    hitterRestPos: from, chaserTargetPos: { x: 0.5, y: 0.85 }, // receiver never had to move for a DF
  }];
  return {
    shots,
    outcome: { type: "doubleFault", missType, winnerSide: "receiver", label: `Doble falta de ${server.name}` },
  };
}

function sampleShotCount(): number {
  let n = 2; // serve + return, minimum for a rally point
  let continueProb = 0.58;
  while (Math.random() < continueProb && n < 16) {
    n++;
    continueProb *= 0.9;
  }
  return n;
}

function buildRallyPoint(server: Player, receiver: Player, winnerSide: Side, surface: Surface | undefined): { shots: Shot[]; outcome: PointOutcome } {
  const narrativeType = weightedPick<"winner" | "unforcedError" | "forcedError">([
    ["winner", 0.42], ["unforcedError", 0.37], ["forcedError", 0.21],
  ]);
  const finalHitterSide: Side = narrativeType === "winner" ? winnerSide : opposite(winnerSide);
  const requiredParity: "odd" | "even" = finalHitterSide === "server" ? "odd" : "even";

  let n = sampleShotCount();
  const isOdd = n % 2 === 1;
  if ((requiredParity === "odd" && !isOdd) || (requiredParity === "even" && isOdd)) {
    n = n < 16 ? n + 1 : n - 1;
  }

  const finalStyle: ShotStyle = narrativeType === "winner" ? pick(WINNER_STYLES) : pick(RALLY_STYLES);
  const missType: MissType | undefined = narrativeType === "winner" ? undefined : weightedPick<MissType>([
    ["net", 0.4], ["wide", 0.32], ["long", 0.28],
  ]);

  const shots: Shot[] = [];
  let serverPos: Vec2 = { x: randRange(0.3, 0.7), y: 0.03 };
  let receiverPos: Vec2 = { x: randRange(0.3, 0.7), y: 0.97 };

  for (let i = 1; i <= n; i++) {
    const hitterSide: Side = i % 2 === 1 ? "server" : "receiver";
    const targetSide = opposite(hitterSide);
    const isFinal = i === n;
    const from = hitterSide === "server" ? serverPos : receiverPos;

    let style: ShotStyle;
    let to: Vec2;

    if (i === 1) {
      style = "serve";
      to = serveTarget();
    } else if (i === 2) {
      style = "return";
      to = isFinal
        ? (narrativeType === "winner" ? winnerTarget(targetSide, finalStyle) : missTarget(targetSide, missType!))
        : inPlayTarget(targetSide);
    } else if (isFinal) {
      style = finalStyle;
      to = narrativeType === "winner" ? winnerTarget(targetSide, finalStyle) : missTarget(targetSide, missType!);
    } else {
      style = pick(RALLY_STYLES);
      to = inPlayTarget(targetSide);
    }

    // The player who just hit recovers a little toward center; the side the ball is heading to
    // moves to intercept it (that's where their next shot will come "from").
    const recoverY = hitterSide === "server" ? 0.15 : 0.85;
    const recovered: Vec2 = { x: from.x * 0.4 + 0.5 * 0.6, y: recoverY };
    const landing: Vec2 = { x: clamp(to.x, 0.05, 0.95), y: clamp(to.y, targetSide === "server" ? 0.05 : 0.95, targetSide === "server" ? 0.45 : 0.95) };

    shots.push({
      shotNumber: i, hitterSide, style, from, to, arcHeight: arcHeightFor(style), isFinal,
      hitterRestPos: recovered, chaserTargetPos: landing,
    });

    if (hitterSide === "server") serverPos = recovered; else receiverPos = recovered;
    if (targetSide === "server") serverPos = landing; else receiverPos = landing;
  }

  const finalHitterName = finalHitterSide === "server" ? server.name : receiver.name;
  const label = narrativeType === "winner"
    ? `Winner de ${finalHitterName} (${styleLabelEs[finalStyle]})`
    : narrativeType === "unforcedError"
      ? `Error no forzado de ${finalHitterName} (${missLabelEs[missType!]})`
      : `Error forzado de ${finalHitterName} (${missLabelEs[missType!]})`;

  return {
    shots,
    outcome: { type: narrativeType, missType, winnerSide, label },
  };
}

function simulatePoint(server: Player, receiver: Player, surface: Surface | undefined): { shots: Shot[]; outcome: PointOutcome } {
  const winProb = getServerPointWinProbability(server, receiver, surface);
  const aceChance = getAceChance(server, receiver, surface);
  const dfChance = getDoubleFaultChance(server, receiver, surface);

  const roll = Math.random();
  if (roll < aceChance) return buildAcePoint(server);
  if (roll < aceChance + dfChance) return buildDoubleFaultPoint(server);

  // Re-derive the probability the server wins a "normal" (non-ace/DF) point so the overall
  // per-point win rate still matches winProb once ace/double-fault mass is accounted for.
  const rallyProb = clamp((winProb - aceChance) / (1 - aceChance - dfChance), 0.08, 0.92);
  const winnerSide: Side = Math.random() < rallyProb ? "server" : "receiver";
  return buildRallyPoint(server, receiver, winnerSide, surface);
}

// ---------- Score labels ----------

function gamePointLabel(points: number): string {
  return ["0", "15", "30", "40"][points] ?? "40";
}

function gameScoreLabels(serverPoints: number, receiverPoints: number): { server: string; receiver: string } {
  if (serverPoints >= 3 && receiverPoints >= 3) {
    if (serverPoints === receiverPoints) return { server: "Deuce", receiver: "Deuce" };
    if (serverPoints > receiverPoints) return { server: "Ventaja", receiver: "40" };
    return { server: "40", receiver: "Ventaja" };
  }
  return { server: gamePointLabel(serverPoints), receiver: gamePointLabel(receiverPoints) };
}

interface MatchContext {
  bestOf: 3 | 5;
  setsToWin: number;
  serverPlayerSets: number;
  receiverPlayerSets: number;
  serverPlayerGamesInSet: number;
  receiverPlayerGamesInSet: number;
}

function simulateGamePoints(
  server: Player,
  receiver: Player,
  surface: Surface | undefined,
  ctx: MatchContext,
): { points: PointLog[]; serverWonGame: boolean } {
  const points: PointLog[] = [];
  let serverPoints = 0;
  let receiverPoints = 0;

  while (true) {
    const isDecidingPoint =
      (serverPoints >= 3 || receiverPoints >= 3) && Math.abs(serverPoints - receiverPoints) <= 1;
    const serverGameWinNext = serverPoints >= 3 && (serverPoints - receiverPoints >= 1 || (serverPoints === 3 && receiverPoints < 3));
    const receiverGameWinNext = receiverPoints >= 3 && (receiverPoints - serverPoints >= 1 || (receiverPoints === 3 && serverPoints < 3));

    const wouldWinSetIfServer = ctx.serverPlayerGamesInSet + 1 >= 6 && (ctx.serverPlayerGamesInSet + 1) - ctx.receiverPlayerGamesInSet >= 2;
    const wouldWinSetIfReceiver = ctx.receiverPlayerGamesInSet + 1 >= 6 && (ctx.receiverPlayerGamesInSet + 1) - ctx.serverPlayerGamesInSet >= 2;
    const wouldWinMatchIfServer = wouldWinSetIfServer && ctx.serverPlayerSets + 1 >= ctx.setsToWin;
    const wouldWinMatchIfReceiver = wouldWinSetIfReceiver && ctx.receiverPlayerSets + 1 >= ctx.setsToWin;

    const isGamePoint = serverGameWinNext || receiverGameWinNext;
    const isBreakPoint = receiverGameWinNext;
    const isSetPoint = (serverGameWinNext && wouldWinSetIfServer) || (receiverGameWinNext && wouldWinSetIfReceiver);
    const isMatchPoint = (serverGameWinNext && wouldWinMatchIfServer) || (receiverGameWinNext && wouldWinMatchIfReceiver);

    const { shots, outcome } = simulatePoint(server, receiver, surface);
    if (outcome.winnerSide === "server") serverPoints++; else receiverPoints++;

    const labels = gameScoreLabels(serverPoints, receiverPoints);
    points.push({
      shots, outcome, serverId: server.id, serverLabel: labels.server, receiverLabel: labels.receiver,
      isBreakPoint: isBreakPoint && isDecidingPoint, isGamePoint: isGamePoint && isDecidingPoint,
      isSetPoint: isSetPoint && isDecidingPoint, isMatchPoint: isMatchPoint && isDecidingPoint,
    });

    if (serverPoints >= 4 && serverPoints - receiverPoints >= 2) return { points, serverWonGame: true };
    if (receiverPoints >= 4 && receiverPoints - serverPoints >= 2) return { points, serverWonGame: false };
  }
}

interface TiebreakContext {
  setsToWin: number;
  player1Sets: number;
  player2Sets: number;
}

function simulateTiebreakPoints(
  player1: Player, player2: Player, player1ServesFirst: boolean, surface: Surface | undefined, ctx: TiebreakContext,
): { points: PointLog[]; player1Points: number; player2Points: number; player1WonTiebreak: boolean } {
  const points: PointLog[] = [];
  let player1Points = 0;
  let player2Points = 0;
  let pointNumber = 0;
  let isPlayer1Serving = player1ServesFirst;

  while (true) {
    pointNumber++;
    const server = isPlayer1Serving ? player1 : player2;
    const receiver = isPlayer1Serving ? player2 : player1;

    const serverPts = isPlayer1Serving ? player1Points : player2Points;
    const receiverPts = isPlayer1Serving ? player2Points : player1Points;
    const isDecidingPoint = (serverPts >= 6 || receiverPts >= 6) && Math.abs(serverPts - receiverPts) <= 1;
    const serverTBWinNext = serverPts >= 6 && serverPts - receiverPts >= 1;
    const receiverTBWinNext = receiverPts >= 6 && receiverPts - serverPts >= 1;
    // Winning the tiebreak always wins the set, so a TB game/set point for whichever physical
    // player is currently serving/receiving is also a match point once it'd be their last set.
    const currentServerSets = isPlayer1Serving ? ctx.player1Sets : ctx.player2Sets;
    const currentReceiverSets = isPlayer1Serving ? ctx.player2Sets : ctx.player1Sets;
    const isMatchPoint = (serverTBWinNext && currentServerSets + 1 >= ctx.setsToWin) || (receiverTBWinNext && currentReceiverSets + 1 >= ctx.setsToWin);

    const { shots, outcome } = simulatePoint(server, receiver, surface);
    const serverWonPoint = outcome.winnerSide === "server";
    if (isPlayer1Serving) {
      if (serverWonPoint) player1Points++; else player2Points++;
    } else {
      if (serverWonPoint) player2Points++; else player1Points++;
    }

    points.push({
      shots, outcome, serverId: server.id,
      serverLabel: String(isPlayer1Serving ? player1Points : player2Points),
      receiverLabel: String(isPlayer1Serving ? player2Points : player1Points),
      isBreakPoint: false,
      isGamePoint: (serverTBWinNext || receiverTBWinNext) && isDecidingPoint,
      isSetPoint: (serverTBWinNext || receiverTBWinNext) && isDecidingPoint,
      isMatchPoint: isMatchPoint && isDecidingPoint,
    });

    const p1Done = player1Points >= 7 && player1Points - player2Points >= 2;
    const p2Done = player2Points >= 7 && player2Points - player1Points >= 2;
    if (p1Done || p2Done) return { points, player1Points, player2Points, player1WonTiebreak: p1Done };

    // Tiebreak serve rotation: first server serves point 1 alone, then alternate every 2 points.
    if (pointNumber === 1 || (pointNumber - 1) % 2 === 0) isPlayer1Serving = !isPlayer1Serving;
  }
}

function simulateSet(
  player1: Player, player2: Player, surface: Surface | undefined, player1ServesFirst: boolean,
  player1SetsWon: number, player2SetsWon: number, setsToWin: number, bestOf: 3 | 5,
): { setScore: SetScore; gameLogs: GameLog[]; nextServerIsPlayer1: boolean } {
  const gameLogs: GameLog[] = [];
  let player1Games = 0;
  let player2Games = 0;
  let isPlayer1Serving = player1ServesFirst;

  while (true) {
    if (player1Games === 6 && player2Games === 6) {
      const tb = simulateTiebreakPoints(player1, player2, isPlayer1Serving, surface, {
        setsToWin, player1Sets: player1SetsWon, player2Sets: player2SetsWon,
      });
      gameLogs.push({
        points: tb.points, serverWonGame: tb.player1WonTiebreak === isPlayer1Serving,
        wasBreak: false, isTiebreak: true, serverPlayerId: (isPlayer1Serving ? player1 : player2).id,
      });
      return {
        setScore: {
          player1Games: tb.player1WonTiebreak ? 7 : 6, player2Games: tb.player1WonTiebreak ? 6 : 7,
          tiebreak: { player1Points: tb.player1Points, player2Points: tb.player2Points },
        },
        gameLogs, nextServerIsPlayer1: !isPlayer1Serving,
      };
    }

    if ((player1Games >= 6 || player2Games >= 6) && Math.abs(player1Games - player2Games) >= 2) {
      return { setScore: { player1Games, player2Games }, gameLogs, nextServerIsPlayer1: isPlayer1Serving };
    }

    const server = isPlayer1Serving ? player1 : player2;
    const receiver = isPlayer1Serving ? player2 : player1;
    const { points, serverWonGame } = simulateGamePoints(server, receiver, surface, {
      bestOf, setsToWin, serverPlayerSets: isPlayer1Serving ? player1SetsWon : player2SetsWon,
      receiverPlayerSets: isPlayer1Serving ? player2SetsWon : player1SetsWon,
      serverPlayerGamesInSet: isPlayer1Serving ? player1Games : player2Games,
      receiverPlayerGamesInSet: isPlayer1Serving ? player2Games : player1Games,
    });

    gameLogs.push({ points, serverWonGame, wasBreak: !serverWonGame, isTiebreak: false, serverPlayerId: server.id });

    if (isPlayer1Serving) {
      if (serverWonGame) player1Games++; else player2Games++;
    } else {
      if (serverWonGame) player2Games++; else player1Games++;
    }
    isPlayer1Serving = !isPlayer1Serving;
  }
}

function tallyStats(setLogs: SetLog[], player1Id: number): { player1: MatchPointStats; player2: MatchPointStats } {
  const empty = (): MatchPointStats => ({ aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, forcedErrors: 0, pointsWon: 0 });
  const stats = { player1: empty(), player2: empty() };

  for (const set of setLogs) {
    for (const game of set.games) {
      for (const point of game.points) {
        const serverIsPlayer1 = point.serverId === player1Id;
        const winnerIsPlayer1 = (point.outcome.winnerSide === "server") === serverIsPlayer1;
        const winnerStats = winnerIsPlayer1 ? stats.player1 : stats.player2;
        const loserStats = winnerIsPlayer1 ? stats.player2 : stats.player1;
        winnerStats.pointsWon++;
        switch (point.outcome.type) {
          case "ace": winnerStats.aces++; break;
          case "doubleFault": loserStats.doubleFaults++; break;
          case "winner": winnerStats.winners++; break;
          case "unforcedError": loserStats.unforcedErrors++; break;
          case "forcedError": loserStats.forcedErrors++; break;
        }
      }
    }
  }
  return stats;
}

/** Full pre-computed point-by-point simulation of a match, for the 2D visual mode. */
export function simulateVisualMatch(player1: Player, player2: Player, bestOf: 3 | 5 = 3, surface?: Surface): VisualMatchResult {
  const setsToWin = bestOf === 3 ? 2 : 3;
  const setLogs: SetLog[] = [];
  let player1Sets = 0;
  let player2Sets = 0;
  let player1ServesFirst = Math.random() < 0.5;

  while (player1Sets < setsToWin && player2Sets < setsToWin) {
    const { setScore, gameLogs, nextServerIsPlayer1 } = simulateSet(
      player1, player2, surface, player1ServesFirst, player1Sets, player2Sets, setsToWin, bestOf,
    );
    setLogs.push({ games: gameLogs, setScore });
    if (setScore.player1Games > setScore.player2Games) player1Sets++; else player2Sets++;
    player1ServesFirst = nextServerIsPlayer1;
  }

  const winner = player1Sets > player2Sets ? player1 : player2;
  const loser = player1Sets > player2Sets ? player2 : player1;
  const stats = tallyStats(setLogs, player1.id);

  return {
    winner, loser,
    sets: setLogs.map(s => s.setScore),
    player1Sets, player2Sets,
    games: [], // not used by the visual mode; kept for MatchResult compatibility
    setLogs, stats,
  };
}
