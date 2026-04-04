import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Save, FolderOpen, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SaveSlot {
  name: string;
  timestamp: number;
  season: number;
  week: number;
  playerName?: string;
}

interface SaveLoadDialogProps {
  currentSaveName?: string;
  getSaveSlots: () => SaveSlot[];
  onSave: (name: string) => void;
  onLoad: (name: string) => boolean;
  onDelete: (name: string) => void;
  mode: 'tour' | 'career';
}

const SaveLoadDialog: React.FC<SaveLoadDialogProps> = ({
  currentSaveName, getSaveSlots, onSave, onLoad, onDelete, mode,
}) => {
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState(currentSaveName || '');
  const [tab, setTab] = useState<'save' | 'load'>('save');

  const slots = getSaveSlots();

  const handleSave = () => {
    if (!saveName.trim()) {
      toast.error('Ingresa un nombre para la partida');
      return;
    }
    onSave(saveName.trim());
    toast.success(`Partida "${saveName.trim()}" guardada`);
    setOpen(false);
  };

  const handleLoad = (name: string) => {
    const success = onLoad(name);
    if (success) {
      toast.success(`Partida "${name}" cargada`);
      setOpen(false);
    } else {
      toast.error('Error al cargar la partida');
    }
  };

  const handleDelete = (name: string) => {
    onDelete(name);
    toast.info(`Partida "${name}" eliminada`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="gap-1">
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save/Load</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Saves</DialogTitle>
          <DialogDescription>
            Save or load your {mode === 'career' ? 'career' : 'tour'} progress
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'save' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('save')}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button
            variant={tab === 'load' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('load')}
            className="flex-1"
          >
            <FolderOpen className="w-4 h-4 mr-1" /> Load
          </Button>
        </div>

        {tab === 'save' && (
          <div className="space-y-3">
            <Input
              placeholder="Save name..."
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" /> Save Game
            </Button>
            {slots.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Or overwrite existing:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {slots.map(slot => (
                    <button
                      key={slot.name}
                      onClick={() => { setSaveName(slot.name); }}
                      className="w-full text-left px-3 py-2 rounded-md bg-secondary/50 hover:bg-secondary text-sm transition-colors"
                    >
                      <div className="font-medium">{slot.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Season {slot.season} Week {slot.week}
                        {slot.playerName && ` • ${slot.playerName}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'load' && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {slots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No saved games found</p>
            )}
            {slots.map(slot => (
              <div key={slot.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{slot.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Season {slot.season} Week {slot.week}
                    {slot.playerName && ` • ${slot.playerName}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(slot.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button size="sm" variant="default" onClick={() => handleLoad(slot.name)}>
                    <FolderOpen className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(slot.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveLoadDialog;
