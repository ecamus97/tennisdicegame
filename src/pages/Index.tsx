import React, { useState } from "react";
import { tournaments, Tournament, Player } from "@/data/players";
import { useGameState } from "@/hooks/useGameState";
import RankingsView from "@/components/RankingsView";
import CalendarView from "@/components/CalendarView";
import CurrentWeekView from "@/components/CurrentWeekView";
import PlayerDetailDialog from "@/components/PlayerDetailDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Play, Dice1, RotateCcw, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Index = () => {
  const { 
    players, 
    currentWeek, 
    currentSeason, 
    completedTournaments,
    advanceWeek,
    addTournamentResult,
    resetGame,
    updateFictionalRanking,
    saveGame,
  } = useGameState();
  
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(
    tournaments.find(t => t.week === 1) || null
  );
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerDialogOpen(true);
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setActiveTab("current");
  };

  const handleTournamentComplete = (
    tournamentId: string,
    results: { playerId: number; points: number; round: string }[],
    winnerId: number,
    runnerUpId: number
  ) => {
    addTournamentResult(tournamentId, results, winnerId, runnerUpId);
    toast.success("Tournament results saved! Points have been awarded.");
  };

  const handleSaveGame = () => {
    saveGame();
    toast.success("Game progress saved!");
  };

  const handleAdvanceWeek = () => {
    advanceWeek();
    // Auto-select next week's tournament
    const nextTournament = tournaments.find(t => t.week === (currentWeek >= 52 ? 1 : currentWeek + 1));
    if (nextTournament) {
      setSelectedTournament(nextTournament);
    }
    toast.info(`Advanced to Week ${currentWeek >= 52 ? 1 : currentWeek + 1}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Dice1 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground tracking-wide">
                  TENNIS DICE TOUR
                </h1>
                <p className="text-xs text-muted-foreground">ATP Simulation Game</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">Season {currentSeason}</div>
                <div className="text-xs text-muted-foreground">Week {currentWeek}</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-primary">
                  {selectedTournament?.name || "No Tournament"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedTournament ? `${selectedTournament.city}, ${selectedTournament.country}` : "Select from calendar"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={handleSaveGame}
                  className="gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAdvanceWeek}
                  className="gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">Next Week</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Game?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all progress, rankings, and tournament history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetGame}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="current" className="gap-2">
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Current Week</span>
              <span className="sm:hidden">Play</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Rankings</span>
              <span className="sm:hidden">Rank</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Panel */}
            <div className="lg:col-span-2">
              <TabsContent value="current" className="mt-0">
                {selectedTournament ? (
                  <CurrentWeekView
                    tournament={selectedTournament}
                    players={players}
                    onTournamentComplete={handleTournamentComplete}
                    isCompleted={completedTournaments.includes(selectedTournament.id)}
                  />
                ) : (
                  <div className="glass-card p-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      No Tournament Selected
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select a tournament from the calendar to start playing
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="rankings" className="mt-0">
                <RankingsView players={players} onPlayerSelect={handlePlayerSelect} />
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                <CalendarView
                  currentWeek={currentWeek}
                  onTournamentSelect={handleTournamentSelect}
                />
              </TabsContent>
            </div>

            {/* Sidebar - Quick Stats */}
            <div className="space-y-4">
              {/* Season Progress */}
              <div className="glass-card p-4">
                <h3 className="font-display font-semibold text-foreground mb-3">
                  Season {currentSeason} Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Week</span>
                    <span className="text-foreground font-medium">{currentWeek} / 52</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${(currentWeek / 52) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Australian Open</span>
                    <span>ATP Finals</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                    Completed: {completedTournaments.length} tournaments
                  </div>
                </div>
              </div>

              {/* Top 5 Players */}
              <div className="glass-card p-4">
                <h3 className="font-display font-semibold text-foreground mb-3">
                  🏆 Top 5 (Live Ranking)
                </h3>
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => b.livePoints - a.livePoints)
                    .slice(0, 5)
                    .map((player, index) => (
                    <div 
                      key={player.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30"
                    >
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? "bg-medal-gold text-primary-foreground" :
                          index === 1 ? "bg-medal-silver text-primary-foreground" :
                          index === 2 ? "bg-medal-bronze text-primary-foreground" :
                          "bg-muted text-muted-foreground"}
                      `}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {player.name}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {player.livePoints.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Tournaments */}
              <div className="glass-card p-4">
                <h3 className="font-display font-semibold text-foreground mb-3">
                  📅 Upcoming
                </h3>
                <div className="space-y-2">
                  {tournaments
                    .filter(t => t.week >= currentWeek)
                    .slice(0, 4)
                    .map(tournament => (
                      <button
                        key={tournament.id}
                        className="w-full text-left p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">
                            {tournament.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            W{tournament.week}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tournament.category}
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Game Rules */}
              <div className="glass-card p-4">
                <h3 className="font-display font-semibold text-foreground mb-3">
                  🎲 Dice Rules
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Server wins if roll ≥ receiver</p>
                  <p>• Receiver breaks if roll {'>'} server</p>
                  <p>• Ranking difference = advantage</p>
                  <p className="text-primary">• 16+ diff: small advantage</p>
                  <p className="text-primary">• 32+ diff: clear advantage</p>
                  <p className="text-primary">• 64+ diff: dominant</p>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tennis Dice Tour - ATP Simulation Game</span>
            <span>Season 2026</span>
          </div>
        </div>
      </footer>

      {/* Player Detail Dialog */}
      <PlayerDetailDialog
        player={selectedPlayer}
        open={playerDialogOpen}
        onOpenChange={setPlayerDialogOpen}
        onUpdateFictionalRanking={updateFictionalRanking}
      />
    </div>
  );
};

export default Index;
