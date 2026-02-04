import { Player } from "@/data/players";

export interface GameResult {
  serverRoll: number;
  receiverRoll: number;
  serverSecondRoll?: number;
  receiverSecondRoll?: number;
  serverWon: boolean;
  wasBreak: boolean;
}

export interface SetScore {
  player1Games: number;
  player2Games: number;
  tiebreak?: {
    player1Points: number;
    player2Points: number;
  };
}

export interface MatchResult {
  winner: Player;
  loser: Player;
  sets: SetScore[];
  player1Sets: number;
  player2Sets: number;
  games: GameResult[][];
}

export type AdvantageLevel = "none" | "small" | "clear" | "dominant";

export const rollDice = (): number => Math.floor(Math.random() * 6) + 1;

export const getAdvantageLevel = (rankingDiff: number): AdvantageLevel => {
  const absDiff = Math.abs(rankingDiff);
  if (absDiff < 16) return "none";
  if (absDiff < 32) return "small";
  if (absDiff < 64) return "clear";
  return "dominant";
};

export const getAdvantageDescription = (level: AdvantageLevel): string => {
  switch (level) {
    case "none": return "No advantage - pure dice roll";
    case "small": return "Small advantage - 2nd serve attempt every other game";
    case "clear": return "Clear advantage - always 2nd serve attempt";
    case "dominant": return "Dominant - 2nd attempt on serve + break chances";
  }
};

interface PlayGameOptions {
  server: Player;
  receiver: Player;
  advantageLevel: AdvantageLevel;
  isHigherRankedServing: boolean;
  gameNumber: number;
  isTiebreak: boolean;
}

export const playGame = (options: PlayGameOptions): GameResult => {
  const { server, receiver, advantageLevel, isHigherRankedServing, gameNumber, isTiebreak } = options;
  
  let serverRoll = rollDice();
  let receiverRoll = rollDice();
  let serverSecondRoll: number | undefined;
  let receiverSecondRoll: number | undefined;
  
  // Apply advantage rules - when re-rolling, BOTH players re-roll
  if (!isTiebreak || advantageLevel === "clear" || advantageLevel === "dominant") {
    if (isHigherRankedServing) {
      // Server is higher ranked
      switch (advantageLevel) {
        case "small":
          // Second attempt every other serve game
          if (gameNumber % 2 === 0 && serverRoll < receiverRoll) {
            // Both players re-roll
            serverSecondRoll = rollDice();
            receiverSecondRoll = rollDice();
            // Use second rolls for the result
            serverRoll = serverSecondRoll;
            receiverRoll = receiverSecondRoll;
          }
          break;
        case "clear":
        case "dominant":
          // Always second attempt
          if (serverRoll < receiverRoll) {
            // Both players re-roll
            serverSecondRoll = rollDice();
            receiverSecondRoll = rollDice();
            // Use second rolls for the result
            serverRoll = serverSecondRoll;
            receiverRoll = receiverSecondRoll;
          }
          break;
      }
    } else if (advantageLevel === "dominant" && !isTiebreak) {
      // Receiver is higher ranked (dominant)
      // Every other game, second attempt to break
      if (gameNumber % 2 === 0 && receiverRoll <= serverRoll) {
        // Both players re-roll
        serverSecondRoll = rollDice();
        receiverSecondRoll = rollDice();
        // Use second rolls for the result
        serverRoll = serverSecondRoll;
        receiverRoll = receiverSecondRoll;
      }
    }
  }
  
  const serverWon = serverRoll >= receiverRoll;
  const wasBreak = !serverWon;
  
  return {
    serverRoll,
    receiverRoll,
    serverSecondRoll,
    receiverSecondRoll,
    serverWon,
    wasBreak,
  };
};

