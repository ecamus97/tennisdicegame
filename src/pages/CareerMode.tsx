import React, { useState, useMemo } from 'react';
import { useCareerState, listCareerSaveSlots } from '@/hooks/useCareerState';
import CareerCreation from '@/components/career/CareerCreation';
import CareerDashboard from '@/components/career/CareerDashboard';
import CareerCalendar from '@/components/career/CareerCalendar';
import PlayerDevelopment from '@/components/career/PlayerDevelopment';
import CareerFinances from '@/components/career/CareerFinances';
import CareerPhysical from '@/components/career/CareerPhysical';
import CareerResults from '@/components/career/CareerResults';
import CareerObjectives from '@/components/career/CareerObjectives';
import CareerRankings from '@/components/career/CareerRankings';
import CareerSponsors from '@/components/career/CareerSponsors';
import CareerStaff from '@/components/career/CareerStaff';
import CurrentWeekView from '@/components/CurrentWeekView';
import SeasonSummaryDialog from '@/components/SeasonSummaryDialog';
import SaveLoadDialog from '@/components/SaveLoadDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Home, Calendar, TrendingUp, DollarSign, Heart, Trophy, Target, RotateCcw, ChevronRight, Save, Award, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { tournaments, Tournament } from '@/data/players';
import { CAREER_PLAYER_ID, powerScoreToFictionalRanking } from '@/data/careerData';

