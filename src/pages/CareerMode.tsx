import React, { useState, useMemo } from 'react';
import { useCareerState } from '@/hooks/useCareerState';
import CareerCreation from '@/components/career/CareerCreation';
import CareerDashboard from '@/components/career/CareerDashboard';
import CareerCalendar from '@/components/career/CareerCalendar';
import PlayerDevelopment from '@/components/career/PlayerDevelopment';
import CareerFinances from '@/components/career/CareerFinances';
import CareerPhysical from '@/components/career/CareerPhysical';
import CareerResults from '@/components/career/CareerResults';
import CareerObjectives from '@/components/career/CareerObjectives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Home, Calendar, TrendingUp, DollarSign, Heart, Trophy, Target, RotateCcw, ChevronRight, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const CareerMode = () => {
  const career = useCareerState();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!career.isCreated || !career.player) {
    return <CareerCreation onCreatePlayer={career.createPlayer} />;
  }

  const handleAdvanceWeek = () => {
    career.advanceWeek();
    toast.info(`Avanzaste a la semana ${career.currentWeek >= 52 ? 1 : career.currentWeek + 1}`);
  };

  const handleSave = () => {
    career.saveCareer();
    toast.success('Career saved!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-5 h-5" />
              </Link>
              <div className="w-px h-6 bg-border" />
              <div>
                <h1 className="font-display text-lg font-bold text-foreground tracking-wide">
                  CAREER MODE
                </h1>
                <p className="text-xs text-muted-foreground">
                  {career.player.firstName} {career.player.lastName} • Rank #{career.player.officialRanking}
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
              <Button size="sm" variant="secondary" onClick={handleSave} className="gap-1">
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
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
                    <AlertDialogDescription>
                      This will delete your entire career progress. This cannot be undone.
                    </AlertDialogDescription>
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

      {/* Main */}
      <main className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 lg:w-auto lg:inline-grid mb-6">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Dashboard</span>
              <span className="lg:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Calendar</span>
              <span className="lg:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="development" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Development</span>
              <span className="lg:hidden">Dev</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-1.5 text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Finances</span>
              <span className="lg:hidden">$</span>
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
          <div className="flex gap-2 mb-4 lg:hidden">
            {['physical', 'results', 'objectives'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                }`}
              >
                {tab === 'physical' ? '❤️ Physical' : tab === 'results' ? '🏆 Results' : '🎯 Goals'}
              </button>
            ))}
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <CareerDashboard
              player={career.player}
              currentWeek={career.currentWeek}
              currentSeason={career.currentSeason}
              weeklyActionTaken={career.weeklyActionTaken}
              onPlayTournament={career.playTournament}
              onTrain={career.train}
              onRest={career.rest}
              completedTournaments={career.completedTournaments}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <CareerCalendar
              player={career.player}
              currentWeek={career.currentWeek}
              completedTournaments={career.completedTournaments}
            />
          </TabsContent>
          <TabsContent value="development" className="mt-0">
            <PlayerDevelopment player={career.player} onSpendDP={career.spendDP} />
          </TabsContent>
          <TabsContent value="finances" className="mt-0">
            <CareerFinances player={career.player} />
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
