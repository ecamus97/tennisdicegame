import React, { useState, useCallback, useEffect } from "react";
import { Player } from "@/data/players";
import { 
  MatchResult, 
  SetScore, 
  GameResult,
  rollDice, 
  getAdvantageLevel, 
  AdvantageLevel 
} from "@/lib/matchEngine";
import { playGameWithAdvantage } from "@/lib/gameLogic";
import Dice from "./Dice";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap, Users } from "lucide-react";

interface InteractiveMatchSimulatorProps {
  player1: Player;
  player2: Player;
  bestOf?: 3 | 5;
  onMatchComplete?: (result: MatchResult) => void;
  initialServerId?: number; // Which player serves first (player1.id or player2.id)
}

interface MatchState {
  player1Sets: number;
  player2Sets: number;
  player1Games: number;
  player2Games: number;
  player1TBPoints: number;
  player2TBPoints: number;
  isPlayer1Serving: boolean;
  isTiebreak: boolean;
  sets: SetScore[];
  games: GameResult[][];
  currentSetGames: GameResult[];
  // Track service game counts for advantage logic
  player1ServiceGames: number; // Total service games by P1 in current set
  player2ServiceGames: number; // Total service games by P2 in current set
  tbPointNumber: number;
  // Track who served first in tiebreak (for serve rotation)
  tiebreakFirstServer: boolean;
  // Track who served last game of previous set (for next set's first server)
  lastGameServerWasP1: boolean;
}

