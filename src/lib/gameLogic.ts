import { Player } from "@/data/players";

export interface GameResult {
  serverRoll: number;
  receiverRoll: number;
  serverSecondRoll?: number;
  receiverSecondRoll?: number;
  serverWon: boolean;
  wasBreak: boolean;
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
    case "clear": return "Clear advantage - always 2nd serve attempt + applies in tiebreak";
    case "dominant": return "Dominant - 2nd attempt on serve + break chances";
  }
};

/**
 * Play a single game/point following the exact advantage rules:
 * 
 * Ranking Difference < 16: No advantage
 * - Each player rolls one die per game
 * - Server wins if roll >= opponent
 * - Receiver breaks if roll > server
 * - Tiebreak: same logic per point
 * 
 * Ranking Difference >= 16 and < 32: Small advantage
 * - On own serve: every other service game → second attempt allowed
 * - On opponent serve: no advantage
 * - Tiebreak: no advantage
 * 
 * Ranking Difference >= 32 and < 64: Clear advantage
 * - On own serve: always allowed a second attempt
 * - Tiebreak: advantage applies (2nd attempt on own serve)
 * 
 * Ranking Difference >= 64: Dominant advantage
 * - On own serve: always second attempt
 * - On opponent serve: every other game → second attempt to break
 * - Tiebreak: advantage only on own serve
 * 
 * @param isHigherRankedServing - Whether the higher-ranked player is serving
 * @param higherRankedServiceGameCount - Count of service games by higher-ranked player (for "every other" logic)
 * @param lowerRankedServiceGameCount - Count of service games by lower-ranked player (for "every other" break attempts)
 * @param isTiebreak - Whether this is a tiebreak point
 */
export interface PlayGameOptions {
  advantageLevel: AdvantageLevel;
  isHigherRankedServing: boolean;
  higherRankedServiceGameCount: number;
  lowerRankedServiceGameCount: number;
  isTiebreak: boolean;
}

export const playGameWithAdvantage = (options: PlayGameOptions): GameResult => {
  const { 
    advantageLevel, 
    isHigherRankedServing, 
    higherRankedServiceGameCount,
    lowerRankedServiceGameCount,
    isTiebreak 
  } = options;
  
  let serverRoll = rollDice();
  let receiverRoll = rollDice();
  let serverSecondRoll: number | undefined;
  let receiverSecondRoll: number | undefined;

  // No advantage level - pure dice rolls
  if (advantageLevel === "none") {
    const serverWon = serverRoll >= receiverRoll;
    return {
      serverRoll,
      receiverRoll,
      serverWon,
      wasBreak: !serverWon,
    };
  }

  // Small advantage (diff 16-31)
  if (advantageLevel === "small") {
    // Only on own serve, every other service game
    // Tiebreak: no advantage
    if (isHigherRankedServing && !isTiebreak) {
      // Check if this is an "every other" game (games 2, 4, 6, etc. by higher ranked)
      if (higherRankedServiceGameCount % 2 === 0 && serverRoll < receiverRoll) {
        // Both players re-roll
        serverSecondRoll = rollDice();
        receiverSecondRoll = rollDice();
        serverRoll = serverSecondRoll;
        receiverRoll = receiverSecondRoll;
      }
    }
    // On opponent serve: no advantage
  }

  // Clear advantage (diff 32-63)
  if (advantageLevel === "clear") {
    // On own serve: always allowed a second attempt
    // Tiebreak: advantage applies
    if (isHigherRankedServing) {
      if (serverRoll < receiverRoll) {
        // Both players re-roll
        serverSecondRoll = rollDice();
        receiverSecondRoll = rollDice();
        serverRoll = serverSecondRoll;
        receiverRoll = receiverSecondRoll;
      }
    }
    // On opponent serve: no advantage (not receiving, higher ranked is server here)
  }

  // Dominant advantage (diff >= 64)
  if (advantageLevel === "dominant") {
    if (isHigherRankedServing) {
      // On own serve: always second attempt
      if (serverRoll < receiverRoll) {
        // Both players re-roll
        serverSecondRoll = rollDice();
        receiverSecondRoll = rollDice();
        serverRoll = serverSecondRoll;
        receiverRoll = receiverSecondRoll;
      }
    } else {
      // Higher ranked is receiving (lower ranked is serving)
      // Tiebreak: advantage only on own serve (so no break advantage in TB)
      if (!isTiebreak) {
        // On opponent serve: every other game → second attempt to break
        // lowerRankedServiceGameCount is how many games the lower ranked has served
        if (lowerRankedServiceGameCount % 2 === 0 && receiverRoll <= serverRoll) {
          // Both players re-roll
          serverSecondRoll = rollDice();
          receiverSecondRoll = rollDice();
          serverRoll = serverSecondRoll;
          receiverRoll = receiverSecondRoll;
        }
      }
    }
  }

  const serverWon = serverRoll >= receiverRoll;
  
  return {
    serverRoll,
    receiverRoll,
    serverSecondRoll,
    receiverSecondRoll,
    serverWon,
    wasBreak: !serverWon,
  };
};