const CareerMode = () => {
  const career = useCareerState();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!career.isCreated || !career.player) {
    return <CareerCreation onCreatePlayer={career.createPlayer} />;
  }

  // If we're in an active tournament, show the tournament bracket view
  if (career.activeTournament) {
    const isSpectator = career.activeTournament.startsWith('spectator-');
    const tournamentId = isSpectator ? career.activeTournament.replace('spectator-', '') : career.activeTournament;
    const tournament = career.allCareerTournaments.find((t: Tournament) => t.id === tournamentId);
    if (tournament) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={career.leaveTournament} className="gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <div className="w-px h-6 bg-border" />
                  <div>
                    <h1 className="font-display text-lg font-bold text-foreground">{tournament.name}</h1>
                    <p className="text-xs text-muted-foreground">
                      {isSpectator ? 'Spectator Mode' : `${career.player.firstName} ${career.player.lastName} • Rank #${career.player.officialRanking}`}
                    </p>
                  </div>
                </div>
                {!isSpectator && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Fictional Rank:</span>
                    <span className="font-bold text-primary">#{powerScoreToFictionalRanking(career.player.fictionalRankingScore)}</span>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-4">
            <CurrentWeekView
              key={career.activeTournament}
              tournament={tournament}
              players={career.allPlayersWithCareer}
              initialForcedEntrants={isSpectator ? [] : career.allPlayersWithCareer.filter(p => p.id === CAREER_PLAYER_ID)}
              onTournamentComplete={(tid, results, winnerId, runnerUpId) => {
                if (isSpectator) {
                  // For spectator mode, treat as simulating the other tournament
                  career.completeTournament(tid, results, winnerId, runnerUpId);
                } else {
                  career.completeTournament(tid, results, winnerId, runnerUpId);
                  const careerResult = results.find(r => r.playerId === CAREER_PLAYER_ID);
                  if (careerResult?.round === 'Winner') {
                    toast.success(`🏆 You won ${tournament.name}!`);
                  } else {
                    toast.info(`${tournament.name}: ${careerResult?.round || 'Eliminated'}`);
                  }
                }
              }}
              isCompleted={career.completedTournaments.includes(tournamentId)}
              savedDraw={career.currentDraw}
              onSaveDraw={career.saveCurrentDraw}
            />
          </main>
        </div>
      );
    }
  }

  const handleAdvanceWeek = () => {
    career.advanceWeek();
    toast.info(`Advanced to Week ${career.currentWeek >= 52 ? 1 : career.currentWeek + 1}`);
  };

  const handleSave = (name?: string) => {
    career.saveCareer(name);
    toast.success('Career saved!');
  };

  const fictionalRank = powerScoreToFictionalRanking(career.player.fictionalRankingScore);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div className="w-px h-6 bg-border" />
              <div>
                <h1 className="font-display text-lg font-bold text-foreground tracking-wide">CAREER MODE</h1>
                <p className="text-xs text-muted-foreground">
                  {career.player.firstName} {career.player.lastName} • Official #{career.player.officialRanking} • Fictional #{fictionalRank}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-foreground">Season {career.currentSeason}</div>
                <div className="text-xs text-muted-foreground">Week {career.currentWeek}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground">Money</div>
                  <div className="text-sm font-medium text-accent">${career.player.money.toLocaleString()}</div>
                </div>
                <div className="w-px h-6 bg-border hidden md:block" />
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground">Energy</div>
                  <div className={`text-sm font-medium ${career.player.energy > 50 ? 'text-green-400' : career.player.energy > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(career.player.energy)}%
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <SaveLoadDialog
                currentSaveName={(career as any).saveName}
                getSaveSlots={listCareerSaveSlots}
                onSave={(name) => handleSave(name)}
                onLoad={(name) => career.loadCareer(name)}
                onDelete={(name) => career.deleteCareerSave(name)}
                mode="career"
              />
              <Button size="sm" variant="outline" onClick={handleAdvanceWeek} className="gap-1">
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
                    <AlertDialogTitle>Reset Career?</AlertDialogTitle>
                    <AlertDialogDescription>This will delete your entire career progress.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={career.resetCareer}>Reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 lg:w-auto lg:inline-grid mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Dashboard</span>
              <span className="lg:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="gap-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Rankings</span>
              <span className="lg:hidden">Rank</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Calendar</span>
              <span className="lg:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="development" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Develop</span>
              <span className="lg:hidden">Dev</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Finances</span>
              <span className="lg:hidden">$</span>
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="gap-1.5 text-xs hidden lg:flex">
              <Award className="w-3.5 h-3.5" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5 text-xs hidden lg:flex">
              <Users className="w-3.5 h-3.5" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="physical" className="gap-1.5 text-xs hidden lg:flex">
              <Heart className="w-3.5 h-3.5" />
              Physical
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-1.5 text-xs hidden lg:flex">
              <Trophy className="w-3.5 h-3.5" />
              Results
            </TabsTrigger>
            <TabsTrigger value="objectives" className="gap-1.5 text-xs hidden lg:flex">
              <Target className="w-3.5 h-3.5" />
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Mobile-only extra tabs */}
          <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
            {['sponsors', 'staff', 'physical', 'results', 'objectives'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                {tab === 'sponsors' ? '🤝 Sponsors' : tab === 'staff' ? '👥 Staff' : tab === 'physical' ? '❤️ Physical' : tab === 'results' ? '🏆 Results' : '🎯 Goals'}
              </button>
            ))}
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <CareerDashboard
              player={career.player}
              currentWeek={career.currentWeek}
              currentSeason={career.currentSeason}
              weeklyActionTaken={career.weeklyActionTaken}
              onEnterTournament={career.enterTournament}
              onQuickSimTournament={career.quickSimTournament}
              onTrain={career.train}
              onRest={career.rest}
              completedTournaments={career.completedTournaments}
              allTournaments={career.allCareerTournaments}
              onSimulateOtherTournament={career.simulateOtherTournament}
              onSimulateAllOtherTournaments={career.simulateAllOtherTournaments}
              onEnterOtherTournament={career.enterOtherTournament}
              tournamentHistory={career.tournamentHistory}
            />
          </TabsContent>
          <TabsContent value="rankings" className="mt-0">
            <CareerRankings players={career.allPlayersWithCareer} careerPlayerId={CAREER_PLAYER_ID} />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <CareerCalendar
              player={career.player}
              currentWeek={career.currentWeek}
              currentSeason={career.currentSeason}
              completedTournaments={career.completedTournaments}
              allTournaments={career.allCareerTournaments}
              tournamentHistory={career.tournamentHistory}
            />
          </TabsContent>
          <TabsContent value="development" className="mt-0">
            <PlayerDevelopment player={career.player} onSpendDP={career.spendDP} />
          </TabsContent>
          <TabsContent value="finances" className="mt-0">
            <CareerFinances player={career.player} />
          </TabsContent>
          <TabsContent value="sponsors" className="mt-0">
            <CareerSponsors
              player={career.player}
              onSign={career.signSponsor}
              onCancel={career.cancelSponsor}
            />
          </TabsContent>
          <TabsContent value="staff" className="mt-0">
            <CareerStaff
              player={career.player}
              onHire={career.hireStaff}
              onFire={career.fireStaff}
            />
          </TabsContent>
          <TabsContent value="physical" className="mt-0">
            <CareerPhysical player={career.player} />
          </TabsContent>
          <TabsContent value="results" className="mt-0">
            <CareerResults player={career.player} currentSeason={career.currentSeason} />
          </TabsContent>
          <TabsContent value="objectives" className="mt-0">
            <CareerObjectives player={career.player} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CareerMode;