const InteractiveMatchSimulator: React.FC<InteractiveMatchSimulatorProps> = ({
  player1,
  player2,
  bestOf = 3,
  onMatchComplete,
  initialServerId,
}) => {
  // Determine who serves first
  const player1ServesFirst = initialServerId ? initialServerId === player1.id : true;

  const getInitialState = (): MatchState => ({
    player1Sets: 0,
    player2Sets: 0,
    player1Games: 0,
    player2Games: 0,
    player1TBPoints: 0,
    player2TBPoints: 0,
    isPlayer1Serving: player1ServesFirst,
    isTiebreak: false,
    sets: [],
    games: [],
    currentSetGames: [],
    player1ServiceGames: 0,
    player2ServiceGames: 0,
    tbPointNumber: 0,
    tiebreakFirstServer: player1ServesFirst,
    lastGameServerWasP1: player1ServesFirst,
  });

  const [matchState, setMatchState] = useState<MatchState>(getInitialState);
  const [currentRoll, setCurrentRoll] = useState<GameResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  // Track previous server for display after game ends
  const [lastServerWasP1, setLastServerWasP1] = useState(player1ServesFirst);

  // Reset when players change
  useEffect(() => {
    setMatchState(getInitialState());
    setCurrentRoll(null);
    setMatchComplete(false);
    setResult(null);
    setLastServerWasP1(player1ServesFirst);
  }, [player1.id, player2.id, initialServerId]);

  const setsToWin = bestOf === 3 ? 2 : 3;
  const rankingDiff = player2.fictionalRanking - player1.fictionalRanking;
  const advantageLevel = getAdvantageLevel(rankingDiff);
  const favoredPlayer = rankingDiff > 0 ? player1 : rankingDiff < 0 ? player2 : null;
  
  // Determine which player is higher ranked (for advantage logic)
  const isPlayer1HigherRanked = player1.fictionalRanking < player2.fictionalRanking;

  const rollForGame = async () => {
    setIsRolling(true);
    
    // Store current server before roll
    setLastServerWasP1(matchState.isPlayer1Serving);
    
    // Animate dice
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 60));
      setCurrentRoll({
        serverRoll: rollDice(),
        receiverRoll: rollDice(),
        serverWon: false,
        wasBreak: false,
      });
    }
    
    setIsRolling(false);

    const { 
      isPlayer1Serving, 
      isTiebreak, 
      player1ServiceGames, 
      player2ServiceGames,
      tbPointNumber 
    } = matchState;
    
    // Determine if higher ranked player is serving
    const isHigherRankedServing = isPlayer1HigherRanked ? isPlayer1Serving : !isPlayer1Serving;
    
    // Get service game counts for the higher and lower ranked players
    const higherRankedServiceCount = isPlayer1HigherRanked ? player1ServiceGames : player2ServiceGames;
    const lowerRankedServiceCount = isPlayer1HigherRanked ? player2ServiceGames : player1ServiceGames;
    
    const gameResult = playGameWithAdvantage({
      advantageLevel,
      isHigherRankedServing,
      higherRankedServiceGameCount: isHigherRankedServing ? higherRankedServiceCount + 1 : higherRankedServiceCount,
      lowerRankedServiceGameCount: !isHigherRankedServing ? lowerRankedServiceCount + 1 : lowerRankedServiceCount,
      isTiebreak,
    });
    
    setCurrentRoll(gameResult);
    
    // Update match state after a delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setMatchState(prev => {
      if (isTiebreak) {
        return updateTiebreakState(prev, gameResult, isPlayer1Serving);
      } else {
        return updateGameState(prev, gameResult, isPlayer1Serving);
      }
    });
  };

  const updateGameState = (prev: MatchState, gameResult: GameResult, isP1Serving: boolean): MatchState => {
    let { 
      player1Games, player2Games, player1Sets, player2Sets, 
      isPlayer1Serving, sets, games, currentSetGames,
      player1ServiceGames, player2ServiceGames
    } = prev;
    
    // Update service game count
    if (isP1Serving) {
      player1ServiceGames++;
    } else {
      player2ServiceGames++;
    }
    
    // Update game score
    if (isP1Serving) {
      if (gameResult.serverWon) player1Games++;
      else player2Games++;
    } else {
      if (gameResult.serverWon) player2Games++;
      else player1Games++;
    }
    
    currentSetGames = [...currentSetGames, gameResult];
    
    // Store who served this game (for set transition)
    const thisGameServerWasP1 = isP1Serving;
    
    // Switch server for next game
    const nextServer = !isPlayer1Serving;
    
    // Check for tiebreak
    if (player1Games === 6 && player2Games === 6) {
      return {
        ...prev,
        player1Games,
        player2Games,
        isPlayer1Serving: nextServer, // Who serves first point of tiebreak
        isTiebreak: true,
        currentSetGames,
        player1ServiceGames,
        player2ServiceGames,
        player1TBPoints: 0,
        player2TBPoints: 0,
        tbPointNumber: 0,
        tiebreakFirstServer: nextServer,
        lastGameServerWasP1: thisGameServerWasP1,
      };
    }
    
    // Check for set win
    if ((player1Games >= 6 || player2Games >= 6) && Math.abs(player1Games - player2Games) >= 2) {
      const setScore: SetScore = { player1Games, player2Games };
      const newSets = [...sets, setScore];
      const newGames = [...games, currentSetGames];
      
      if (player1Games > player2Games) {
        player1Sets++;
      } else {
        player2Sets++;
      }
      
      // IMPORTANT: Next set, the receiver of the last game serves first
      // Since this game just ended, the nextServer (who would have served) now serves first in new set
      const nextSetFirstServer = nextServer;
      
      // Check for match win
      if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        const winner = player1Sets > player2Sets ? player1 : player2;
        const loser = player1Sets > player2Sets ? player2 : player1;
        
        const matchResult: MatchResult = {
          winner,
          loser,
          sets: newSets,
          player1Sets,
          player2Sets,
          games: newGames,
        };
        
        setMatchComplete(true);
        setResult(matchResult);
        onMatchComplete?.(matchResult);
        
        return {
          ...prev,
          player1Games: 0,
          player2Games: 0,
          player1Sets,
          player2Sets,
          sets: newSets,
          games: newGames,
          currentSetGames: [],
          isPlayer1Serving: nextSetFirstServer,
          player1ServiceGames: 0,
          player2ServiceGames: 0,
          lastGameServerWasP1: thisGameServerWasP1,
        };
      }
      
      return {
        ...prev,
        player1Games: 0,
        player2Games: 0,
        player1Sets,
        player2Sets,
        sets: newSets,
        games: newGames,
        currentSetGames: [],
        isPlayer1Serving: nextSetFirstServer,
        player1ServiceGames: 0,
        player2ServiceGames: 0,
        lastGameServerWasP1: thisGameServerWasP1,
      };
    }
    
    return {
      ...prev,
      player1Games,
      player2Games,
      isPlayer1Serving: nextServer,
      currentSetGames,
      player1ServiceGames,
      player2ServiceGames,
      lastGameServerWasP1: thisGameServerWasP1,
    };
  };

  const updateTiebreakState = (prev: MatchState, gameResult: GameResult, isP1Serving: boolean): MatchState => {
    let { 
      player1TBPoints, player2TBPoints, player1Sets, player2Sets, 
      sets, games, currentSetGames, tbPointNumber, tiebreakFirstServer 
    } = prev;
    
    // Update tiebreak score
    if (isP1Serving) {
      if (gameResult.serverWon) player1TBPoints++;
      else player2TBPoints++;
    } else {
      if (gameResult.serverWon) player2TBPoints++;
      else player1TBPoints++;
    }
    
    currentSetGames = [...currentSetGames, gameResult];
    const newPointNumber = tbPointNumber + 1;
    
    // Tiebreak serve rotation: 1-2-2-2-2...
    // Point 1: first server
    // Points 2-3: second server
    // Points 4-5: first server
    // Points 6-7: second server, etc.
    let newIsPlayer1Serving: boolean;
    if (newPointNumber === 1) {
      // First point: first server continues
      newIsPlayer1Serving = tiebreakFirstServer;
    } else {
      // After first point, alternate every 2 points
      // Points 2,3 -> second server; 4,5 -> first server; 6,7 -> second; etc.
      const adjustedPoint = newPointNumber - 1; // 1,2,3,4,5,6...
      const segment = Math.floor((adjustedPoint - 1) / 2); // 0,0,1,1,2,2...
      // Even segments: second server; Odd segments: first server
      newIsPlayer1Serving = segment % 2 === 1 ? tiebreakFirstServer : !tiebreakFirstServer;
    }
    
    // Check for tiebreak win
    if ((player1TBPoints >= 7 || player2TBPoints >= 7) && Math.abs(player1TBPoints - player2TBPoints) >= 2) {
      const p1Won = player1TBPoints > player2TBPoints;
      const setScore: SetScore = {
        player1Games: p1Won ? 7 : 6,
        player2Games: p1Won ? 6 : 7,
        tiebreak: { player1Points: player1TBPoints, player2Points: player2TBPoints },
      };
      
      const newSets = [...sets, setScore];
      const newGames = [...games, currentSetGames];
      
      if (p1Won) player1Sets++;
      else player2Sets++;
      
      // After tiebreak, the player who received first in tiebreak serves first in next set
      const nextSetServer = !tiebreakFirstServer;
      
      // Check for match win
      if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        const winner = player1Sets > player2Sets ? player1 : player2;
        const loser = player1Sets > player2Sets ? player2 : player1;
        
        const matchResult: MatchResult = {
          winner,
          loser,
          sets: newSets,
          player1Sets,
          player2Sets,
          games: newGames,
        };
        
        setMatchComplete(true);
        setResult(matchResult);
        onMatchComplete?.(matchResult);
        
        return {
          ...prev,
          player1Games: 0,
          player2Games: 0,
          player1TBPoints: 0,
          player2TBPoints: 0,
          player1Sets,
          player2Sets,
          sets: newSets,
          games: newGames,
          currentSetGames: [],
          isTiebreak: false,
          isPlayer1Serving: nextSetServer,
          tbPointNumber: 0,
          player1ServiceGames: 0,
          player2ServiceGames: 0,
        };
      }
      
      return {
        ...prev,
        player1Games: 0,
        player2Games: 0,
        player1TBPoints: 0,
        player2TBPoints: 0,
        player1Sets,
        player2Sets,
        sets: newSets,
        games: newGames,
        currentSetGames: [],
        isTiebreak: false,
        isPlayer1Serving: nextSetServer,
        tbPointNumber: 0,
        player1ServiceGames: 0,
        player2ServiceGames: 0,
      };
    }
    
    return {
      ...prev,
      player1TBPoints,
      player2TBPoints,
      isPlayer1Serving: newIsPlayer1Serving,
      currentSetGames,
      tbPointNumber: newPointNumber,
    };
  };

  const simulateRestOfMatch = () => {
    // Continue from current state, simulating remaining games/sets
    import("@/lib/matchEngine").then(({ playSet }) => {
      let currentState = { ...matchState };
      const setsNeeded = setsToWin;
      
      // Simulate until match complete
      while (currentState.player1Sets < setsNeeded && currentState.player2Sets < setsNeeded) {
        // Finish current set if in progress
        while (
          !((currentState.player1Games >= 6 || currentState.player2Games >= 6) && 
            Math.abs(currentState.player1Games - currentState.player2Games) >= 2) &&
          !(currentState.player1Games === 7 || currentState.player2Games === 7)
        ) {
          // Check for tiebreak
          if (currentState.player1Games === 6 && currentState.player2Games === 6) {
            // Simulate tiebreak
            let tbP1 = currentState.player1TBPoints, tbP2 = currentState.player2TBPoints;
            while (!((tbP1 >= 7 || tbP2 >= 7) && Math.abs(tbP1 - tbP2) >= 2)) {
              const p1Roll = rollDice();
              const p2Roll = rollDice();
              if (p1Roll >= p2Roll) tbP1++;
              else tbP2++;
            }
            
            if (tbP1 > tbP2) {
              currentState.player1Games = 7;
              currentState.player1Sets++;
            } else {
              currentState.player2Games = 7;
              currentState.player2Sets++;
            }
            
            currentState.sets.push({
              player1Games: currentState.player1Games,
              player2Games: currentState.player2Games,
              tiebreak: { player1Points: tbP1, player2Points: tbP2 }
            });
            currentState.player1Games = 0;
            currentState.player2Games = 0;
            currentState.isPlayer1Serving = !currentState.tiebreakFirstServer;
            break;
          }
          
          // Simulate regular game
          const serverRoll = rollDice();
          const receiverRoll = rollDice();
          const serverWins = serverRoll >= receiverRoll;
          
          if (currentState.isPlayer1Serving) {
            if (serverWins) currentState.player1Games++;
            else currentState.player2Games++;
          } else {
            if (serverWins) currentState.player2Games++;
            else currentState.player1Games++;
          }
          
          currentState.isPlayer1Serving = !currentState.isPlayer1Serving;
        }
        
        // Check if set just finished (not via tiebreak)
        if ((currentState.player1Games >= 6 || currentState.player2Games >= 6) && 
            Math.abs(currentState.player1Games - currentState.player2Games) >= 2) {
          if (currentState.player1Games > currentState.player2Games) {
            currentState.player1Sets++;
          } else {
            currentState.player2Sets++;
          }
          currentState.sets.push({
            player1Games: currentState.player1Games,
            player2Games: currentState.player2Games
          });
          currentState.player1Games = 0;
          currentState.player2Games = 0;
          // Next set first server is who would have served next (already toggled)
        }
      }
      
      const winner = currentState.player1Sets > currentState.player2Sets ? player1 : player2;
      const loser = currentState.player1Sets > currentState.player2Sets ? player2 : player1;
      
      const matchResult: MatchResult = {
        winner,
        loser,
        sets: currentState.sets,
        player1Sets: currentState.player1Sets,
        player2Sets: currentState.player2Sets,
        games: currentState.games,
      };
      
      setResult(matchResult);
      setMatchComplete(true);
      setMatchState({
        ...currentState,
        isTiebreak: false,
      });
      onMatchComplete?.(matchResult);
    });
  };

  const resetMatch = () => {
    setMatchState(getInitialState());
    setCurrentRoll(null);
    setMatchComplete(false);
    setResult(null);
    setLastServerWasP1(player1ServesFirst);
  };

  const getCurrentServer = () => matchState.isPlayer1Serving ? player1 : player2;

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">
          {matchComplete ? "Match Complete" : "Match Simulator"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Best of {bestOf} sets {matchState.isTiebreak && "• TIEBREAK"}
        </p>
      </div>

      {/* Advantage indicator */}
      {advantageLevel !== "none" && favoredPlayer && (
        <div className="bg-secondary/50 rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{favoredPlayer.name}</span>: {advantageLevel} advantage
          </p>
        </div>
      )}

      {/* Score display */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-center">
          {/* Player 1 */}
          <div className={matchState.isPlayer1Serving ? "font-bold" : ""}>
            <div className="text-sm truncate">{player1.name}</div>
            <div className="text-xs text-muted-foreground">{player1.countryCode}</div>
          </div>
          
          {/* Score */}
          <div className="space-y-1">
            {/* Sets */}
            <div className="flex items-center justify-center gap-2 text-2xl font-display font-bold">
              <span className={matchState.player1Sets > matchState.player2Sets ? "text-primary" : ""}>
                {matchState.player1Sets}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={matchState.player2Sets > matchState.player1Sets ? "text-primary" : ""}>
                {matchState.player2Sets}
              </span>
            </div>
            
            {/* Games */}
            <div className="flex items-center justify-center gap-2 text-lg">
              <span>{matchState.isTiebreak ? matchState.player1TBPoints : matchState.player1Games}</span>
              <span className="text-muted-foreground text-sm">
                {matchState.isTiebreak ? "TB" : "games"}
              </span>
              <span>{matchState.isTiebreak ? matchState.player2TBPoints : matchState.player2Games}</span>
            </div>
            
            {/* Previous sets */}
            {matchState.sets.length > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {matchState.sets.map((set, i) => (
                  <span key={i}>
                    {set.player1Games}-{set.player2Games}
                    {set.tiebreak && <sup>({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})</sup>}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Player 2 */}
          <div className={!matchState.isPlayer1Serving ? "font-bold" : ""}>
            <div className="text-sm truncate">{player2.name}</div>
            <div className="text-xs text-muted-foreground">{player2.countryCode}</div>
          </div>
        </div>
        
        {/* Serving indicator */}
        {!matchComplete && (
          <div className="text-center mt-2 text-xs text-muted-foreground">
            🎾 {getCurrentServer().name} serving
          </div>
        )}
      </div>

      {/* Dice display */}
      {currentRoll && (
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <Dice 
              value={lastServerWasP1 ? currentRoll.serverRoll : currentRoll.receiverRoll} 
              isRolling={isRolling} 
              size="lg" 
              variant="primary" 
            />
            <p className="text-xs text-muted-foreground mt-1">{player1.name.split(" ").pop()}</p>
            {currentRoll.serverSecondRoll && lastServerWasP1 && (
              <p className="text-xs text-primary">2nd: {currentRoll.serverSecondRoll}</p>
            )}
            {currentRoll.receiverSecondRoll && !lastServerWasP1 && (
              <p className="text-xs text-primary">2nd: {currentRoll.receiverSecondRoll}</p>
            )}
          </div>
          <div className="text-xl font-display font-bold text-muted-foreground">VS</div>
          <div className="text-center">
            <Dice 
              value={lastServerWasP1 ? currentRoll.receiverRoll : currentRoll.serverRoll} 
              isRolling={isRolling} 
              size="lg" 
              variant="secondary" 
            />
            <p className="text-xs text-muted-foreground mt-1">{player2.name.split(" ").pop()}</p>
            {currentRoll.receiverSecondRoll && lastServerWasP1 && (
              <p className="text-xs text-primary">2nd: {currentRoll.receiverSecondRoll}</p>
            )}
            {currentRoll.serverSecondRoll && !lastServerWasP1 && (
              <p className="text-xs text-primary">2nd: {currentRoll.serverSecondRoll}</p>
            )}
          </div>
        </div>
      )}

      {/* Last result */}
      {currentRoll && !isRolling && !matchComplete && (
        <div className={`text-center text-sm font-medium ${
          currentRoll.wasBreak ? "text-destructive" : "text-primary"
        }`}>
          {currentRoll.wasBreak ? "BREAK! 🔥" : "Hold ✓"} • 
          {lastServerWasP1 
            ? (currentRoll.serverWon ? ` ${player1.name.split(" ").pop()} wins game` : ` ${player2.name.split(" ").pop()} breaks`)
            : (currentRoll.serverWon ? ` ${player2.name.split(" ").pop()} wins game` : ` ${player1.name.split(" ").pop()} breaks`)
          }
        </div>
      )}

      {/* Winner display */}
      {matchComplete && result && (
        <div className="text-center animate-bounce-in">
          <div className="text-lg font-display">
            🏆 <span className="text-primary font-bold">{result.winner.name}</span> wins! 🏆
          </div>
          <div className="text-xl font-display font-bold mt-1">
            {result.sets.map((set, i) => (
              <span key={i} className="mx-1">
                {set.player1Games}-{set.player2Games}
                {set.tiebreak && <sup>({Math.min(set.tiebreak.player1Points, set.tiebreak.player2Points)})</sup>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-2 flex-wrap">
        {!matchComplete ? (
          <>
            <Button
              onClick={rollForGame}
              disabled={isRolling}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isRolling ? "Rolling..." : matchState.isTiebreak ? "Roll Point" : "Roll Game"}
            </Button>
            <Button
              onClick={simulateRestOfMatch}
              disabled={isRolling}
              variant="secondary"
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Instant
            </Button>
          </>
        ) : (
          <Button onClick={resetMatch} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default InteractiveMatchSimulator;
