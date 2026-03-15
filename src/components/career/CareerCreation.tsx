import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archetype, ARCHETYPE_BONUSES, COUNTRIES, BASE_ATTRIBUTES } from '@/data/careerData';
import { Surface } from '@/data/players';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap, Shield, Sword, Target, Flame, Star } from 'lucide-react';

const archetypes: { type: Archetype; icon: React.ReactNode; desc: string; color: string }[] = [
  { type: 'Balanced', icon: <Star className="w-5 h-5" />, desc: 'Well-rounded with no weaknesses', color: 'from-blue-500 to-cyan-500' },
  { type: 'Aggressive', icon: <Sword className="w-5 h-5" />, desc: 'Powerful serve and big shots', color: 'from-red-500 to-orange-500' },
  { type: 'Defensive', icon: <Shield className="w-5 h-5" />, desc: 'Excellent return and consistency', color: 'from-green-500 to-emerald-500' },
  { type: 'Server', icon: <Zap className="w-5 h-5" />, desc: 'Dominant serve, ace machine', color: 'from-purple-500 to-violet-500' },
  { type: 'Clutch', icon: <Target className="w-5 h-5" />, desc: 'Thrives under pressure', color: 'from-yellow-500 to-amber-500' },
  { type: 'Prospect', icon: <Flame className="w-5 h-5" />, desc: 'High physical potential, raw talent', color: 'from-pink-500 to-rose-500' },
];

interface Props {
  onCreatePlayer: (data: {
    firstName: string; lastName: string; nationality: string; countryCode: string;
    age: number; hand: 'Right' | 'Left'; favoriteSurface?: Surface; archetype: Archetype;
  }) => void;
}

const CareerCreation: React.FC<Props> = ({ onCreatePlayer }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('ESP');
  const [age, setAge] = useState(18);
  const [hand, setHand] = useState<'Right' | 'Left'>('Right');
  const [favSurface, setFavSurface] = useState<Surface | ''>('');
  const [archetype, setArchetype] = useState<Archetype>('Balanced');

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode);

  const handleCreate = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    onCreatePlayer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality: selectedCountry?.name || 'Unknown',
      countryCode,
      age,
      hand,
      favoriteSurface: favSurface || undefined,
      archetype,
    });
  };

  const bonuses = ARCHETYPE_BONUSES[archetype];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">CREATE YOUR PLAYER</h1>
            <p className="text-sm text-muted-foreground">Start your tennis career journey</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Roger" className="mt-1" />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Federer" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Nationality</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age</Label>
              <Select value={String(age)} onValueChange={v => setAge(Number(v))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => i + 17).map(a => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hand</Label>
              <Select value={hand} onValueChange={v => setHand(v as 'Right' | 'Left')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Favorite Surface (optional)</Label>
            <Select value={favSurface} onValueChange={v => setFavSurface(v as Surface | '')}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="Hard">🔵 Hard</SelectItem>
                <SelectItem value="Clay">🟤 Clay</SelectItem>
                <SelectItem value="Grass">🟢 Grass</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Archetype Selection */}
        <div className="glass-card p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">PLAYING STYLE</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {archetypes.map(a => (
              <button
                key={a.type}
                onClick={() => setArchetype(a.type)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  archetype === a.type
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/50 hover:border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white mb-2`}>
                  {a.icon}
                </div>
                <div className="font-display font-semibold text-sm text-foreground">{a.type}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
              </button>
            ))}
          </div>

          {/* Preview bonuses */}
          <div className="mt-4 p-3 rounded-lg bg-secondary/30">
            <div className="text-xs text-muted-foreground mb-2">Attribute Bonuses for <span className="text-primary font-semibold">{archetype}</span>:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(bonuses).map(([key, val]) => val ? (
                <span key={key} className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                  {key}: +{val}
                </span>
              ) : null)}
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full font-display text-lg"
          disabled={!firstName.trim() || !lastName.trim()}
          onClick={handleCreate}
        >
          START CAREER
        </Button>
      </div>
    </div>
  );
};

export default CareerCreation;
