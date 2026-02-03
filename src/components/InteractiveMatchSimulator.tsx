import React, { useState, useCallback } from "react";
import { Player } from "@/data/players";
import { 
  MatchResult, 
  SetScore, 
  GameResult,
  rollDice, 
  getAdvantageLevel, 
  getAdvantageDescription,
  AdvantageLevel 
} from "@/lib/matchEngine";
import Dice from "./Dice";
import PlayerCard from "./PlayerCard";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap, ChevronRight } from "lucide-react";

interface InteractiveMatchSimulatorProps {
  player1: Player;
  player2: Player;
  bestOf?: 3 | 5;
  onMatchComplete?: (result: MatchResult) => void;
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
  gameNumber: number;
  tbPointNumber: number;
}

const initialMatchState: MatchState = {
  player1Sets: 0,
  player2Sets: 0,
  player1Games: 0,
  player2Games: 0,
  player1TBPoints: 0,
  player2TBPoints: 0,
  isPlayer1Serving: true,
  isTiebreak: false,
  sets: [],
  games: [],
  currentSetGames: [],
  gameNumber: 0,
  tbPointNumber: 0,
};

const InteractiveMatchSimulator: React.FC<InteractiveMatchSimulatorProps> = ({
  player1,
  player2,
  bestOf = 3,
  onMatchComplete,
}) => {
  const [matchState, setMatchState] = useState<MatchState>(initialMatchState);
  const [currentRoll, setCurrentRoll] = useState<GameResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [matchComplete, setMatchComplete] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const setsToWin = bestOf === 3 ? 2 : 3;
  const rankingDiff = player2.fictionalRanking - player1.fictionalRanking;
  const advantageLevel = getAdvantageLevel(rankingDiff);
  const favoredPlayer = rankingDiff > 0 ? player1 : rankingDiff < 0 ? player2 : null;

  const playGame = useCallback((
    server: Player,
    receiver: Player,
    advLevel: AdvantageLevel,
    isHigherRankedServing: boolean,
    gameNum: number,
    isTiebreak: boolean
  ): GameResult => {
    let serverRoll = rollDice();
    let receiverRoll = rollDice();
    let serverSecondRoll: number | undefined;
    let receiverSecondRoll: number | undefined;
    
    // Apply advantage rules
    if (!isTiebreak || advLevel === "clear" || advLevel === "dominant") {
      if (isHigherRankedServing) {
        switch (advLevel) {
          case "small":
            if (gameNum % 2 === 0 && serverRoll < receiverRoll) {
              serverSecondRoll = rollDice();
              if (serverSecondRoll >= receiverRoll) {
                serverRoll = serverSecondRoll;
              }
            }
            break;
          case "clear":
          case "dominant":
            if (serverRoll < receiverRoll) {
              serverSecondRoll = rollDice();
              if (serverSecondRoll >= receiverRoll) {
                serverRoll = serverSecondRoll;
              }
            }
            break;
        }
      } else if (advLevel === "dominant" && !isTiebreak) {
        if (gameNum % 2 === 0 && receiverRoll <= serverRoll) {
          receiverSecondRoll = rollDice();
          if (receiverSecondRoll > serverRoll) {
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
  }, []);

  const rollForGame = async () => {
    setIsRolling(true);
    
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

    const { isPlayer1Serving, isTiebreak, gameNumber, tbPointNumber } = matchState;
    const server = isPlayer1Serving ? player1 : player2;
    const receiver = isPlayer1Serving ? player2 : player1;
    const isHigherRankedServing = (rankingDiff > 0 && isPlayer1Serving) || (rankingDiff < 0 && !isPlayer1Serving);
    
    const gameResult = playGame(
      server,
      receiver,
      advantageLevel,
      isHigherRankedServing,
      isTiebreak ? tbPointNumber : gameNumber,
      isTiebreak
    );
    
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
    let { player1Games, player2Games, player1Sets, player2Sets, isPlayer1Serving, sets, games, currentSetGames, gameNumber } = prev;
    
    // Update game score
    if (isP1Serving) {
      if (gameResult.serverWon) player1Games++;
      else player2Games++;
    } else {
      if (gameResult.serverWon) player2Games++;
      else player1Games++;
    }
    
    currentSetGames = [...currentSetGames, gameResult];
    gameNumber++;
    
    // Check for tiebreak
    if (player1Games === 6 && player2Games === 6) {
      return {
        ...prev,
        player1Games,
        player2Games,
        isPlayer1Serving: !isPlayer1Serving,
        isTiebreak: true,
        currentSetGames,
        gameNumber,
        player1TBPoints: 0,
        player2TBPoints: 0,
        tbPointNumber: 0,
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
          isPlayer1Serving: !isPlayer1Serving,
          gameNumber: 0,
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
        isPlayer1Serving: !isPlayer1Serving,
        gameNumber: 0,
      };
    }
    
    return {
      ...prev,
      player1Games,
      player2Games,
      isPlayer1Serving: !isPlayer1Serving,
      currentSetGames,
      gameNumber,
    };
  };

  const updateTiebreakState = (prev: MatchState, gameResult: GameResult, isP1Serving: boolean): MatchState => {
    let { player1TBPoints, player2TBPoints, player1Sets, player2Sets, isPlayer1Serving, sets, games, currentSetGames, tbPointNumber } = prev;
    
    // Update tiebreak score
    if (isP1Serving) {
      if (gameResult.serverWon) player1TBPoints++;
      else player2TBPoints++;
    } else {
      if (gameResult.serverWon) player2TBPoints++;
      else player1TBPoints++;
    }
    
    currentSetGames = [...currentSetGames, gameResult];
    tbPointNumber++;
    
    // Tiebreak serve rotation
    let newIsPlayer1Serving = isPlayer1Serving;
    if (tbPointNumber === 1 || (tbPointNumber > 1 && (tbPointNumber - 1) % 2 === 0)) {
      newIsPlayer1Serving = !isPlayer1Serving;
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
          isPlayer1Serving: !prev.isPlayer1Serving,
          tbPointNumber: 0,
          gameNumber: 0,
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
        isPlayer1Serving: !prev.isPlayer1Serving,
        tbPointNumber: 0,
        gameNumber: 0,
      };
    }
    
    return {
      ...prev,
      player1TBPoints,
      player2TBPoints,
      isPlayer1Serving: newIsPlayer1Serving,
      currentSetGames,
      tbPointNumber,
    };
  };

  const simulateInstant = () => {
    // Use the original playMatch function for instant simulation
    import("@/lib/matchEngine").then(({ playMatch }) => {
      const matchResult = playMatch(player1, player2, bestOf);
      setResult(matchResult);
      setMatchComplete(true);
      setMatchState({
        ...initialMatchState,
        player1Sets: matchResult.player1Sets,
        player2Sets: matchResult.player2Sets,
        sets: matchResult.sets,
        games: matchResult.games,
      });
      onMatchComplete?.(matchResult);
    });
  };

  const resetMatch = () => {
    setMatchState(initialMatchState);
    setCurrentRoll(null);
    setMatchComplete(false);
    setResult(null);
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
              value={matchState.isPlayer1Serving ? currentRoll.serverRoll : currentRoll.receiverRoll} 
              isRolling={isRolling} 
              size="lg" 
              variant="primary" 
            />
            <p className="text-xs text-muted-foreground mt-1">{player1.name.split(" ").pop()}</p>
            {currentRoll.serverSecondRoll && matchState.isPlayer1Serving && (
              <p className="text-xs text-primary">2nd: {currentRoll.serverSecondRoll}</p>
            )}
          </div>
          <div className="text-xl font-display font-bold text-muted-foreground">VS</div>
          <div className="text-center">
            <Dice 
              value={matchState.isPlayer1Serving ? currentRoll.receiverRoll : currentRoll.serverRoll} 
              isRolling={isRolling} 
              size="lg" 
              variant="secondary" 
            />
            <p className="text-xs text-muted-foreground mt-1">{player2.name.split(" ").pop()}</p>
            {currentRoll.receiverSecondRoll && !matchState.isPlayer1Serving && (
              <p className="text-xs text-primary">2nd: {currentRoll.receiverSecondRoll}</p>
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
          {matchState.isPlayer1Serving 
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
              onClick={simulateInstant}
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