export const playSet = (player1: Player, player2: Player, rankingDiff: number): { setScore: SetScore; games: GameResult[] } => {
  const games: GameResult[] = [];
  let player1Games = 0;
  let player2Games = 0;
  let gameNumber = 0;
  let isPlayer1Serving = true;
  
  const advantageLevel = getAdvantageLevel(rankingDiff);
  
  while (true) {
    // Check for tiebreak
    if (player1Games === 6 && player2Games === 6) {
      const tiebreakResult = playTiebreak(player1, player2, rankingDiff);
      return {
        setScore: {
          player1Games: tiebreakResult.player1Won ? 7 : 6,
          player2Games: tiebreakResult.player1Won ? 6 : 7,
          tiebreak: {
            player1Points: tiebreakResult.player1Points,
            player2Points: tiebreakResult.player2Points,
          },
        },
        games: [...games, ...tiebreakResult.pointResults],
      };
    }
    
    // Check for set win
    if ((player1Games >= 6 || player2Games >= 6) && Math.abs(player1Games - player2Games) >= 2) {
      return {
        setScore: { player1Games, player2Games },
        games,
      };
    }
    
    gameNumber++;
    const server = isPlayer1Serving ? player1 : player2;
    const receiver = isPlayer1Serving ? player2 : player1;
    const isHigherRankedServing = (rankingDiff > 0 && isPlayer1Serving) || (rankingDiff < 0 && !isPlayer1Serving);
    
    const gameResult = playGame({
      server,
      receiver,
      advantageLevel,
      isHigherRankedServing,
      gameNumber,
      isTiebreak: false,
    });
    
    games.push(gameResult);
    
    if (isPlayer1Serving) {
      if (gameResult.serverWon) player1Games++;
      else player2Games++;
    } else {
      if (gameResult.serverWon) player2Games++;
      else player1Games++;
    }
    
    isPlayer1Serving = !isPlayer1Serving;
  }
};

interface TiebreakResult {
  player1Won: boolean;
  player1Points: number;
  player2Points: number;
  pointResults: GameResult[];
}

const playTiebreak = (player1: Player, player2: Player, rankingDiff: number): TiebreakResult => {
  const pointResults: GameResult[] = [];
  let player1Points = 0;
  let player2Points = 0;
  let pointNumber = 0;
  let isPlayer1Serving = true;
  
  const advantageLevel = getAdvantageLevel(rankingDiff);
  
  while (true) {
    if ((player1Points >= 7 || player2Points >= 7) && Math.abs(player1Points - player2Points) >= 2) {
      return {
        player1Won: player1Points > player2Points,
        player1Points,
        player2Points,
        pointResults,
      };
    }
    
    pointNumber++;
    const server = isPlayer1Serving ? player1 : player2;
    const receiver = isPlayer1Serving ? player2 : player1;
    const isHigherRankedServing = (rankingDiff > 0 && isPlayer1Serving) || (rankingDiff < 0 && !isPlayer1Serving);
    
    const pointResult = playGame({
      server,
      receiver,
      advantageLevel,
      isHigherRankedServing,
      gameNumber: pointNumber,
      isTiebreak: true,
    });
    
    pointResults.push(pointResult);
    
    if (isPlayer1Serving) {
      if (pointResult.serverWon) player1Points++;
      else player2Points++;
    } else {
      if (pointResult.serverWon) player2Points++;
      else player1Points++;
    }
    
    // Tiebreak serve rotation: first player serves 1, then alternate every 2
    if (pointNumber === 1 || (pointNumber > 1 && (pointNumber - 1) % 2 === 0)) {
      isPlayer1Serving = !isPlayer1Serving;
    }
  }
};

export const playMatch = (player1: Player, player2: Player, bestOf: 3 | 5 = 3): MatchResult => {
  const rankingDiff = player2.fictionalRanking - player1.fictionalRanking; // Positive if player1 is higher ranked
  const setsToWin = bestOf === 3 ? 2 : 3;
  
  const sets: SetScore[] = [];
  const allGames: GameResult[][] = [];
  let player1Sets = 0;
  let player2Sets = 0;
  
  while (player1Sets < setsToWin && player2Sets < setsToWin) {
    const { setScore, games } = playSet(player1, player2, rankingDiff);
    sets.push(setScore);
    allGames.push(games);
    
    if (setScore.player1Games > setScore.player2Games) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }
  
  const winner = player1Sets > player2Sets ? player1 : player2;
  const loser = player1Sets > player2Sets ? player2 : player1;
  
  return {
    winner,
    loser,
    sets,
    player1Sets,
    player2Sets,
    games: allGames,
  };
};

export const formatMatchScore = (result: MatchResult, player1: Player): string => {
  const isPlayer1Winner = result.winner.id === player1.id;
  
  return result.sets.map(set => {
    const p1Games = isPlayer1Winner ? Math.max(set.player1Games, set.player2Games) : Math.min(set.player1Games, set.player2Games);
    const p2Games = isPlayer1Winner ? Math.min(set.player1Games, set.player2Games) : Math.max(set.player1Games, set.player2Games);
    
    if (set.tiebreak) {
      const tbLoserPoints = Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points);
      return `7-6(${tbLoserPoints})`;
    }
    return `${p1Games}-${p2Games}`;
  }).join(" ");
};
